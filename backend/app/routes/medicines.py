
import json
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from fastapi import Request

from app.database import get_db_connection
from app.dependencies import get_current_user
from app.upload import save_medicine_image, delete_medicine_image


router = APIRouter()


def validate_intake_times(intake_times):
    if not isinstance(intake_times, list) or not intake_times:
        raise HTTPException(
            status_code=400,
            detail="At least one intake time is required."
        )

    for intake_time in intake_times:
        try:
            datetime.strptime(intake_time, "%H:%M")
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid intake time format. Use HH:MM."
            )

    if len(intake_times) != len(set(intake_times)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate intake times are not allowed."
        )


@router.post("/", status_code=201)
async def add_medicine(
    medicine_name: str = Form(...),
    dosage: str = Form(...),
    category: str = Form(...),
    reason: str = Form(...),
    start_date: str = Form(...),
    end_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    intake_times: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    if not all([medicine_name.strip(), dosage.strip(), category, reason.strip(), start_date]):
        raise HTTPException(status_code=400, detail="Please fill in all required fields.")

    if category not in ["Maintenance", "Temporary"]:
        raise HTTPException(status_code=400, detail="Invalid medicine category.")

    try:
        date.fromisoformat(start_date)
        if end_date:
            parsed_end_date = date.fromisoformat(end_date)
            if parsed_end_date < date.fromisoformat(start_date):
                raise HTTPException(status_code=400, detail="End date cannot be earlier than start date.")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format.")

    try:
        try:
            times = json.loads(intake_times)
        except (ValueError, TypeError):
            times = [
                time.strip()
                for time in intake_times.split(",")
                if time.strip()
            ]

        validate_intake_times(times)

    except HTTPException:
        raise
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid intake times.")

    image_path = None
    if image and image.filename:
        image_path = await save_medicine_image(image)

    connection = get_db_connection()
    if connection is None:
        if image_path:
            delete_medicine_image(image_path)
        raise HTTPException(status_code=500, detail="Database connection failed.")

    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO medicines
            (user_id, medicine_name, dosage, category, reason,
             start_date, end_date, image, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                current_user["id"], medicine_name.strip(), dosage.strip(),
                category, reason.strip(), start_date, end_date or None,
                image_path, notes or None
            )
        )

        medicine_id = cursor.lastrowid

        for intake_time in times:
            cursor.execute(
                """
                INSERT INTO medicine_schedules
                (user_id, medicine_id, intake_time)
                VALUES (%s, %s, %s)
                """,
                (current_user["id"], medicine_id, intake_time)
            )

        connection.commit()

        return {
            "message": "Medicine added successfully.",
            "medicineId": medicine_id
        }

    except Exception:
        connection.rollback()
        if image_path:
            delete_medicine_image(image_path)
        raise HTTPException(status_code=500, detail="Failed to add medicine.")

    finally:
        cursor.close()
        connection.close()


