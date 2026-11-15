import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  medkitOutline,
  ellipsisVertical,
  homeOutline,
  documentTextOutline,
  add,
  timeOutline,
  settingsOutline,
  createOutline,
  trashOutline
} from 'ionicons/icons';
import { Medicine, MedicineService } from '../../services/medicine.service';

@Component({
  selector: 'app-records',
  templateUrl: './records.page.html',
  styleUrls: ['./records.page.scss'],
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
})
export class RecordsPage implements OnInit {

  medicines: Medicine[] = [];
  isLoading = true;
  errorMessage = '';
  activeMenuId: number | null = null;

  constructor(
    private medicineService: MedicineService,
    private router: Router,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      searchOutline,
      medkitOutline,
      ellipsisVertical,
      homeOutline,
      documentTextOutline,
      add,
      timeOutline,
      settingsOutline,
      createOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.loadMedicines();
  }

  // LOAD ALL MEDICINES
  loadMedicines() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.medicineService.getMedicines().subscribe({
      next: (response) => {
        this.medicines = response.medicines;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading medicines:', error);

        this.errorMessage =
          error.error?.message || error.message || 'Unable to load medicines.';

        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }


  // OPEN OR CLOSE QUICK ACTIONS MENU
  toggleMenu(medicineId: number) {
    this.activeMenuId =
      this.activeMenuId === medicineId ? null : medicineId;
  }

  // OPEN MEDICINE DETAILS PAGE
  openMedicineDetails(medicineId: number) {
    this.activeMenuId = null;
    this.router.navigate(['/medicine-details', medicineId]);
  }

  // OPEN EDIT MEDICINE PAGE
  editMedicine(medicineId: number) {
    this.activeMenuId = null;
    this.router.navigate(['/edit-medicine', medicineId]);
  }

  // DELETE MEDICINE WITH CONFIRMATION
  async deleteMedicine(medicine: Medicine) {
    this.activeMenuId = null;

    const alert = await this.alertController.create({
      header: 'Delete Medicine',
      message: `Are you sure you want to delete ${medicine.medicine_name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.medicineService.deleteMedicine(medicine.id).subscribe({
              next: async () => {
                this.medicines = this.medicines.filter(
                  item => item.id !== medicine.id
                );

                const successAlert = await this.alertController.create({
                  header: 'Success',
                  message: 'Medicine deleted successfully!',
                  buttons: ['OK']
                });

                await successAlert.present();
              },
              error: async (error) => {
                console.error('Error deleting medicine:', error);

                const errorAlert = await this.alertController.create({
                  header: 'Error',
                  message:
                    error.error?.message || 'Unable to delete medicine.',
                  buttons: ['OK']
                });

                await errorAlert.present();
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

}
