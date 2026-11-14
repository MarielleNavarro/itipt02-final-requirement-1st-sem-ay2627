import { Component, signal } from '@angular/core';
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

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
})
export class DashboardPage {

  appName = 'Med Intake Monitor';

  firstName = '';

  totalMedicines = signal(5);
  ongoingMedicines = signal(2);
  completedMedicines = signal(3);

  upcomingToday = [
    {
      name: 'Cetirizine',
      dosage: '10 mg',
      time: '8:00 PM'
    }
  ]

  constructor() {
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
  
}
