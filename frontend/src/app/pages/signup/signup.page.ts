
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
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
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
export class SignupPage {

  appName = 'Med Intake Monitor';

  firstName = '';
  lastName = '';
  username = '';

  password = '';
  confirmPassword = '';

  // PASSWORD VISIBILITY
  showPassword = false;
  showConfirmPassword = false;

  // TOGGLE PASSWORD VISIBILITY
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline
    });
  }

  signup() {

    if (
      !this.firstName.trim() ||
      !this.lastName.trim() ||
      !this.username.trim() ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.showAlert(
        'Missing Information',
        'Please complete all fields.'
      );
      return;
    }

    if (this.password.length < 8) {
      this.showAlert(
        'Invalid Password',
        'Password must be at least 8 characters.'
      );
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showAlert(
        'Password Mismatch',
        'Password and Confirm Password do not match.'
      );
      return;
    }

    const signupData = {
      first_name: this.formatName(this.firstName),
      last_name: this.formatName(this.lastName),
      username: this.username.trim(),
      password: this.password
    };

    this.authService.register(signupData).subscribe({

      next: async (response) => {

        // CLEAR SIGN UP FORM
        this.firstName = '';
        this.lastName = '';
        this.username = '';
        this.password = '';
        this.confirmPassword = '';

        // FIRST ALERT: REGISTRATION SUCCESSFUL
        const successAlert = await this.alertController.create({
          header: 'Registration Successful',
          message: response.message,
          buttons: ['OK']
        });

        await successAlert.present();
        await successAlert.onDidDismiss();

        // SECOND ALERT: SHOW RECOVERY CODE
        const recoveryAlert = await this.alertController.create({
          header: 'Your Recovery Code',
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
          error.error?.message ||
          'Unable to register. Please try again.';

        this.showAlert(
          'Registration Failed',
          message
        );
      }

    });

  }

  formatName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, letter => letter.toUpperCase());
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