@router.get("/")
def get_medicines(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    cursor = connection.cursor(dictionary=True)

    try:
        # GET ALL MEDICINES
        cursor.execute(
            """
            SELECT * FROM medicines
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (current_user["id"],)
        )

        medicines = cursor.fetchall()

        # GET ALL INTAKE TIMES
        cursor.execute(
            """
            SELECT
                medicine_id,
                TIME_FORMAT(intake_time, '%H:%i') AS intake_time
            FROM medicine_schedules
            WHERE user_id = %s
            ORDER BY medicine_id, intake_time ASC
            """,
            (current_user["id"],)
        )

        schedules = cursor.fetchall()

        # GROUP INTAKE TIMES BY MEDICINE ID
        intake_times_by_medicine = {}

        for schedule in schedules:
            medicine_id = schedule["medicine_id"]

            if medicine_id not in intake_times_by_medicine:
                intake_times_by_medicine[medicine_id] = []

            intake_times_by_medicine[medicine_id].append(
                schedule["intake_time"]
            )

        # ATTACH INTAKE TIMES TO EACH MEDICINE
        for medicine in medicines:
            medicine["intake_times"] = intake_times_by_medicine.get(
                medicine["id"], []
            )

        return {
            "message": "Medicines retrieved successfully.",
            "medicines": medicines
        }

    finally:
        cursor.close()
        connection.close()


@router.get("/today-schedules")
def get_today_schedules(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                s.medicine_id,
                m.medicine_name,
                m.dosage,
                m.image,
                s.intake_time,
                (
                    SELECT h.status
                    FROM medicine_history h
                    WHERE h.user_id = s.user_id
                      AND h.medicine_id = s.medicine_id
                      AND h.intake_date = CURDATE()
                      AND h.intake_time = s.intake_time
                    ORDER BY h.created_at DESC, h.id DESC
                    LIMIT 1
                ) AS status
            FROM medicine_schedules s
            JOIN medicines m ON m.id = s.medicine_id
            WHERE s.user_id = %s
              AND CURDATE() >= m.start_date
              AND (m.end_date IS NULL OR CURDATE() <= m.end_date)
            ORDER BY s.intake_time ASC
            """,
            (current_user["id"],)
        )

        schedules = cursor.fetchall()

        for schedule in schedules:
            if schedule["intake_time"]:
                schedule["intake_time"] = str(schedule["intake_time"])

        return {
            "message": "Today's schedules retrieved successfully.",
            "schedules": schedules
        }

    finally:
        cursor.close()
        connection.close()


@router.get("/{medicine_id}")
def get_medicine(
    medicine_id: int,
    current_user: dict = Depends(get_current_user)
):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT * FROM medicines
            WHERE id = %s AND user_id = %s
            """,
            (medicine_id, current_user["id"])
        )

        medicine = cursor.fetchone()

        if not medicine:
            raise HTTPException(status_code=404, detail="Medicine not found.")

        # GET EXISTING INTAKE TIMES
        cursor.execute(
            """
            SELECT intake_time
            FROM medicine_schedules
            WHERE medicine_id = %s AND user_id = %s
            ORDER BY intake_time ASC
            """,
            (medicine_id, current_user["id"])
        )

        schedules = cursor.fetchall()

        medicine["intake_times"] = [
            schedule["intake_time"].strftime("%H:%M")
            if hasattr(schedule["intake_time"], "strftime")
            else str(schedule["intake_time"])[:5]
            for schedule in schedules
        ]

        return {
            "message": "Medicine retrieved successfully.",
            "medicine": medicine
        }

    finally:
        cursor.close()
        connection.close()



@router.put("/{medicine_id}")
async def update_medicine(
    medicine_id: int,
    medicine_name: str = Form(None),
    dosage: str = Form(None),
    category: str = Form(None),
    reason: str = Form(None),
    start_date: str = Form(None),
    end_date: str = Form(""),
    notes: str = Form(""),
    intake_times: str = Form(None),
    image: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    connection = get_db_connection()

    if connection is None:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )

    cursor = connection.cursor(dictionary=True)
    new_image_path = None
    old_image_path = None

    try:
        cursor.execute(
            "SELECT * FROM medicines WHERE id = %s AND user_id = %s",
            (medicine_id, current_user["id"])
        )

        medicine = cursor.fetchone()

        if not medicine:
            raise HTTPException(
                status_code=404,
                detail="Medicine not found."
            )

        updates = {}

        fields = {
            "medicine_name": medicine_name,
            "dosage": dosage,
            "category": category,
            "reason": reason,
            "start_date": start_date,
            "end_date": end_date,
            "notes": notes
        }

        for field, value in fields.items():
            if value is not None:
                updates[field] = value if value != "" else None

        if category is not None and category not in ["Maintenance", "Temporary"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid medicine category."
            )

        final_start = updates.get(
            "start_date",
            str(medicine["start_date"])
        )

        final_end = updates.get(
            "end_date",
            str(medicine["end_date"]) if medicine["end_date"] else None
        )

        try:
            date.fromisoformat(final_start)

            if final_end and date.fromisoformat(final_end) < date.fromisoformat(final_start):
                raise HTTPException(
                    status_code=400,
                    detail="End date cannot be earlier than start date."
                )

        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format."
            )

        parsed_times = None

        if intake_times is not None:
            try:
                try:
                    parsed_times = json.loads(intake_times)
                except (ValueError, TypeError):
                    parsed_times = [
                        time.strip()
                        for time in intake_times.split(",")
                        if time.strip()
                    ]

                validate_intake_times(parsed_times)

            except HTTPException:
                raise
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid intake times."
                )

        if image is not None and image.filename:
            new_image_path = await save_medicine_image(image)
            updates["image"] = new_image_path
            old_image_path = medicine["image"]

        if not updates and parsed_times is None:
            raise HTTPException(
                status_code=400,
                detail="No changes provided."
            )

        if updates:
            set_clause = ", ".join(
                f"{field} = %s" for field in updates
            )

            values = list(updates.values()) + [
                medicine_id,
                current_user["id"]
            ]

            cursor.execute(
                f"""
                UPDATE medicines
                SET {set_clause}
                WHERE id = %s AND user_id = %s
                """,
                values
            )

        if parsed_times is not None:
            cursor.execute(
                """
                DELETE FROM medicine_schedules
                WHERE medicine_id = %s AND user_id = %s
                """,
                (medicine_id, current_user["id"])
            )

            for intake_time in parsed_times:
                cursor.execute(
                    """
                    INSERT INTO medicine_schedules
                    (user_id, medicine_id, intake_time)
                    VALUES (%s, %s, %s)
                    """,
                    (current_user["id"], medicine_id, intake_time)
                )

        connection.commit()

        if old_image_path:
            delete_medicine_image(old_image_path)

        return {
            "message": "Medicine updated successfully."
        }

    except HTTPException:
        connection.rollback()

        if new_image_path:
            delete_medicine_image(new_image_path)

        raise

    except Exception:
        connection.rollback()

        if new_image_path:
            delete_medicine_image(new_image_path)

        raise HTTPException(
            status_code=500,
            detail="Failed to update medicine."
        )

    finally:
        cursor.close()
        connection.close()


@router.delete("/{medicine_id}")
def delete_medicine(
    medicine_id: int,
    current_user: dict = Depends(get_current_user)
):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT image FROM medicines WHERE id = %s AND user_id = %s",
            (medicine_id, current_user["id"])
        )
        medicine = cursor.fetchone()

        if not medicine:
            raise HTTPException(status_code=404, detail="Medicine not found.")

        cursor.execute(
            "DELETE FROM medicines WHERE id = %s AND user_id = %s",
            (medicine_id, current_user["id"])
        )

        connection.commit()

        if medicine["image"]:
            delete_medicine_image(medicine["image"])

        return {"message": "Medicine deleted successfully."}

    except HTTPException:
        connection.rollback()
        raise

    except Exception:
        connection.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete medicine.")

    finally:
        cursor.close()
        connection.close()
