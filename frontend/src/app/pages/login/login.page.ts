
import { Component, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import {
  IonContent,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
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
    IonButton,
    IonIcon
  ],
})
export class LoginPage {

  appName = 'Med Intake Monitor';
  username = '';
  password = '';

  showPassword = false;
  @ViewChild('usernameInput') usernameInput!: IonInput;
  @ViewChild('passwordInput') passwordInput!: IonInput;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline
    });
  }

  ionViewWillEnter() {
    this.username = '';
    this.password = '';
    this.showPassword = false;

    if (this.usernameInput && this.passwordInput) {
      this.usernameInput.value = '';
      this.passwordInput.value = '';
    }
  }

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
          error.error?.detail ||
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
