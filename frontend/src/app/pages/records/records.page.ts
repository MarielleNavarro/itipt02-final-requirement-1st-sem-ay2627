import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  searchOutline, medkitOutline, ellipsisVertical, homeOutline, 
  documentTextOutline, add, timeOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-records',
  templateUrl: './records.page.html',
  styleUrls: ['./records.page.scss'],
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
})
export class RecordsPage {
  constructor() {
    addIcons({
      searchOutline,
      medkitOutline,
      ellipsisVertical,
      homeOutline,
      documentTextOutline,
      add,
      timeOutline,
      settingsOutline
    });
  }

}
