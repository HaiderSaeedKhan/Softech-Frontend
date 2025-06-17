import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private baseUrl = 'http://localhost:5099/api/video';

  constructor(private http: HttpClient) {}

  uploadVideo(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/upload`, formData, {
      responseType: 'text' // ✅ Accept plain text or empty response
    });
  }

  getVideoMetadata(id: number) {
    return this.http.get<any>(`${this.baseUrl}/metadata/${id}`);
  }
  
  updateVideo(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }
  
}
