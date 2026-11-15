
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
  addMedicine(data: MedicineInput): Observable<AddMedicineResponse> {
    return this.http.post<AddMedicineResponse>(
      this.apiUrl,
      data,
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
    data: Partial<MedicineInput>
  ): Observable<MedicineActionResponse> {
    return this.http.put<MedicineActionResponse>(
      `${this.apiUrl}/${id}`,
      data,
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
