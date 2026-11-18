
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AlertController, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cameraOutline,
  trashOutline,
  addCircleOutline
} from 'ionicons/icons';

import { MedicineService } from '../../services/medicine.service';

interface IntakeTime {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
}

@Component({
  selector: 'app-add-medicine',
  templateUrl: './add-medicine.page.html',
  styleUrls: ['./add-medicine.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonIcon
  ],
})
export class AddMedicinePage {

  medicineName = '';

  dosageAmount = '';
  dosageUnit = 'mg';
  customDosageUnit = '';

  category = 'Maintenance';
  reason = '';
  startDate = '';
  endDate = '';
  notes = '';

  intakeTimes: IntakeTime[] = [
    { hour: '8', minute: '00', period: 'AM' }
  ];

  hours: string[] = Array.from(
    { length: 12 },
    (_, i) => String(i + 1)
  );

  minutes: string[] = ['00', '10', '20', '30', '40', '50'];

  constructor(
    private medicineService: MedicineService,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({
      arrowBackOutline,
      cameraOutline,
      trashOutline,
      addCircleOutline
    });
  }

  addIntakeTime() {
    this.intakeTimes.push({
      hour: '8',
      minute: '00',
      period: 'AM'
    });
  }

  removeIntakeTime(index: number) {
    if (this.intakeTimes.length > 1) {
      this.intakeTimes.splice(index, 1);
    }
  }

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

  async showValidationAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Incomplete Information',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  async addMedicine() {

    // Medicine Name validation
    if (!this.medicineName.trim()) {
      await this.showValidationAlert('Please enter the Medicine Name.');
      return;
    }

    // Dosage validation
    if (
      !String(this.dosageAmount).trim() ||
      !Number.isFinite(Number(this.dosageAmount)) ||
      Number(this.dosageAmount) <= 0
    ) {
      await this.showValidationAlert('Please enter a valid Dosage.');
      return;
    }

    // Dosage Unit validation
    if (!this.dosageUnit) {
      await this.showValidationAlert('Please select a Dosage Unit.');
      return;
    }

    // Custom Dosage Unit validation
    if (this.dosageUnit === 'Other' && !this.customDosageUnit.trim()) {
      await this.showValidationAlert('Please enter your custom Dosage Unit.');
      return;
    }

    // Category validation
    if (!this.category) {
      await this.showValidationAlert('Please select a Category.');
      return;
    }

    // Reason validation
    if (!this.reason.trim()) {
      await this.showValidationAlert('Please enter the Reason for Taking.');
      return;
    }

    // Start Date validation
    if (!this.startDate) {
      await this.showValidationAlert('Please select a Start Date.');
      return;
    }

    // End Date validation (optional)
    if (this.endDate && this.endDate < this.startDate) {
      const alert = await this.alertController.create({
        header: 'Invalid Date',
        message: 'End Date cannot be earlier than Start Date.',
        buttons: ['OK']
      });

      await alert.present();
      return;
    }

    // Prepare medicine data
    const selectedUnit = this.dosageUnit === 'Other'
      ? this.customDosageUnit.trim()
      : this.dosageUnit;

    const medicineData = {
      medicine_name: this.medicineName.trim(),
      dosage: `${String(this.dosageAmount).trim()} ${selectedUnit}`,
      category: this.category,
      reason: this.reason.trim(),
      start_date: this.startDate,
      end_date: this.endDate || null,
      image: null,
      notes: this.notes.trim() || null,
      intake_times: this.getFormattedIntakeTimes()
    };

    // Save medicine
    this.medicineService.addMedicine(medicineData).subscribe({

      next: async (response) => {

        const alert = await this.alertController.create({
          header: 'Success!',
          message: response.message,
          buttons: [
            {
              text: 'OK',
              handler: () => {
                this.router.navigate(['/records']);
              }
            }
          ]
        });

        await alert.present();
      },

      error: async (error) => {

        const alert = await this.alertController.create({
          header: 'Error',
          message: error.error?.message || 'Unable to add medicine. Please try again.',
          buttons: ['OK']
        });

        await alert.present();
      }

    });
  }

}
