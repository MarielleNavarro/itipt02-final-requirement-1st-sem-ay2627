
import { Router, RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  AlertController
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon
  ],
})
export class ForgotPasswordPage {

  appName = 'Med Intake Monitor';

  username = '';
  recoveryCode = '';
  newPassword = '';
  confirmPassword = '';

  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({
      eyeOutline,
      eyeOffOutline
    });
  }

  resetPassword() {

    if (
      !this.username.trim() ||
      !this.recoveryCode.trim() ||
      !this.newPassword ||
      !this.confirmPassword
    ) {
      this.showAlert(
        'Missing Information',
        'Please complete all fields.'
      );
      return;
    }

    if (this.newPassword.length < 8) {
      this.showAlert(
        'Invalid Password',
        'New password must be at least 8 characters.'
      );
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showAlert(
        'Password Mismatch',
        'New Password and Confirm Password do not match.'
      );
      return;
    }

    const resetData = {
      username: this.username.trim(),
      recoveryCode: this.recoveryCode.trim(),
      newPassword: this.newPassword
    };

    this.authService.forgotPassword(resetData).subscribe({

      next: async (response) => {

        this.username = '';
        this.recoveryCode = '';
        this.newPassword = '';
        this.confirmPassword = '';

        const successAlert = await this.alertController.create({
          header: 'Password Reset Successful',
          message: response.message,
          buttons: ['OK']
        });

        await successAlert.present();
        await successAlert.onDidDismiss();

        const recoveryAlert = await this.alertController.create({
          header: 'Your New Recovery Code',
          subHeader: response.recoveryCode,
          message:
            'Please save this code in a safe place. You will need it if you forget your password.',
          cssClass: 'recovery-code-alert',
          buttons: [
            {
              text: 'OK',
              handler: () => {
                this.router.navigate(['/login']);
              }
            }
          ]
        });

        await recoveryAlert.present();
      },

      error: (error) => {
        const message =
          error.error?.detail ||
          error.error?.message ||
          'Unable to reset password. Please try again.';

        this.showAlert(
          'Password Reset Failed',
          message
        );
      }

    });

  }

  async showAlert(header: string, message: string) {

    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

}
