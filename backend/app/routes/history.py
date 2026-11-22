
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database import get_db_connection
from app.dependencies import get_current_user


router = APIRouter()


class HistoryRequest(BaseModel):
    medicine_id: int
    intake_date: date
    intake_time: str
    status: str
    notes: str | None = None


class HistoryUpdateRequest(BaseModel):
    intake_date: date | None = None
    intake_time: str | None = None
    status: str | None = None
    notes: str | None = None


VALID_STATUSES = ["Taken", "Missed", "Skipped"]


def validate_time(intake_time):
    try:
        datetime.strptime(intake_time, "%H:%M")
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid intake time format. Use HH:MM."
        )


@router.post("/", status_code=201)
def add_history(
    data: HistoryRequest,
    current_user: dict = Depends(get_current_user)
):
    print("RECEIVED STATUS:", data.status)
    print("RECEIVED TIME:", data.intake_time)

    if data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid history status: {data.status}"
        )

    try:
        validate_time(data.intake_time)
    except HTTPException:
        raise

    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id FROM medicines
            WHERE id = %s AND user_id = %s
            """,
            (data.medicine_id, current_user["id"])
        )

        medicine = cursor.fetchone()

        if not medicine:
            raise HTTPException(status_code=404, detail="Medicine not found.")

        cursor.execute(
            """
            SELECT id FROM medicine_history
            WHERE user_id = %s
            AND medicine_id = %s
            AND intake_date = %s
            AND intake_time = %s
            LIMIT 1
            """,
            (
                current_user["id"],
                data.medicine_id,
                data.intake_date,
                data.intake_time
            )
        )

        existing_history = cursor.fetchone()

        if existing_history:
            raise HTTPException(
                status_code=409,
                detail="This medicine intake has already been recorded."
            )

        cursor.execute(
            """
            INSERT INTO medicine_history
            (user_id, medicine_id, intake_date, intake_time, status, notes)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                current_user["id"],
                data.medicine_id,
                data.intake_date,
                data.intake_time,
                data.status,
                data.notes
            )
        )

        history_id = cursor.lastrowid
        connection.commit()

        return {
            "message": "Medicine history added successfully.",
            "historyId": history_id
        }

    except HTTPException:
        connection.rollback()
        raise

    except Exception:
        connection.rollback()
        raise HTTPException(status_code=500, detail="Failed to add history.")

    finally:
        cursor.close()
        connection.close()


@router.get("/")
def get_history(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                h.*,
                m.medicine_name,
                m.image
            FROM medicine_history h
            JOIN medicines m ON m.id = h.medicine_id
            WHERE h.user_id = %s
            ORDER BY h.intake_date DESC, h.intake_time DESC
            """,
            (current_user["id"],)
        )

        history = cursor.fetchall()

        for record in history:
            record["intake_time"] = str(record["intake_time"])

        return {
            "message": "Medicine history retrieved successfully.",
            "history": history
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
            schedule["intake_time"] = str(schedule["intake_time"])

        return {
            "message": "Today's schedules retrieved successfully.",
            "schedules": schedules
        }

    finally:
        cursor.close()
        connection.close()


@router.get("/today-summary")
def get_today_summary(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM medicine_schedules s
            JOIN medicines m ON m.id = s.medicine_id
            WHERE s.user_id = %s
              AND CURDATE() >= m.start_date
              AND (m.end_date IS NULL OR CURDATE() <= m.end_date)
            """,
            (current_user["id"],)
        )

        total = cursor.fetchone()["total"]

        cursor.execute(
            """
            SELECT COUNT(*) AS taken
            FROM medicine_schedules s
            JOIN medicines m ON m.id = s.medicine_id
            WHERE s.user_id = %s
              AND CURDATE() >= m.start_date
              AND (m.end_date IS NULL OR CURDATE() <= m.end_date)
              AND EXISTS (
                  SELECT 1
                  FROM medicine_history h
                  WHERE h.user_id = s.user_id
                    AND h.medicine_id = s.medicine_id
                    AND h.intake_date = CURDATE()
                    AND h.intake_time = s.intake_time
                    AND h.status = 'Taken'
              )
            """,
            (current_user["id"],)
        )

        taken = cursor.fetchone()["taken"]

        return {
            "message": "Today's summary retrieved successfully.",
            "total": total,
            "taken": taken
        }

    finally:
        cursor.close()
        connection.close()


@router.get("/{history_id}")
def get_one_history(
    history_id: int,
    current_user: dict = Depends(get_current_user)
):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT 
                h.*, 
                m.medicine_name,
                m.image
            FROM medicine_history h
            JOIN medicines m ON m.id = h.medicine_id
            WHERE h.id = %s AND h.user_id = %s
            """,
            (history_id, current_user["id"])
        )

        history = cursor.fetchone()

        if not history:
            raise HTTPException(status_code=404, detail="History record not found.")

        history["intake_time"] = str(history["intake_time"])

        return {
            "message": "History retrieved successfully.",
            "history": history
        }

    finally:
        cursor.close()
        connection.close()


@router.put("/{history_id}")
def update_history(
    history_id: int,
    data: HistoryUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(status_code=400, detail="No changes provided.")

    if "status" in updates and updates["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid history status.")

    if "intake_time" in updates:
        validate_time(updates["intake_time"])

    connection = get_db_connection()

    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT id FROM medicine_history
            WHERE id = %s AND user_id = %s
            """,
            (history_id, current_user["id"])
        )

        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="History record not found.")

        fields = ", ".join(f"{field} = %s" for field in updates)
        values = list(updates.values()) + [history_id, current_user["id"]]

        cursor.execute(
            f"""
            UPDATE medicine_history
            SET {fields}
            WHERE id = %s AND user_id = %s
            """,
            values
        )

        connection.commit()

        return {"message": "History updated successfully."}

    except HTTPException:
        connection.rollback()
        raise

    except Exception:
        connection.rollback()
        raise HTTPException(status_code=500, detail="Failed to update history.")

    finally:
        cursor.close()
        connection.close()


@router.delete("/{history_id}")
def delete_history(
    history_id: int,
    current_user: dict = Depends(get_current_user)
):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            DELETE FROM medicine_history
            WHERE id = %s AND user_id = %s
            """,
            (history_id, current_user["id"])
        )

        if cursor.rowcount == 0:
            connection.rollback()
            raise HTTPException(status_code=404, detail="History record not found.")

        connection.commit()

        return {"message": "History deleted successfully."}

    except HTTPException:
        raise

    except Exception:
        connection.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete history.")

    finally:
        cursor.close()
        connection.close()
