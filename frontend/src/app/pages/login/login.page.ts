import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonLabel, IonInput, IonButton } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [ CommonModule, FormsModule, RouterLink, IonContent, IonLabel, IonInput, IonButton],
})
export class LoginPage {
  appName = 'Med Intake Monitor';
  username = '';
  password = '';

  login() {
    console.log('Username:', this.username);
    console.log('Password:', this.password);
  }

}
