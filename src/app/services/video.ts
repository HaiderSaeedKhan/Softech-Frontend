import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BlockBlobClient } from '@azure/storage-blob';

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

  getSasUrl(fileName: string): Observable<{ uploadUrl: string }> {
    return this.http.get<{ uploadUrl: string }>(`${this.baseUrl}/get-sas-url?fileName=${fileName}`);
  }

  async uploadFileToBlob(file: File, sasUrl: string, onProgress: (p: number) => void) {
    const blockBlobClient = new BlockBlobClient(sasUrl);
    const blockSize = 1 * 1024 * 1024;
    const totalBlocks = Math.ceil(file.size / blockSize);
    const blockIds: string[] = [];
    const uploadId = `${file.name}-${file.size}`;

    for (let i = 0; i < totalBlocks; i++) {
      const blockId = btoa(`${uploadId}-${i}`);
      const start = i * blockSize;
      const end = Math.min(start + blockSize, file.size);
      const chunk = file.slice(start, end);

      await blockBlobClient.stageBlock(blockId, chunk, chunk.size);
      blockIds.push(blockId);
      onProgress(Math.round(((i + 1) / totalBlocks) * 100));
    }

    await blockBlobClient.commitBlockList(blockIds);
  }

  saveMetadata(data: {
    title: string;
    description: string;
    categoryId: number;
    uploadUrl: string;
    tags: string[];
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/save-metadata`, data);
  }

  getVideoUrl(id: number): Observable<{ video: string }> {
    return this.http.get<{ video: string }>(`${this.baseUrl}/get-video-url/${id}`);
  }

  
}
