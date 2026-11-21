
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonContent,
  IonIcon
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
  settingsOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
})
export class SettingsPage {

  fullName: string = '';
  
  constructor(
    private alertController: AlertController,
    private authService: AuthService,
    private router: Router
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
      settingsOutline
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

  async changePassword() {
    const alert = await this.alertController.create({
      header: 'Change Password',
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Current Password'
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'New Password'
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirm New Password'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Change Password',
          handler: (data) => {
            if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
              this.showMessage('Error', 'Please fill in all fields.');
              return false;
            }

            if (data.newPassword.length < 8) {
              this.showMessage('Error', 'New password must be at least 8 characters.');
              return false;
            }

            if (data.newPassword !== data.confirmPassword) {
              this.showMessage('Error', 'New passwords do not match.');
              return false;
            }

            this.authService.changePassword({
              currentPassword: data.currentPassword,
              newPassword: data.newPassword
            }).subscribe({
              next: () => {
                this.showMessage('Success', 'Password changed successfully.');
              },
              error: (error) => {
                this.showMessage(
                  'Error',
                  error.error?.detail || 'Unable to change password.'
                );
              }
            });

            return true;
          }
        }
      ]
    });

    await alert.present();
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
