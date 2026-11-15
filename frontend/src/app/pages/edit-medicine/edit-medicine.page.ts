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

        this.medicineName = this.medicine.medicine_name;
        this.dosage = this.medicine.dosage;
        this.category = this.medicine.category;
        this.reason = this.medicine.reason;
        this.startDate = this.formatDateForInput(this.medicine.start_date);
        this.endDate = this.formatDateForInput(this.medicine.end_date);
        this.notes = this.medicine.notes || '';

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

  // UPDATE MEDICINE
  updateMedicine() {
    if (
      !this.medicineName.trim() ||
      !this.dosage.trim() ||
      !this.reason.trim() ||
      !this.startDate
    ) {
      this.showAlert('Incomplete Information', 'Please fill in all required fields.');
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

    this.medicineService.updateMedicine(this.medicineId, updatedData).subscribe({
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
