import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, cameraOutline } from 'ionicons/icons';

@Component({
  selector: 'app-add-medicine',
  templateUrl: './add-medicine.page.html',
  styleUrls: ['./add-medicine.page.scss'],
  imports: [CommonModule, IonContent, IonIcon],
})
export class AddMedicinePage {
  constructor() {
    addIcons({
      arrowBackOutline,
      cameraOutline
    });
  }

}
