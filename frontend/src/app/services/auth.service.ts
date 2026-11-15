import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

// USER INFORMATION
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

// REGISTRATION RESPONSE
export interface RegisterResponse {
  message: string;
  userId: number;
  recoveryCode: string;
}

// LOGIN RESPONSE
export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

// FORGOT PASSWORD RESPONSE
export interface ForgotPasswordResponse {
  message: string;
  recoveryCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  // USER REGISTRATION
  register(data: {
    first_name: string;
    last_name: string;
    username: string;
    password: string;
  }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${this.apiUrl}/register`,
      data
    );
  }

  // USER LOGIN
  login(data: {
    username: string;
    password: string;
  }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      data
    ).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      })
    );
  }

  // FORGOT PASSWORD
  forgotPassword(data: {
    username: string;
    recoveryCode: string;
    newPassword: string;
  }): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${this.apiUrl}/forgot-password`,
      data
    );
  }

  // GET SAVED USER INFORMATION
  getCurrentUser(): User | null {
    const user = localStorage.getItem('user');

    return user ? JSON.parse(user) as User : null;
  }

  // GET SAVED TOKEN
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // CHECK LOGIN STATUS
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // USER LOGOUT
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
