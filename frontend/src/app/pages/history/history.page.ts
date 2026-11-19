
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  medkitOutline,
  homeOutline,
  documentTextOutline,
  add,
  timeOutline,
  settingsOutline
} from 'ionicons/icons';

import { Medicine, MedicineService } from '../../services/medicine.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
})
export class HistoryPage {

  medicines: Medicine[] = [];

  selectedFilter: string = 'All';

  isLoading = true;
  errorMessage = '';

  constructor(
    private medicineService: MedicineService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      medkitOutline,
      homeOutline,
      documentTextOutline,
      add,
      timeOutline,
      settingsOutline
    });
  }

  ionViewWillEnter() {
    this.loadMedicines();
  }

  // LOAD MEDICINES
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
        console.error('Error loading medicine history:', error);

        this.errorMessage =
          error.error?.message || 'Unable to load medicine history.';

        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // SELECT FILTER
  setFilter(filter: string) {
    this.selectedFilter = filter;
  }

  // CHECK MEDICINE STATUS
  getMedicineStatus(medicine: Medicine): string {
    if (!medicine.end_date) {
      return 'Ongoing';
    }

    const endDate = String(medicine.end_date).slice(0, 10);
    const today = this.getTodayDate();

    return endDate < today ? 'Completed' : 'Ongoing';
  }

  // GET MEDICINE IMAGE URL
  getMedicineImage(image: string | null): string | null {
    return this.medicineService.getImageUrl(image);
  }

  // GET TODAY'S DATE
  getTodayDate(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // FILTER MEDICINES
  get filteredMedicines(): Medicine[] {
    if (this.selectedFilter === 'All') {
      return this.medicines;
    }

    return this.medicines.filter(
      medicine => this.getMedicineStatus(medicine) === this.selectedFilter
    );
  }

}
