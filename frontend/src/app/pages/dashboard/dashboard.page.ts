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

import { AuthService } from '../../services/auth.service';

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
  ];

  constructor(private authService: AuthService) {

    // GET LOGGED-IN USER INFORMATION
    const user = this.authService.getCurrentUser();

    this.firstName = user?.first_name || '';

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
