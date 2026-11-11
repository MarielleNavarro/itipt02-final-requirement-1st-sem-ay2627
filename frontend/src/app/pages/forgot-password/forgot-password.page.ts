import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonLabel, IonInput, IonButton } from '@ionic/angular';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonLabel, IonInput, IonButton],
})
export class ForgotPasswordPage {
  appName = 'Med Intake Monitor';
  username = '';
  recoveryCode = '';
  newPassword = '';
  confirmPassword = '';
}
