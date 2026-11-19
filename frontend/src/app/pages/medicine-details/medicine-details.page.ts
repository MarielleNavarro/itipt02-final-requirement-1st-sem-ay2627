
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

}
