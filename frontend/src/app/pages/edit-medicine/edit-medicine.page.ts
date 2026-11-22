
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cameraOutline,
  trashOutline,
  addCircleOutline
} from 'ionicons/icons';
import { Medicine, MedicineService } from '../../services/medicine.service';

interface IntakeTime {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
}

@Component({
  selector: 'app-edit-medicine',
  templateUrl: './edit-medicine.page.html',
  styleUrls: ['./edit-medicine.page.scss'],
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon],
})
export class EditMedicinePage implements OnInit {

  medicineId!: number;
  medicine: Medicine | null = null;

  medicineName = '';
  dosage = '';
  category: string = 'Maintenance';
  reason = '';
  startDate = '';
  endDate = '';
  notes = '';

  // INTAKE SCHEDULE
  intakeTimes: IntakeTime[] = [];

  hours: string[] = Array.from(
    { length: 12 },
    (_, i) => String(i + 1)
  );

  minutes: string[] = ['00', '10', '20', '30', '40', '50'];

  isLoading = true;

  // MEDICINE IMAGE
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  // ORIGINAL MEDICINE VALUES
  originalValues = {
    medicineName: '',
    dosage: '',
    category: '',
    reason: '',
    startDate: '',
    endDate: '',
    notes: '',
    intakeTimes: [] as IntakeTime[]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private medicineService: MedicineService,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      arrowBackOutline,
      cameraOutline,
      trashOutline,
      addCircleOutline
    });
  }

  ngOnInit() {
    this.medicineId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadMedicine();
  }

  // CHECK IF THERE ARE CHANGES
  get hasChanges(): boolean {
    return (
      this.medicineName.trim() !== this.originalValues.medicineName ||
      this.dosage.trim() !== this.originalValues.dosage ||
      this.category !== this.originalValues.category ||
      this.reason.trim() !== this.originalValues.reason ||
      this.startDate !== this.originalValues.startDate ||
      this.endDate !== this.originalValues.endDate ||
      this.notes.trim() !== this.originalValues.notes ||
      JSON.stringify(this.intakeTimes) !==
        JSON.stringify(this.originalValues.intakeTimes) ||
      this.selectedImage !== null
    );
  }

  // CONVERT DATE FOR INPUT
  formatDateForInput(value: string | Date | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // CONVERT 24-HOUR TIME TO 12-HOUR SCHEDULE
  formatTimeForDisplay(time: string): IntakeTime {
    const [hours, minutes] = time.substring(0, 5).split(':');

    let hour = Number(hours);
    const period: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM';

    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }

    return {
      hour: String(hour),
      minute: minutes || '00',
      period
    };
  }

  // CONVERT SCHEDULE TO 24-HOUR TIME
  getFormattedIntakeTimes(): string[] {
    return this.intakeTimes.map(schedule => {
      let hour = Number(schedule.hour);

      if (schedule.period === 'AM' && hour === 12) {
        hour = 0;
      } else if (schedule.period === 'PM' && hour !== 12) {
        hour += 12;
      }

      return `${String(hour).padStart(2, '0')}:${schedule.minute}`;
    });
  }

  // LOAD EXISTING MEDICINE
  loadMedicine() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.medicineService.getMedicine(this.medicineId).subscribe({
      next: (response) => {
        this.medicine = response.medicine;

        // LOAD EXISTING MEDICINE IMAGE
        this.imagePreview = this.medicine.image
          ? this.medicineService.getImageUrl(this.medicine.image)
          : null;

        this.medicineName = this.medicine.medicine_name;
        this.dosage = this.medicine.dosage;
        this.category = this.medicine.category;
        this.reason = this.medicine.reason;
        this.startDate = this.formatDateForInput(this.medicine.start_date);
        this.endDate = this.formatDateForInput(this.medicine.end_date);
        this.notes = this.medicine.notes || '';

        // LOAD EXISTING INTAKE SCHEDULES
        this.intakeTimes = (this.medicine.intake_times || []).map(
          time => this.formatTimeForDisplay(time)
        );

        // SAVE ORIGINAL VALUES FOR COMPARISON
        this.originalValues = {
          medicineName: this.medicineName.trim(),
          dosage: this.dosage.trim(),
          category: this.category,
          reason: this.reason.trim(),
          startDate: this.startDate,
          endDate: this.endDate,
          notes: this.notes.trim(),
          intakeTimes: this.intakeTimes.map(schedule => ({ ...schedule }))
        };

        this.isLoading = false;
        this.cdr.detectChanges();
      },

      error: async (error) => {
        console.error('Error loading medicine:', error);

        this.isLoading = false;
        this.cdr.detectChanges();

        const alert = await this.alertController.create({
          header: 'Error',
          message: error.error?.message || 'Unable to load medicine details.',
          buttons: [
            {
              text: 'OK',
              handler: () => this.router.navigate(['/records'])
            }
          ]
        });

        await alert.present();
      }
    });
  }

  // GET MEDICINE IMAGE URL
  getMedicineImage(image: string | null): string | null {
    return this.medicineService.getImageUrl(image);
  }

  // SELECT NEW MEDICINE IMAGE
  async onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // CHECK IMAGE FILE TYPE
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      await this.showAlert(
        'Invalid Image',
        'Please select a JPG, JPEG, PNG, or WEBP image.'
      );

      input.value = '';
      return;
    }

    // CHECK IMAGE FILE SIZE (5MB MAX)
    if (file.size > 5 * 1024 * 1024) {
      await this.showAlert(
        'Image Too Large',
        'Image size must not exceed 5MB.'
      );

      input.value = '';
      return;
    }

    // SAVE NEW IMAGE AND SHOW PREVIEW
    this.selectedImage = file;
    this.imagePreview = URL.createObjectURL(file);
  }

  // ADD NEW INTAKE TIME
  addIntakeTime() {
    this.intakeTimes.push({
      hour: '8',
      minute: '00',
      period: 'AM'
    });
  }

  // REMOVE INTAKE TIME
  removeIntakeTime(index: number) {
    if (this.intakeTimes.length > 1) {
      this.intakeTimes.splice(index, 1);
    }
  }

  // UPDATE MEDICINE
  updateMedicine() {
    if (
      !this.medicineName.trim() ||
      !this.dosage.trim() ||
      !this.category ||
      !this.reason.trim() ||
      !this.startDate
    ) {
      this.showAlert(
        'Incomplete Information',
        'Please fill in all required fields.'
      );
      return;
    }

    if (this.intakeTimes.length === 0) {
      this.showAlert(
        'Missing Intake Time',
        'Please add at least one intake time.'
      );
      return;
    }

    if (this.endDate && this.endDate < this.startDate) {
      this.showAlert(
        'Invalid Date',
        'End Date cannot be earlier than Start Date.'
      );
      return;
    }

    const updatedData = {
      medicine_name: this.medicineName.trim(),
      dosage: this.dosage.trim(),
      category: this.category,
      reason: this.reason.trim(),
      start_date: this.startDate,
      end_date: this.endDate || null,
      image: this.medicine?.image || null,
      notes: this.notes.trim() || null,
      intake_times: this.getFormattedIntakeTimes()
    };

    this.medicineService.updateMedicine(
      this.medicineId,
      updatedData,
      this.selectedImage
    ).subscribe({
      next: async () => {
        const alert = await this.alertController.create({
          header: 'Success',
          message: 'Medicine updated successfully!',
          buttons: [
            {
              text: 'OK',
              handler: () => {
                this.router.navigate(['/medicine-details', this.medicineId]);
              }
            }
          ]
        });

        await alert.present();
      },

      error: async (error) => {
        console.error('Error updating medicine:', error);

        await this.showAlert(
          'Update Failed',
          error.error?.message || 'Unable to update medicine.'
        );
      }
    });
  }

  // SHOW ALERT
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

}
