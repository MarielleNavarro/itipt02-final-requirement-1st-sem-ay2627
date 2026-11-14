import { Component } from '@angular/core';
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

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
})
export class HistoryPage {
  constructor() {
    addIcons({
      medkitOutline,
      homeOutline,
      documentTextOutline,
      add,
      timeOutline,
      settingsOutline
    });
  }

}
