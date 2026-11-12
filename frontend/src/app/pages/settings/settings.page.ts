import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonToggle } from '@ionic/angular';
import { addIcons } from 'ionicons'; 
import {
  personOutline,
  chevronForwardOutline,
  lockClosedOutline,
  notificationsOutline,
  informationCircleOutline,
  logOutOutline,
  homeOutline,
  documentTextOutline,
  add,
  timeOutline,
  settingsOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonToggle],
})
export class SettingsPage {
  constructor() {
    addIcons({
      personOutline,
      chevronForwardOutline,
      lockClosedOutline,
      notificationsOutline,
      informationCircleOutline,
      logOutOutline,
      homeOutline,
      documentTextOutline,
      add,
      timeOutline,
      settingsOutline
    });
  }

  ngOnInit() {}
}
