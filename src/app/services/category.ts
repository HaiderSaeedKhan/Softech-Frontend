import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CategoryNode {
  id: number;
  name: string;
  children?: CategoryNode[];
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private baseUrl = 'http://localhost:5099/api/category';

  constructor(private http: HttpClient) {}

  getTree(): Observable<CategoryNode[]> {
    return this.http.get<CategoryNode[]>(`${this.baseUrl}/getTree`);
  }

  createCategory(dto: { name: string; parentId: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, dto);
  }
}
