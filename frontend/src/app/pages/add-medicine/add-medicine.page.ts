
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AlertController, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, cameraOutline } from 'ionicons/icons';
import { MedicineService } from '../../services/medicine.service';

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
  dosage = '';
  category = 'Maintenance';
  reason = '';
  startDate = '';
  endDate = '';
  notes = '';

  constructor(
    private medicineService: MedicineService,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({
      arrowBackOutline,
      cameraOutline
    });
  }

  async addMedicine() {

    if (
      !this.medicineName.trim() ||
      !this.dosage.trim() ||
      !this.reason.trim() ||
      !this.startDate
    ) {
      const alert = await this.alertController.create({
        header: 'Incomplete Information',
        message: 'Please fill in all required fields.',
        buttons: ['OK']
      });

      await alert.present();
      return;
    }

    const medicineData = {
      medicine_name: this.medicineName.trim(),
      dosage: this.dosage.trim(),
      category: this.category,
      reason: this.reason.trim(),
      start_date: this.startDate,
      end_date: this.endDate || null,
      image: null,
      notes: this.notes.trim() || null
    };

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
