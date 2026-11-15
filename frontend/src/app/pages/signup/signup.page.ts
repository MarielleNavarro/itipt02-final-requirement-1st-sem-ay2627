import { Router, RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonLabel,
  IonInput,
  IonButton,
  AlertController
} from '@ionic/angular';

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
    IonButton
  ],
})
export class SignupPage {

  appName = 'Med Intake Monitor';

  firstName = '';
  lastName = '';
  username = '';
  password = '';
  confirmPassword = '';

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router
  ) {}

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
      first_name: this.firstName.trim(),
      last_name: this.lastName.trim(),
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

        // SHOW SUCCESS ALERT
        const alert = await this.alertController.create({
          header: 'Registration Successful',
          message: response.message,
          buttons: [
            {
              text: 'OK',
              handler: () => {
                this.router.navigate(['/login']);
              }
            }
          ]
        });

        await alert.present();
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

  async showAlert(header: string, message: string) {

    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

}
