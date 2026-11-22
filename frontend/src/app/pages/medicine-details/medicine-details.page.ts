
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  medkitOutline
} from 'ionicons/icons';
import { Medicine, MedicineService } from '../../services/medicine.service';

@Component({
  selector: 'app-medicine-details',
  templateUrl: './medicine-details.page.html',
  styleUrls: ['./medicine-details.page.scss'],
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
})
export class MedicineDetailsPage {

  medicineId!: number;
  medicine: Medicine | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private medicineService: MedicineService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      arrowBackOutline,
      medkitOutline
    });
  }

  // RELOAD DETAILS EVERY TIME THE PAGE OPENS
  ionViewWillEnter() {
    this.medicineId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadMedicine();
  }

  // LOAD LATEST MEDICINE INFORMATION
  loadMedicine() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.medicineService.getMedicine(this.medicineId).subscribe({
      next: (response) => {
        this.medicine = response.medicine;
        this.isLoading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Error loading medicine details:', error);

        this.errorMessage =
          error.error?.message || 'Unable to load medicine details.';

        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // GET MEDICINE IMAGE URL
  getMedicineImage(image: string | null): string | null {
    return this.medicineService.getImageUrl(image);
  }

  // CONVERT 24-HOUR TIME TO 12-HOUR FORMAT
  formatIntakeTime(time: string): string {
    const [hours, minutes] = time.substring(0, 5).split(':');

    let hour = Number(hours);
    const period = hour >= 12 ? 'PM' : 'AM';

    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }

    return `${hour}:${minutes} ${period}`;
  }

  // GET ALL INTAKE TIMES
  getFormattedIntakeTimes(): string {
    const times = this.medicine?.intake_times || [];

    return times
      .map(time => this.formatIntakeTime(time))
      .join(', ');
  }

}
