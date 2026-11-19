import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface MedicineHistory {
  id: number;
  user_id: number;
  medicine_id: number;
  medicine_name: string;
  intake_date: string;
  intake_time: string;
  status: 'Taken' | 'Missed' | 'Skipped';
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  private apiUrl = `${environment.apiUrl}/history`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });
  }

  // GET ALL MEDICINE HISTORY
  getHistory(): Observable<{
    message: string;
    history: MedicineHistory[];
  }> {
    return this.http.get<{
      message: string;
      history: MedicineHistory[];
    }>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  // GET TODAY'S INTAKE SUMMARY
  getTodaySummary(): Observable<{
    message: string;
    total: number;
    taken: number;
  }> {
    return this.http.get<{
      message: string;
      total: number;
      taken: number;
    }>(`${this.apiUrl}/today-summary`, {
      headers: this.getHeaders()
    });
  }

}