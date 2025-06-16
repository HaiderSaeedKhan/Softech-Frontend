// // import { Component } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
// // import { Tag } from '../services/tag';
// // import { MatFormFieldModule } from '@angular/material/form-field';
// // import { MatInputModule } from '@angular/material/input';
// // import { MatButtonModule } from '@angular/material/button';
// // import { Header } from '../shared/header/header';

// // @Component({
// //   selector: 'app-upload',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     ReactiveFormsModule,
// //     MatFormFieldModule,
// //     MatInputModule,
// //     MatButtonModule,
// //     Header
// //   ],
// //   templateUrl: './upload.html',
// //   styleUrls: ['./upload.css']
// // })
// // export class UploadComponent {
// //   form: FormGroup;
// //   tags: string[] = [];

// //   constructor(private fb: FormBuilder, private tagService: Tag) {
// //     this.form = this.fb.group({
// //       title: [''],
// //       description: ['']
// //     });
// //   }

// //   onGenerateTags(): void {
// //     const { title, description } = this.form.value;
// //     if (!title || !description) return;

// //     this.tagService.suggestTags({ title, description }).subscribe({
// //       next: (tags) => {
// //         this.tags = tags;
// //       },
// //       error: (err) => {
// //         console.error('Tag generation failed:', err);
// //         this.tags = [];
// //       }
// //     });
// //   }
// // }

// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   ReactiveFormsModule,
//   FormBuilder,
//   FormGroup,
//   FormControl,
//   FormArray
// } from '@angular/forms';
// import { Tag } from '../services/tag';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { Header } from '../shared/header/header';

// // tree logic
// import { MatTreeModule } from '@angular/material/tree';
// import { MatCheckboxModule } from '@angular/material/checkbox';

// @Component({
//   selector: 'app-upload',
//   standalone: true,
//   templateUrl: './upload.html',
//   styleUrls: ['./upload.css'],
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatButtonModule,
//     MatIconModule,
//     Header,
//     //tree
//     MatTreeModule,
//     MatCheckboxModule,
//   ]
// })
// export class UploadComponent implements OnInit {
//   form!: FormGroup;
//   tags: string[] = [];
//   selectedFile: File | null = null;

//   constructor(private fb: FormBuilder, private tagService: Tag) {}

//   ngOnInit(): void {
//     this.form = this.fb.group({
//       title: [''],
//       description: [''],
//       manualTags: this.fb.array([this.fb.control('')])
//     });
//   }

//   // For logic like push/remove
//   get manualTagsArray(): FormArray {
//     return this.form.get('manualTags') as FormArray;
//   }

//   // For template loop and formControl binding
//   get manualTagsControls(): FormControl[] {
//     return this.manualTagsArray.controls as FormControl[];
//   }

//   addTagField(): void {
//     this.manualTagsArray.push(this.fb.control(''));
//   }

//   removeTagField(index: number): void {
//     this.manualTagsArray.removeAt(index);
//   }

//   onGenerateTags(): void {
//     const { title, description } = this.form.value;
//     if (!title || !description) return;

//     this.tagService.suggestTags({ title, description }).subscribe({
//       next: (tags) => {
//         this.tags = tags;
//       },
//       error: (err) => {
//         console.error('Tag generation failed:', err);
//         this.tags = [];
//       }
//     });
//   }

//   onFileSelected(event: Event): void {
//     const input = event.target as HTMLInputElement;
//     if (input.files && input.files.length > 0) {
//       this.selectedFile = input.files[0];
//     }
//   }
// }

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
    Header
  ]
})
export class UploadComponent implements OnInit {
  form!: FormGroup;
  tags: string[] = [];
  selectedFile: File | null = null;

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
    this.form = this.fb.group({
      title: [''],
      description: [''],
      manualTags: this.fb.array([this.fb.control('')])
    });

    this.categoryService.getTree().subscribe(tree => {
      this.dataSource.data = tree;
    });
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

  // onSubmit(): void {
  //   const { title, description, manualTags } = this.form.value;
  
  //   if (!title || !description || !this.selectedFile || !this.selectedCategoryId) {
  //     alert('All fields including file and category must be filled.');
  //     return;
  //   }
  
  //   const tags = manualTags.filter((tag: string) => tag?.trim().length > 0);
  
  //   const formData = new FormData();
  //   formData.append('title', title);
  //   formData.append('description', description);
  //   formData.append('categoryId', this.selectedCategoryId.toString());
  //   formData.append('file', this.selectedFile);
  //   tags.forEach(tag => formData.append('tags', tag));
  
  //   this.videoService.uploadVideo(formData).subscribe({
  //     next: () => {
  //       alert('Video uploaded successfully!');
  //       this.form.reset();
  //       this.selectedFile = null;
  //       this.selectedCategoryId = null;
  //       this.tags = [];
  //     },
  //     error: err => {
  //       console.error('Upload failed:', err);
  //       alert('Upload failed.');
  //     }
  //   });
  // }

  onSubmit(): void {
    const { title, description, manualTags } = this.form.value;
  
    // ✅ Basic validation
    if (!title || !description || !this.selectedFile || !this.selectedCategoryId || this.manualTagsControls.length === 0) {
      alert('All fields including title, description, file, and category must be filled. Include at least one tag.');
      return;
    }
  
    // ✅ Filter non-empty manual tags and type them correctly
    const tags: string[] = (manualTags as string[]).filter((tag: string) => tag?.trim().length > 0);

    if (!title || !description || !this.selectedFile || !this.selectedCategoryId || tags.length === 0) {
      alert('All fields including title, description, file, and category must be filled. Include at least one tag.');
      return; // 🔁 Prevent submission if any field is invalid
    }
  
    // ✅ Create FormData for multipart/form-data submission
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('categoryId', this.selectedCategoryId.toString());
    formData.append('file', this.selectedFile);
  
    tags.forEach((tag: string) => {
      formData.append('tags', tag);
    });
  
    // ✅ Send to backend
    this.videoService.uploadVideo(formData).subscribe({
      next: () => {
        alert('Video uploaded successfully!');
        window.location.reload();
        this.form.reset();
        this.selectedFile = null;
        this.selectedCategoryId = null;
        this.tags = [];
        this.selectedFile = null;
      },
      error: (err) => {
        console.error('Upload failed:', err);
        alert('Upload failed. Please try again.');
      }
    });
  }
  
  
}
