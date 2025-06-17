import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private apiUrl = 'http://localhost:5099/api/search';

  constructor(private http: HttpClient) {}

  getAutocomplete(prefix: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/autocomplete?prefix=${prefix}`);
  }

  fullTextSearch(query: string, categoryIds: number[]): Observable<{ hits: any[]; highlights: any }> {
    const body = { query, categoryIds };
    return this.http.post<{ hits: any[]; highlights: any }>(`${this.apiUrl}/query`, body);
  }
  
  getMyVideos(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:5099/api/video/my'); // Adjust endpoint if needed
  }
}
