import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface TagSuggestRequestDto {
  title: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class Tag {
  private baseUrl = 'http://localhost:5099/api/tag';

  constructor(private http: HttpClient) {}

  suggestTags(dto: TagSuggestRequestDto): Observable<string[]> {
    return this.http.post<string[]>(`${this.baseUrl}/suggest`, dto);
  }
}
