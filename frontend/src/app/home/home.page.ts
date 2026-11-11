import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { IonContent, IonButton } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [RouterLink, IonContent, IonButton],
})
export class HomePage {
  appName = 'Medicine Intake Monitoring Application';
  constructor() {}
}
