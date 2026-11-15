
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
export class LoginPage {

  appName = 'Med Intake Monitor';
  username = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  login() {
    if (!this.username.trim() || !this.password) {
      this.showAlert(
        'Missing Information',
        'Please enter your username and password.'
      );
      return;
    }

    const loginData = {
      username: this.username.trim(),
      password: this.password
    };

    this.authService.login(loginData).subscribe({
      next: async (response) => {
        await this.showAlert(
          'Login Successful',
          response.message
        );

        this.router.navigate(['/dashboard']);
      },

      error: (error) => {
        const message =
          error.error?.message ||
          'Unable to login. Please try again.';

        this.showAlert('Login Failed', message);
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
