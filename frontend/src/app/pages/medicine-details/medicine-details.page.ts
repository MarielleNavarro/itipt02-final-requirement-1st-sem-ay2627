
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  medkitOutline,
  createOutline,
  trashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-medicine-details',
  templateUrl: './medicine-details.page.html',
  styleUrls: ['./medicine-details.page.scss'],
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
})
export class MedicineDetailsPage {
  constructor() {
    addIcons({
      arrowBackOutline,
      medkitOutline,
      createOutline,
      trashOutline
    });
  }
}
