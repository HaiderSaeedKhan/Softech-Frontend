// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'  // globally available service
})
export class Auth {
  private apiUrl = 'http://localhost:5099/api/auth'; // ✅ Your backend endpoint

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Send login credentials to backend
   */
  login(credentials: { email: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, credentials);
  }

  /**
   * Send registration data to backend
   */
  register(data: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  /**
   * Save JWT token to localStorage
   */
  saveToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  }

  /**
   * Retrieve stored token
   */
  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  /**
   * Remove token and redirect to login
   */
  logout(): void {
    localStorage.removeItem('jwt_token');
    this.router.navigate(['/login']);
  }

  /**
   * Check if user is logged in
   */
  isAuthenticated(): boolean {
    return !!this.getToken();  // true if token exists
  }
}
