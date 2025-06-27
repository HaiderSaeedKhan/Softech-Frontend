import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BlockBlobClient } from '@azure/storage-blob';
import { lastValueFrom } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { sha256 } from 'js-sha256';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private baseUrl = 'http://localhost:5099/api/video';
  public uploadProgressMap$ = new BehaviorSubject<Record<string, number>>({});

  constructor(private http: HttpClient) {}

  // Progress helper
  emitProgress(uploadUrl: string, progress: number): void {
    const map = { ...this.uploadProgressMap$.value, [uploadUrl]: progress };
    this.uploadProgressMap$.next(map);
  }  

  // getActiveUploads(): string[] {
  //   return JSON.parse(localStorage.getItem('activeUploads') || '[]');
  // }

  // addActiveUpload(uploadUrl: string): void {
  //   if (!this.activeUploads.includes(uploadUrl)) {
  //     this.activeUploads.push(uploadUrl);
  //     localStorage.setItem('activeUploads', JSON.stringify(this.activeUploads));
  //   }
  // }

  // removeActiveUpload(uploadUrl: string): void {
  //   const updated = this.getActiveUploads().filter(u => u !== uploadUrl);
  //   localStorage.setItem('activeUploads', JSON.stringify(updated));
  // }

  private updateLocalUploadedBlocks(uploadUrl: string, blockIndex: number): void {
    const key = `uploadedBlocks_${uploadUrl}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    if (!existing.includes(blockIndex)) {
      existing.push(blockIndex);
      localStorage.setItem(key, JSON.stringify(existing));
    }
  }

  getLocalUploadedBlocks(uploadUrl: string): number[] {
    const key = `uploadedBlocks_${uploadUrl}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  clearLocalUploadedBlocks(uploadUrl: string): void {
    const key = `uploadedBlocks_${uploadUrl}`;
    localStorage.removeItem(key);
  }

  // 🟣 PARALLEL UPLOAD WITH PRECISE TRACKING
  async uploadFileToBlobParallel(file: File, sasUrl: string, onProgress: (p: number) => void) {
    const blockBlobClient = new BlockBlobClient(sasUrl);
    const blockSize = 1 * 1024 * 1024;
    const totalBlocks = Math.ceil(file.size / blockSize);
    const blockIds: string[] = [];
    const fullUrl = sasUrl.split('?')[0];

    const uploadedMap = new Map<number, boolean>();
    const promises = Array.from({ length: totalBlocks }, (_, i) => {
      const blockId = btoa(i.toString().padStart(6, '0'));
      blockIds[i] = blockId;

      const start = i * blockSize;
      const end = Math.min(start + blockSize, file.size);
      const chunk = file.slice(start, end);

      return blockBlobClient.stageBlock(blockId, chunk, chunk.size)
        .then(() => {
          uploadedMap.set(i, true);
          this.updateLocalUploadedBlocks(fullUrl, i);  // 🟣 record block index locally

          const uploaded = uploadedMap.size;
          const progress = Math.round((uploaded / totalBlocks) * 100);
          this.emitProgress(fullUrl, progress);
          onProgress(progress);
        });
    });

    const maxParallel = 4;
    for (let i = 0; i < promises.length; i += maxParallel) {
      const batch = promises.slice(i, i + maxParallel);
      await Promise.all(batch);
    }

    await blockBlobClient.commitBlockList(blockIds);
    this.emitProgress(fullUrl, 0);
    this.clearLocalUploadedBlocks(fullUrl);  // 🟣 clear after successful commit
  }

  // 🟣 PARALLEL RESUME
  async uploadFileToBlobParallelResume(
    file: File,
    sasUrl: string,
    uploadUrl: string
  ) {
    const blockBlobClient = new BlockBlobClient(sasUrl);
    const blockSize = 1 * 1024 * 1024;
    const totalBlocks = Math.ceil(file.size / blockSize);
    const blockIds: string[] = [];

    const uploadedBlocks = this.getLocalUploadedBlocks(uploadUrl);

    const uploadedMap = new Map<number, boolean>();
    const promises = Array.from({ length: totalBlocks }, (_, i) => {
      const blockId = btoa(i.toString().padStart(6, '0'));
      blockIds[i] = blockId;

      if (uploadedBlocks.includes(i)) {
        uploadedMap.set(i, true);
        return Promise.resolve(); // skip already uploaded
      }

      const start = i * blockSize;
      const end = Math.min(start + blockSize, file.size);
      const chunk = file.slice(start, end);

      return blockBlobClient.stageBlock(blockId, chunk, chunk.size)
        .then(() => {
          uploadedMap.set(i, true);
          this.updateLocalUploadedBlocks(uploadUrl, i);

          const uploaded = uploadedMap.size;
          const progress = Math.round((uploaded / totalBlocks) * 100);
          this.emitProgress(uploadUrl, progress);
        });
    });

    const maxParallel = 4;
    for (let i = 0; i < promises.length; i += maxParallel) {
      const batch = promises.slice(i, i + maxParallel);
      await Promise.all(batch);
    }

    await blockBlobClient.commitBlockList(blockIds);
    this.emitProgress(uploadUrl, 0);
    this.clearLocalUploadedBlocks(uploadUrl);
  }

  async calculateSHA256Stream(file: File): Promise<string> {
    const chunkSize = 1 * 1024 * 1024; // 1 MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    const hash = sha256.create(); // incremental SHA-256 instance
  
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = await file.slice(start, end).arrayBuffer();
      hash.update(new Uint8Array(chunk)); // feed chunk into hash
  
      // Optional: log progress
      if ((i + 1) % 50 === 0 || i === totalChunks - 1) {
        console.log(`Hashed ${i + 1} / ${totalChunks} chunks`);
      }
    }
  
    return hash.hex(); // final SHA-256 hash as hex string
  }
  
  deleteVideo(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

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
  
  // trackBlock(uploadUrl: string, blockCount: number) {
  //   return this.http.post(`${this.baseUrl}/track-block`, {
  //     uploadUrl,
  //     blockCount
  //   });
  // }
  
  getResumableUploads() {
    return this.http.get<any[]>(`${this.baseUrl}/resumable`);
  }

  // getUploadedBlockCount(uploadUrl: string) {
  //   return this.http.get<{ uploadedBlockCount: number }>(
  //     `${this.baseUrl}/block-count?uploadUrl=${encodeURIComponent(uploadUrl)}`
  //   );
  // }

  getVideoMetadataByUrl(uploadUrl: string): Observable<{ fileHash: string; fileSize: number; uploadUrl: string }> {
    return this.http.get<{ fileHash: string; fileSize: number; uploadUrl: string }>(
      `${this.baseUrl}/metadata-by-url?uploadUrl=${encodeURIComponent(uploadUrl)}`
    );
  }

  private updateLocalBlockCount(uploadUrl: string, blockCount: number): void {
    const key = `blockCount_${uploadUrl}`;
    localStorage.setItem(key, blockCount.toString());
  }
  
  getLocalBlockCount(uploadUrl: string): number {
    const key = `blockCount_${uploadUrl}`;
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : 0;
  }
  
  private clearLocalBlockCount(uploadUrl: string): void {
    const key = `blockCount_${uploadUrl}`;
    localStorage.removeItem(key);
  }
  

  // async uploadFileToBlobParallelTwo(file: File, sasUrl: string, onProgress: (p: number) => void) {
  //   const blockBlobClient = new BlockBlobClient(sasUrl);
  //   const blockSize = 1 * 1024 * 1024;
  //   const totalBlocks = Math.ceil(file.size / blockSize);
  //   const blockIds: string[] = [];
  //   const fullUrl = sasUrl.split('?')[0];

  //   const uploadedMap = new Map<number, boolean>();
  //   const promises = Array.from({ length: totalBlocks }, (_, i) => {
  //     const blockId = btoa(i.toString().padStart(6, '0'));
  //     blockIds[i] = blockId;

  //     const start = i * blockSize;
  //     const end = Math.min(start + blockSize, file.size);
  //     const chunk = file.slice(start, end);

  //     return this.enqueueGlobal(() => 
  //       blockBlobClient.stageBlock(blockId, chunk, chunk.size).then(() => {
  //         uploadedMap.set(i, true);
  //         this.updateLocalUploadedBlocks(fullUrl, i);
  //         const uploaded = uploadedMap.size;
  //         const progress = Math.round((uploaded / totalBlocks) * 100);
  //         this.emitProgress(fullUrl, progress);
  //         onProgress(progress);
  //       })
  //     );
  //   });

  //   await Promise.all(promises);


  //   await blockBlobClient.commitBlockList(blockIds);
  //   this.emitProgress(fullUrl, 0);
  //   this.clearLocalUploadedBlocks(fullUrl);
  // }

  async uploadFileToBlobParallelTwo(file: File, sasUrl: string, onProgress: (p: number) => void) {
    const blockBlobClient = new BlockBlobClient(sasUrl);
    const blockSize = 1 * 1024 * 1024;
    const totalBlocks = Math.ceil(file.size / blockSize);
    const blockIds: string[] = [];
    const fullUrl = sasUrl.split('?')[0];
  
    const uploadedMap = new Map<number, boolean>();
  
    const tasks = Array.from({ length: totalBlocks }, (_, i) => {
      const blockId = btoa(i.toString().padStart(6, '0'));
      blockIds[i] = blockId;
  
      const start = i * blockSize;
      const end = Math.min(start + blockSize, file.size);
      const chunk = file.slice(start, end);
  
      return async () => {
        await blockBlobClient.stageBlock(blockId, chunk, chunk.size);
        uploadedMap.set(i, true);
        this.updateLocalUploadedBlocks(fullUrl, i);
        const uploaded = uploadedMap.size;
        const progress = Math.round((uploaded / totalBlocks) * 100);
        this.emitProgress(fullUrl, progress);
        onProgress(progress);
      };
    });
  
    const maxParallel = 4;
    let i = 0;
    const runners: Promise<void>[] = [];
  
    while (i < tasks.length) {
      const batch = tasks.slice(i, i + maxParallel);
      runners.push(...batch.map(fn => fn()));
      await Promise.all(runners.splice(0, maxParallel));
      i += maxParallel;
    }
  
    await blockBlobClient.commitBlockList(blockIds);
    this.emitProgress(fullUrl, 0);
    this.clearLocalUploadedBlocks(fullUrl);
  }
  

  async uploadFileToBlobParallelResumeTwo(
    file: File,
    sasUrl: string,
    uploadUrl: string,
    onProgress: (p: number) => void
  ) {
    const blockBlobClient = new BlockBlobClient(sasUrl);
    const blockSize = 1 * 1024 * 1024;
    const totalBlocks = Math.ceil(file.size / blockSize);
    const blockIds: string[] = [];
  
    const uploadedBlocks = this.getLocalUploadedBlocks(uploadUrl);
    const uploadedMap = new Map<number, boolean>();
  
    const tasks = Array.from({ length: totalBlocks }, (_, i) => {
      const blockId = btoa(i.toString().padStart(6, '0'));
      blockIds[i] = blockId;
  
      if (uploadedBlocks.includes(i)) {
        uploadedMap.set(i, true);
        return async () => {}; // skip already uploaded
      }
  
      const start = i * blockSize;
      const end = Math.min(start + blockSize, file.size);
      const chunk = file.slice(start, end);
  
      return async () => {
        await blockBlobClient.stageBlock(blockId, chunk, chunk.size);
        uploadedMap.set(i, true);
        this.updateLocalUploadedBlocks(uploadUrl, i);
        const uploaded = uploadedMap.size;
        const progress = Math.round((uploaded / totalBlocks) * 100);
        this.emitProgress(uploadUrl, progress);
        onProgress(progress);
      };
    });
  
    const maxParallel = 4;
    let i = 0;
    const runners: Promise<void>[] = [];
  
    while (i < tasks.length) {
      const batch = tasks.slice(i, i + maxParallel);
      runners.push(...batch.map(fn => fn()));
      await Promise.all(runners.splice(0, maxParallel));
      i += maxParallel;
    }
  
    await blockBlobClient.commitBlockList(blockIds);
    this.emitProgress(uploadUrl, 0);
    this.clearLocalUploadedBlocks(uploadUrl);
  }
  

  
  
  
  
  
}
