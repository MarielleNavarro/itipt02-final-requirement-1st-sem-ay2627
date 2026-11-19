import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, cameraOutline } from 'ionicons/icons';
import { Medicine, MedicineService } from '../../services/medicine.service';

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
    notes: ''
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
      cameraOutline
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

        // SAVE ORIGINAL VALUES FOR COMPARISON
        this.originalValues = {
          medicineName: this.medicineName.trim(),
          dosage: this.dosage.trim(),
          category: this.category,
          reason: this.reason.trim(),
          startDate: this.startDate,
          endDate: this.endDate,
          notes: this.notes.trim()
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

  // UPDATE MEDICINE
  updateMedicine() {
    if (
      !this.medicineName.trim() ||
      !this.dosage.trim() ||
      !this.category ||
      !this.reason.trim() ||
      !this.startDate
    ) {
      this.showAlert('Incomplete Information', 'Please fill in all required fields.');
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
      notes: this.notes.trim() || null
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

        this.showAlert(
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
