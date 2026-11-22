
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  AlertController,
  IonContent,
  IonIcon,
  IonLabel
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  personOutline,
  chevronForwardOutline,
  lockClosedOutline,
  informationCircleOutline,
  logOutOutline,
  homeOutline,
  documentTextOutline,
  add,
  timeOutline,
  settingsOutline,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonLabel
  ],
})
export class SettingsPage {

  fullName: string = '';

  // CHANGE PASSWORD MODAL
  showChangePasswordModal = false;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  // PASSWORD VISIBILITY
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private alertController: AlertController,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({
      personOutline,
      chevronForwardOutline,
      lockClosedOutline,
      informationCircleOutline,
      logOutOutline,
      homeOutline,
      documentTextOutline,
      add,
      timeOutline,
      settingsOutline,
      eyeOutline,
      eyeOffOutline
    });

    const user = this.authService.getCurrentUser();

    this.fullName = user
      ? `${user.first_name} ${user.last_name}`
          .toLowerCase()
          .replace(/\b\w/g, letter => letter.toUpperCase())
      : 'Profile';
  }

  async openProfile() {

    const user = this.authService.getCurrentUser();

    const alert = await this.alertController.create({
      header: 'Profile',
      message: user
        ? `FULL NAME: ${user.first_name} ${user.last_name}\n\nUSERNAME: ${user.username}`
        : 'No user information found.',
      buttons: ['Close']
    });

    await alert.present();
  }

  // OPEN CHANGE PASSWORD MODAL
  changePassword() {

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';

    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;

    this.showChangePasswordModal = true;
  }

  // CLOSE CHANGE PASSWORD MODAL
  closeChangePassword() {

    this.showChangePasswordModal = false;

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  // SUBMIT NEW PASSWORD
  submitPasswordChange() {

    if (
      !this.currentPassword ||
      !this.newPassword ||
      !this.confirmPassword
    ) {
      this.showMessage('Error', 'Please fill in all fields.');
      return;
    }

    if (this.newPassword.length < 8) {
      this.showMessage(
        'Error',
        'New password must be at least 8 characters.'
      );
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showMessage(
        'Error',
        'New passwords do not match.'
      );
      return;
    }

    this.authService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({

      next: async () => {
        const alert = await this.alertController.create({
          header: 'Success',
          message: 'Password changed successfully.',
          buttons: ['OK']
        });

        await alert.present();
        await alert.onDidDismiss();

        this.closeChangePassword();
        this.cdr.detectChanges();
      },

      error: (error) => {

        this.showMessage(
          'Error',
          error.error?.detail || 'Unable to change password.'
        );

      }

    });

  }

  async showAbout() {

    const alert = await this.alertController.create({
      header: 'About Application',
      subHeader: 'Medicine Intake Monitoring Application',
      message:
        'The Med Intake Monitor App is designed to help users to monitor their daily medication intake.\n\n' +
        'Users can add and manage medicine records, set medication schedules, and monitor their medicine intake.\n\n' +
        'Its main purpose is to help users remember their medication schedules, and keep their medicine records in one convenient place.',
      cssClass: 'recovery-code-alert',
      buttons: ['Close']
    });

    await alert.present();
  }

  async logout() {

    const alert = await this.alertController.create({
      header: 'Log Out',
      message: 'Are you sure you want to log out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Log Out',
          handler: () => {
            this.authService.logout();
            this.router.navigateByUrl('/login', { replaceUrl: true });
          }
        }
      ]
    });

    await alert.present();
  }

  async showMessage(header: string, message: string) {

    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

}
