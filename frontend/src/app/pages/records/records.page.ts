
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon],
})
export class RecordsPage {

  medicines: Medicine[] = [];

  searchTerm: string = '';
  selectedCategory: string = 'All';
  selectedStatus: string = 'All';

  isLoading = true;
  errorMessage = '';
  activeMenuId: number | null = null;

  constructor(
    private medicineService: MedicineService,
    private router: Router,
    private route: ActivatedRoute,
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

  ionViewWillEnter() {
    const status = this.route.snapshot.queryParamMap.get('status');

    if (status === 'Ongoing' || status === 'Completed') {
      this.selectedCategory = 'All';
      this.selectedStatus = status;
    } else {
      this.selectedStatus = 'All';
      this.selectedCategory = 'All';
    }

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

  // SELECT CATEGORY FILTER
  setCategory(category: string) {
    this.selectedCategory = category;
    this.cdr.detectChanges();
  }

  // FILTER AND SEARCH MEDICINES
  get filteredMedicines(): Medicine[] {
    return this.medicines.filter(medicine => {

      const matchesCategory =
        this.selectedCategory === 'All' ||
        medicine.category === this.selectedCategory;

      const endDate = medicine.end_date
        ? String(medicine.end_date).slice(0, 10)
        : null;

      const today = this.getTodayDate();

      const medicineStatus =
        !endDate || endDate >= today ? 'Ongoing' : 'Completed';

      const matchesStatus =
        this.selectedStatus === 'All' ||
        medicineStatus === this.selectedStatus;

      const matchesSearch =
        medicine.medicine_name
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase().trim());

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }

  // GET TODAY'S DATE
  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // OPEN OR CLOSE QUICK ACTIONS MENU
  toggleMenu(medicineId: number) {
    this.activeMenuId =
      this.activeMenuId === medicineId ? null : medicineId;

    this.cdr.detectChanges();
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
    this.cdr.detectChanges();

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

                // REMOVE DELETED MEDICINE FROM THE LIST
                this.medicines = this.medicines.filter(
                  item => item.id !== medicine.id
                );

                this.activeMenuId = null;

                // UPDATE RECORDS PAGE IMMEDIATELY
                this.cdr.detectChanges();

                // SHOW SUCCESS ALERT
                const successAlert = await this.alertController.create({
                  header: 'Success',
                  message: 'Medicine deleted successfully!',
                  buttons: [
                    {
                      text: 'OK',
                      handler: () => {
                        this.cdr.detectChanges();
                      }
                    }
                  ]
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
