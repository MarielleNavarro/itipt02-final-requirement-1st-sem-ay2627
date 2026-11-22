
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { HistoryService, MedicineHistory } from '../../services/history.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon],
})
export class HistoryPage {

  medicines: Medicine[] = [];
  intakeHistory: MedicineHistory[] = [];

  selectedFilter: string = 'All';
  selectedIntakeFilter: string = 'All';
  selectedDate: string = '';

  isLoading = true;
  errorMessage = '';

  constructor(
    private medicineService: MedicineService,
    private historyService: HistoryService,
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
    this.selectedFilter = 'All';
    this.selectedIntakeFilter = 'All';

    this.loadMedicines();
    this.loadIntakeHistory();
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

  // SELECT MAIN FILTER
  setFilter(filter: string) {
    this.selectedFilter = filter;

    // Reset intake sub-filter when leaving Intake
    if (filter !== 'Intake') {
      this.selectedIntakeFilter = 'All';
    }
  }

  // SELECT INTAKE SUB-FILTER
  setIntakeFilter(filter: string) {
    this.selectedIntakeFilter = filter;
  }

  // CHECK MEDICINE STATUS
  getMedicineStatus(medicine: Medicine): string {
    if (!medicine.end_date) {
      return 'Ongoing';
    }

    const endDate = String(medicine.end_date).slice(0, 10);
    const today = this.getTodayDate();

    return endDate <= today ? 'Completed' : 'Ongoing';
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

  // FILTER INTAKE HISTORY
  get filteredIntakeHistory(): MedicineHistory[] {
    return this.intakeHistory.filter(record => {
      const matchesStatus =
        this.selectedIntakeFilter === 'All' ||
        record.status === this.selectedIntakeFilter;

      const matchesDate =
        this.selectedDate === '' ||
        String(record.intake_date).slice(0, 10) === this.selectedDate;

      return matchesStatus && matchesDate;
    });
  }

  // LOAD ACTUAL MEDICINE INTAKE HISTORY
  loadIntakeHistory() {
    this.historyService.getHistory().subscribe({
      next: (response) => {
        this.intakeHistory = response.history || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading intake history:', error);
        this.intakeHistory = [];
        this.cdr.detectChanges();
      }
    });
  }

}
