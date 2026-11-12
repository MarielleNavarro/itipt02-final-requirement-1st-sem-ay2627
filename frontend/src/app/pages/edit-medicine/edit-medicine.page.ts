import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, cameraOutline } from 'ionicons/icons';

@Component({
  selector: 'app-edit-medicine',
  templateUrl: './edit-medicine.page.html',
  styleUrls: ['./edit-medicine.page.scss'],
  imports: [CommonModule, IonContent, IonIcon],
})
export class EditMedicinePage {
  constructor() {
    addIcons({
      arrowBackOutline,
      cameraOutline
    });
  }

}
