
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
  image: string | null;
  intake_date: string;
  intake_time: string;
  status: 'Taken' | 'Missed' | 'Skipped';
  notes?: string | null;
}

export interface HistoryInput {
  medicine_id: number;
  intake_date: string;
  intake_time: string;
  status: 'Taken' | 'Missed' | 'Skipped';
  notes?: string | null;
}

export interface HistoryResponse {
  message: string;
  history: MedicineHistory;
}

export interface HistoryActionResponse {
  message: string;
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

  // ADD MEDICINE HISTORY
  addHistory(data: HistoryInput): Observable<HistoryActionResponse> {
    return this.http.post<HistoryActionResponse>(
      this.apiUrl,
      data,
      { headers: this.getHeaders() }
    );
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

  // GET ONE MEDICINE HISTORY
  getOneHistory(id: number): Observable<HistoryResponse> {
    return this.http.get<HistoryResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // UPDATE MEDICINE HISTORY
  updateHistory(
    id: number,
    data: Partial<HistoryInput>
  ): Observable<HistoryActionResponse> {
    return this.http.put<HistoryActionResponse>(
      `${this.apiUrl}/${id}`,
      data,
      { headers: this.getHeaders() }
    );
  }

  // DELETE MEDICINE HISTORY
  deleteHistory(id: number): Observable<HistoryActionResponse> {
    return this.http.delete<HistoryActionResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
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
