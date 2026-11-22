
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// MEDICINE INFORMATION
export interface Medicine {
  id: number;
  user_id: number;
  medicine_name: string;
  dosage: string;
  category: string;
  reason: string;
  start_date: string;
  end_date: string | null;
  image: string | null;
  notes: string | null;
  intake_times: string[];
  created_at?: string;
}

// MEDICINE FORM DATA
export interface MedicineInput {
  medicine_name: string;
  dosage: string;
  category: string;
  reason: string;
  start_date: string;
  end_date?: string | null;
  image?: string | null;
  notes?: string | null;
  intake_times: string[];
}

// ADD MEDICINE RESPONSE
export interface AddMedicineResponse {
  message: string;
  medicineId: number;
}

// VIEW MEDICINES RESPONSE
export interface MedicinesResponse {
  message: string;
  medicines: Medicine[];
}

// TODAY'S MEDICINE SCHEDULE
export interface TodaySchedule {
  medicine_id: number;
  medicine_name: string;
  dosage: string;
  image: string | null;
  intake_time: string;
  status: 'Taken' | 'Missed' | 'Skipped' | null;
}

// TODAY'S SCHEDULES RESPONSE
export interface TodaySchedulesResponse {
  message: string;
  schedules: TodaySchedule[];
}

// SINGLE MEDICINE RESPONSE
export interface MedicineResponse {
  message: string;
  medicine: Medicine;
}

// GENERAL RESPONSE
export interface MedicineActionResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicineService {

  private apiUrl = `${environment.apiUrl}/medicines`;

  // GET FULL MEDICINE IMAGE URL
  getImageUrl(image: string | null): string | null {
    if (!image) {
      return null;
    }

    const baseUrl = environment.apiUrl.replace('/api', '');

    return `${baseUrl}${image}`;
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // AUTHENTICATION HEADER
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // ADD MEDICINE
  addMedicine(
    data: MedicineInput,
    imageFile?: File | null
  ): Observable<AddMedicineResponse> {

    const formData = new FormData();

    formData.append('medicine_name', data.medicine_name);
    formData.append('dosage', data.dosage);
    formData.append('category', data.category);
    formData.append('reason', data.reason);
    formData.append('start_date', data.start_date);
    formData.append('end_date', data.end_date || '');
    formData.append('notes', data.notes || '');
    formData.append('intake_times', JSON.stringify(data.intake_times));

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http.post<AddMedicineResponse>(
      this.apiUrl,
      formData,
      { headers: this.getHeaders() }
    );
  }


  // VIEW ALL MEDICINES
  getMedicines(): Observable<MedicinesResponse> {
    return this.http.get<MedicinesResponse>(
      this.apiUrl,
      { headers: this.getHeaders() }
    );
  }


  // VIEW TODAY'S MEDICINE SCHEDULES
  getTodaySchedules(): Observable<TodaySchedulesResponse> {
    return this.http.get<TodaySchedulesResponse>(
      `${this.apiUrl}/today-schedules`,
      { headers: this.getHeaders() }
    );
  }

  // VIEW ONE MEDICINE
  getMedicine(id: number): Observable<MedicineResponse> {
    return this.http.get<MedicineResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // EDIT MEDICINE
  updateMedicine(
    id: number,
    data: Partial<MedicineInput>,
    imageFile?: File | null
  ): Observable<MedicineActionResponse> {

    const formData = new FormData();

    if (data.medicine_name !== undefined) {
      formData.append('medicine_name', data.medicine_name);
    }

    if (data.dosage !== undefined) {
      formData.append('dosage', data.dosage);
    }

    if (data.category !== undefined) {
      formData.append('category', data.category);
    }

    if (data.reason !== undefined) {
      formData.append('reason', data.reason);
    }

    if (data.start_date !== undefined) {
      formData.append('start_date', data.start_date);
    }

    if (data.end_date !== undefined) {
      formData.append('end_date', data.end_date || '');
    }

    if (data.notes !== undefined) {
      formData.append('notes', data.notes || '');
    }

    if (data.intake_times !== undefined) {
      formData.append(
        'intake_times',
        JSON.stringify(data.intake_times)
      );
    }

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http.put<MedicineActionResponse>(
      `${this.apiUrl}/${id}`,
      formData,
      { headers: this.getHeaders() }
    );
  }


  // DELETE MEDICINE
  deleteMedicine(id: number): Observable<MedicineActionResponse> {
    return this.http.delete<MedicineActionResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

}
