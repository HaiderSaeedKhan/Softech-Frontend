import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  FormArray
} from '@angular/forms';
import { Tag } from '../services/tag';
import { CategoryService, CategoryNode } from '../services/category'; // ✅ category import
import {
  MatTreeModule,
  MatTreeFlatDataSource,
  MatTreeFlattener
} from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Header } from '../shared/header/header';
import { VideoService } from '../services/video'; // ✅ new import
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { browserRefresh } from '../app';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface FlatCategoryNode {
  id: number;
  name: string;
  level: number;
  expandable: boolean;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.html',
  styleUrls: ['./upload.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTreeModule,
    MatCheckboxModule,
    Header,
    MatProgressSpinnerModule,
    MatProgressBarModule
  ]
})
export class UploadComponent implements OnInit {
  form!: FormGroup;
  tags: string[] = [];
  selectedFile: File | null = null;
  activeUploads: string[] = [];
  progressMap: Record<string, number> = {};

  resumableUploads: any[] = [];

  // ✅ category tree logic
  selectedCategoryId: number | null = null;
  treeControl = new FlatTreeControl<FlatCategoryNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener<CategoryNode, FlatCategoryNode>(
    (node, level) => ({
      id: node.id,
      name: node.name,
      level,
      expandable: !!node.children?.length
    }),
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  hasChild = (_: number, node: FlatCategoryNode) => node.expandable;

  constructor(
    private fb: FormBuilder,
    private tagService: Tag,
    private categoryService: CategoryService,
    private videoService: VideoService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.form = this.fb.group({
      title: [''],
      description: [''],
      manualTags: this.fb.array([this.fb.control('')])
    });

    if (browserRefresh) {
      // 🔑 If full reload/new tab, clear stale cross-tab active state
      this.activeUploads = [];
      localStorage.removeItem('activeUploads');
    } else {
      const stored = localStorage.getItem('activeUploads');
      this.activeUploads = stored ? JSON.parse(stored) : [];
    }

    if (!sessionStorage.getItem('pageActiveOnce')) {
      console.warn('Fresh load or tab reopen detected. Clearing upload state.');
      this.activeUploads = [];
      localStorage.removeItem('activeUploads');
    }

    // ✅ Mark this session as active
    sessionStorage.setItem('pageActiveOnce', 'true');

    this.categoryService.getTree().subscribe(tree => {
      this.dataSource.data = tree;
    });

    this.videoService.uploadProgressMap$.subscribe(map => {
      this.progressMap = map;
    });

    this.videoService.getResumableUploads().subscribe(videos => {
      this.resumableUploads = videos;
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      title: [''],
      description: [''],
      categoryId: [null],
      manualTags: this.fb.array([this.fb.control('')])
    });
    this.selectedFile = null;
    this.tags = [];
  }

  // ✅ tag form helpers
  get manualTagsArray(): FormArray {
    return this.form.get('manualTags') as FormArray;
  }

  get manualTagsControls(): FormControl[] {
    return this.manualTagsArray.controls as FormControl[];
  }

  addTagField(): void {
    this.manualTagsArray.push(this.fb.control(''));
  }

  removeTagField(index: number): void {
    this.manualTagsArray.removeAt(index);
  }

  onGenerateTags(): void {
    const { title, description } = this.form.value;
    if (!title || !description) return;

    this.tagService.suggestTags({ title, description }).subscribe({
      next: tags => (this.tags = tags),
      error: err => {
        console.error('Tag generation failed:', err);
        this.tags = [];
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit(): void {
    const { title, description, manualTags } = this.form.value;
    const tags: string[] = (manualTags as string[]).filter(t => t?.trim().length > 0);
  
    if (!title || !description || !this.selectedFile || !this.selectedCategoryId || tags.length === 0) {
      alert('All fields must be filled.');
      return;
    }
  
    const fileName = `${Date.now()}_${this.selectedFile.name}`;
  
    this.videoService.calculateSHA256Stream(this.selectedFile!).then(hash => {
      const metadata = {
        title,
        description,
        categoryId: this.selectedCategoryId!,
        tags,
        uploadUrl: fileName,
        fileSize: this.selectedFile!.size,
        fileHash: hash // ✅ Send hash to backend
      };
  
      this.videoService.saveMetadata(metadata).subscribe({
        next: async ({ uploadUrl }) => {
          try {
            this.addActiveUpload(uploadUrl);
            await this.videoService.uploadFileToBlob(this.selectedFile!, uploadUrl, (p) => {
              console.log(`Progress: ${p}%`);
            });
  
            const blobUrl = uploadUrl.split('?')[0];
            this.videoService.confirmUpload(blobUrl).subscribe({
              next: () => {
                this.removeActiveUpload(uploadUrl);
                this.refreshResumables();
                // window.location.reload();
              },
              error: () => {
                alert('Upload succeeded but confirmation failed.');
                this.removeActiveUpload(uploadUrl);
              }
            });
  
          } catch (err) {
            console.error('Upload error:', err);
            alert('Video upload failed.');
            this.removeActiveUpload(uploadUrl);
          }
        },
        error: () => {
          alert('Saving metadata failed.');
        }
      });
    });
  }

  resumeUpload(video: any): void {
    const url = video.uploadUrl;
    

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
  
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      
      const metadata = await this.videoService.getVideoMetadataByUrl(video.uploadUrl).toPromise();
      const fileHash = await this.videoService.calculateSHA256Stream(file);

      if (!metadata) {
        alert('Failed to retrieve metadata. Cannot resume.');
        return;
      }
      if (metadata.fileHash !== fileHash) {
        alert('Hash mismatch. Cannot resume.');
        return;
      }


      this.addActiveUpload(video.uploadUrl);

      // ✅ Get local block count only
      const uploadedBlockCount = this.videoService.getLocalBlockCount(video.uploadUrl);
      if (uploadedBlockCount === 0) {
        alert('No local progress found. Cannot resume.');
        this.removeActiveUpload(video.uploadUrl);
        return;
      }
  
              const fileNameOnly = video.uploadUrl.split('/').pop()!;
              this.videoService.getSasUrl(fileNameOnly).subscribe({
                next: async ({ uploadUrl }) => {
                  try {
                    await this.videoService.uploadFileToBlobTwo(
                      file,
                      uploadUrl,
                      video.uploadUrl,
                      uploadedBlockCount
                    );
  
                    this.videoService.confirmUpload(video.uploadUrl).subscribe(() => {
                      this.removeActiveUpload(video.uploadUrl);
                      this.refreshResumables();
                      // window.location.reload();
                    });
                  } catch (err) {
                    console.error('Resume failed', err);
                    console.error('Resume failed', err);
                    alert('Resuming upload failed.');
                    this.removeActiveUpload(video.uploadUrl);
                  }
                },
                error: () => {
                  alert('Failed to get upload URL.');
                }
              });
    };
  
    input.click();
  }
  
  getOverallProgress(): number {
    const values = Object.values(this.progressMap);
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(avg);
  }

  addActiveUpload(uploadUrl: string): void {
    if (!this.activeUploads.includes(uploadUrl)) {
      this.activeUploads.push(uploadUrl);
      localStorage.setItem('activeUploads', JSON.stringify(this.activeUploads));
    }
  }

  removeActiveUpload(uploadUrl: string): void {
    this.activeUploads = this.activeUploads.filter(u => u !== uploadUrl);
    localStorage.setItem('activeUploads', JSON.stringify(this.activeUploads));
  }

  filteredResumableUploads(): any[] {
    const getBlobName = (url: string) => url.split('/').pop()?.split('?')[0] || url;
  
    console.log('Active blob names:', this.activeUploads.map(getBlobName));
  
    const filtered = this.resumableUploads.filter(r => {
      const resumableBlob = getBlobName(r.uploadUrl);
      return !this.activeUploads.some(a => getBlobName(a) === resumableBlob);
    });
  
    console.log('Filtered resumables:', filtered);
    return filtered;
  }

  // getOverallProgress(): number {
  //   const values = Object.values(this.progressMap);
  //   if (values.length === 0) return 0;
  //   return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  // }

  refreshResumables(): void {
    this.videoService.getResumableUploads().subscribe(videos => {
      this.resumableUploads = videos;
    });
  }

  getLocalUploadedMB(uploadUrl: string, fileSize: number): number {
    const blockCount = this.videoService.getLocalBlockCount(uploadUrl);
    if (blockCount === 0) {
      return 0;
    }
    const blockSize = 1 * 1024 * 1024; // 1 MB
    const uploadedBytes = Math.min(blockCount * blockSize, fileSize);
    return Math.round(uploadedBytes / (1024 * 1024)); // Convert to MB
  }
  
  
  
  
  
}
