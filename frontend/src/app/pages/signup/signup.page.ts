import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonLabel, IonInput, IonButton } from '@ionic/angular';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonLabel, IonInput, IonButton],
})
export class SignupPage {
  appName = 'Med Intake Monitor';
  firstName = '';
  lastName = '';
  username = '';
  password = '';
  confirmPassword = '';

  signup() {
    console.log('First Name:', this.firstName);
    console.log('Last Name:', this.lastName);
    console.log('Username', this.username);
  }

}
