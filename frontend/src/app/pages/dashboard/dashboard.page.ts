
import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  documentTextOutline,
  add,
  timeOutline,
  settingsOutline,
  checkmarkCircle,
  medkitOutline,
  calendarOutline
} from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

import { 
  Medicine, 
  MedicineService,
  TodaySchedule
} from '../../services/medicine.service';

import { HistoryService, MedicineHistory } from '../../services/history.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
})
export class DashboardPage {

  appName = 'Med Intake Monitor';

  firstName = '';

  totalMedicines = signal(0);
  ongoingMedicines = signal(0);
  completedMedicines = signal(0);

  medicines: Medicine[] = [];
  todayTaken = 0;
  todayTotal = 0;

  upcomingToday: TodaySchedule[] = [];

  constructor(
    private authService: AuthService,
    private medicineService: MedicineService,
    private historyService: HistoryService,
    private cdr: ChangeDetectorRef
  ) {

    // GET LOGGED-IN USER INFORMATION
    const user = this.authService.getCurrentUser();

    this.firstName = user?.first_name
      ? user.first_name
          .toLowerCase()
          .replace(/\b\w/g, letter => letter.toUpperCase())
      : '';

    addIcons({
      homeOutline,
      documentTextOutline,
      add,
      timeOutline,
      settingsOutline,
      checkmarkCircle,
      medkitOutline,
      calendarOutline
    });
  }

  // RELOAD MEDICINES EVERY TIME DASHBOARD OPENS
  ionViewWillEnter() {

    // REFRESH LOGGED-IN USER INFORMATION
    const user = this.authService.getCurrentUser();

    this.firstName = user?.first_name
      ? user.first_name
          .toLowerCase()
          .replace(/\b\w/g, letter => letter.toUpperCase())
      : '';

    this.loadMedicines();
    this.loadTodaySummary();
    this.loadTodaySchedules();
  }

  // LOAD MEDICINES
  loadMedicines() {
    this.medicineService.getMedicines().subscribe({
      next: (response) => {
        this.medicines = response.medicines;

        this.totalMedicines.set(this.medicines.length);

        this.ongoingMedicines.set(
          this.medicines.filter(
            medicine => this.getMedicineStatus(medicine) === 'Ongoing'
          ).length
        );

        this.completedMedicines.set(
          this.medicines.filter(
            medicine => this.getMedicineStatus(medicine) === 'Completed'
          ).length
        );

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading dashboard medicines:', error);
      }
    });
  }

  // LOAD TODAY'S INTAKE SUMMARY
  loadTodaySummary() {
    this.historyService.getTodaySummary().subscribe({
      next: (response) => {
        this.todayTaken = response.taken;
        this.todayTotal = response.total;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading today intake summary:', error);
      }
    });
  }

  // LOAD TODAY'S MEDICINE SCHEDULES
  loadTodaySchedules() {
    this.medicineService.getTodaySchedules().subscribe({
      next: (response) => {
        console.log('TODAY SCHEDULES RESPONSE:', response);

        this.upcomingToday = response.schedules;

        console.log('UPCOMING TODAY DATA:', this.upcomingToday);

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading today medicine schedules:', error);
      }
    });
  }

  // MARK MEDICINE AS TAKEN
  markAsTaken(schedule: TodaySchedule) {

    console.log('STEP 1: Mark as Taken clicked', schedule);

    // Prevent duplicate clicks
    if (schedule.status === 'Taken') {
      return;
    }

    const previousStatus = schedule.status;

    // Temporarily disable the button
    schedule.status = 'Taken';
    this.cdr.detectChanges();

    const historyData = {
      medicine_id: schedule.medicine_id,
      intake_date: this.getTodayDate(),
      intake_time: schedule.intake_time
        .replace(/[^0-9:]/g, '')
        .split(':')
        .slice(0, 2)
        .map(part => part.padStart(2, '0'))
        .join(':'),
      status: 'Taken' as const
    };

    console.log('STEP 2: Sending history data', historyData);

    this.historyService.addHistory(historyData).subscribe({
      next: (response) => {
        console.log('Medicine intake recorded:', response);

        this.loadTodaySchedules();
        this.loadTodaySummary();
      },
      error: (error) => {
        console.error('Error recording medicine intake:', error);

        // Restore previous status if saving fails
        schedule.status = previousStatus;
        this.cdr.detectChanges();
      }
    });
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

}
