import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BlockBlobClient } from '@azure/storage-blob';
import { lastValueFrom } from 'rxjs';

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
      const blockId = btoa(i.toString().padStart(6, '0'));
      const start = i * blockSize;
      const end = Math.min(start + blockSize, file.size);
      const chunk = file.slice(start, end);

      await blockBlobClient.stageBlock(blockId, chunk, chunk.size);
      blockIds.push(blockId);
      console.log(sasUrl)
      console.log(i+1)
      const fullUrl = sasUrl.split('?')[0];
      await lastValueFrom(this.trackBlock(fullUrl, i + 1));
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

  confirmUpload(blobUrl: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/confirm-upload`, { blobUrl }); // ✅ wrap it
  }
  
  trackBlock(uploadUrl: string, blockCount: number) {
    return this.http.post(`${this.baseUrl}/track-block`, {
      uploadUrl,
      blockCount
    });
  }
  
  getResumableUploads() {
    return this.http.get<any[]>(`${this.baseUrl}/resumable`);
  }

  getUploadedBlockCount(uploadUrl: string) {
    return this.http.get<{ uploadedBlockCount: number }>(
      `${this.baseUrl}/block-count?uploadUrl=${encodeURIComponent(uploadUrl)}`
    );
  }

  async uploadFileToBlobTwo(
    file: File,
    sasUrl: string,
    uploadUrl: string,
    onProgress: (p: number) => void,
    uploadedBlockCount: number // ✅ ADDED
  ) {
    const blockBlobClient = new BlockBlobClient(sasUrl);
    const blockSize = 1 * 1024 * 1024; // 1MB
    const totalBlocks = Math.ceil(file.size / blockSize);
    const blockIds: string[] = [];
  
    // ✅ Always generate full block list
    for (let i = 0; i < totalBlocks; i++) {
      blockIds.push(btoa(i.toString().padStart(6, '0')));
    }
  
    // ✅ Resume from uploadedBlockCount
    for (let i = uploadedBlockCount; i < totalBlocks; i++) {
      const blockId = blockIds[i];
      const start = i * blockSize;
      const end = Math.min(start + blockSize, file.size);
      const chunk = file.slice(start, end);
  
      await blockBlobClient.stageBlock(blockId, chunk, chunk.size);
      await lastValueFrom(this.trackBlock(uploadUrl, i + 1));
      onProgress(Math.round(((i + 1) / totalBlocks) * 100));
    }
  
    // ✅ Commit full block list (not just the ones uploaded in this session)
    await blockBlobClient.commitBlockList(blockIds);
  }

  async calculateSHA256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  getVideoMetadataByUrl(uploadUrl: string): Observable<{ fileHash: string; fileSize: number; uploadUrl: string }> {
    return this.http.get<{ fileHash: string; fileSize: number; uploadUrl: string }>(
      `${this.baseUrl}/metadata-by-url?uploadUrl=${encodeURIComponent(uploadUrl)}`
    );
  }

  setActiveUpload(uploadUrl: string | null): void {
    if (uploadUrl) {
      localStorage.setItem('activeUpload', uploadUrl);
    } else {
      localStorage.removeItem('activeUpload');
    }
  }

  /** Retrieve current active upload URL */
  getActiveUpload(): string | null {
    return localStorage.getItem('activeUpload');
  }
  

  
  
  
}
