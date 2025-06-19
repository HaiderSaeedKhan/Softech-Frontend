// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { VideoService } from '../services/video';
// import { Auth } from '../services/auth';
// import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

// import { jwtDecode } from 'jwt-decode';


// @Component({
//   selector: 'app-video-details',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './video-details.html',
//   styleUrl: './video-details.css'
// })
// export class VideoDetailsComponent implements OnInit {
//   videoId!: number;
//   current: any;
//   previous: any;
//   form!: FormGroup;
//   isOwner = false;

//   constructor(
//     private route: ActivatedRoute,
//     private videoService: VideoService,
//     private auth: Auth,
//     private fb: FormBuilder,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     this.videoId = Number(this.route.snapshot.paramMap.get('id'));
//     this.videoService.getVideoMetadata(this.videoId).subscribe(data => {
//       this.current = data.current;
//       this.previous = data.previous;

//       const userId = this.getUserId(); // Ensure you have this method
//       this.isOwner = userId !== null && userId === this.current.userId;

//       this.form = this.fb.group({
//         title: [this.current.title],
//         description: [this.current.description],
//         categoryId: [this.current.categoryId],
//         tags: [this.current.tags?.join(', ')]
//       });
//     });
//   }

//   onSubmit() {
//     const dto = {
//       title: this.form.value.title,
//       description: this.form.value.description,
//       categoryId: +this.form.value.categoryId,
//       tags: (this.form.value.tags || '')
//         .split(',')
//         .map((t: string) => t.trim())
//         .filter((t: string) => t)
//     };

//     this.videoService.updateVideo(this.videoId, dto).subscribe(() => {
//       alert('Metadata updated!');
//       this.router.navigate(['/my-videos']);
//     });
//   }

//   getUserId(): number | null {
//     const token = this.auth.getToken();
//     if (!token) return null;
  
//     try {
//       const decoded: any = jwtDecode(token);
//       return +decoded?.nameid || null;
//     } catch {
//       return null;
//     }
//   }
  
// }


// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { VideoService } from '../services/video';
// import { Auth } from '../services/auth';
// import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
// import { Header } from '../shared/header/header';

// import { jwtDecode } from 'jwt-decode';

// import { CategoryService } from '../services/category';


// ///////////////////////
// import {
//   MatTreeModule,
//   MatTreeFlatDataSource,
//   MatTreeFlattener
// } from '@angular/material/tree';
// import { FlatTreeControl } from '@angular/cdk/tree';
// import { CategoryNode } from '../services/category';
// import { MatRadioModule } from '@angular/material/radio';
// import { MatIconModule } from '@angular/material/icon';

// interface FlatCategoryNode {
//   id: number;
//   name: string;
//   level: number;
//   expandable: boolean;
// }
// ///////////////////////

// @Component({
//   selector: 'app-video-details',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, Header, MatTreeModule, MatRadioModule, MatIconModule],
//   templateUrl: './video-details.html',
//   styleUrl: './video-details.css',
// })
// export class VideoDetailsComponent implements OnInit {

//   ///////////////////////
//   treeControl = new FlatTreeControl<FlatCategoryNode>(
//     node => node.level,
//     node => node.expandable
//   );
  
//   treeFlattener = new MatTreeFlattener<CategoryNode, FlatCategoryNode>(
//     (node: CategoryNode, level: number) => ({
//       id: node.id,
//       name: node.name,
//       level,
//       expandable: !!node.children?.length
//     }),
//     node => node.level,
//     node => node.expandable,
//     node => node.children
//   );
  
//   dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  
//   selectedCategoryId: number | null = null;
  
//   hasChild = (_: number, node: FlatCategoryNode) => node.expandable;
  
//   ///////////////////////
//   videoId!: number;
//   current: any;
//   history: any[] = [];
//   form!: FormGroup;
//   isOwner = false;

//   constructor(
//     private route: ActivatedRoute,
//     private videoService: VideoService,
//     private auth: Auth,
//     private fb: FormBuilder,
//     private router: Router,
//     private categoryService: CategoryService
//   ) {}

//   ngOnInit(): void {
//     this.videoId = Number(this.route.snapshot.paramMap.get('id'));

//     this.videoService.getVideoMetadata(this.videoId).subscribe(data => {
//       this.current = data.current;
//       this.history = data.history;

//       this.categoryService.getTree().subscribe(tree => {
//         this.dataSource.data = tree;
//         const flatMap: { [id: number]: string } = {};
      
//         const flatten = (nodes: any[]) => {
//           for (const node of nodes) {
//             flatMap[node.id] = node.name;
//             if (node.children) flatten(node.children);
//           }
//         };
//         flatten(tree);
      
//         // Replace CategoryId with readable name
//         this.history = this.history.map(entry => {
//           const catId = entry.oldMetadata?.CategoryId;
//           return {
//             ...entry,
//             oldMetadata: {
//               ...entry.oldMetadata,
//               CategoryName: flatMap[catId] || `Category ${catId}`
//             }
//           };
//         });
//       });
      

//       const userId = this.getUserId();
//       this.isOwner = userId !== null && userId === this.current.userId;


//       this.form = this.fb.group({
//         title: [this.current.title],
//         description: [this.current.description],
//         categoryId: [this.current.categoryId],
//         tags: [this.current.tags?.join(', ')]
//       });
//     });
//   }

//   // onSubmit(): void {
//   //   if (!this.selectedCategoryId) {
//   //     alert('Please select a category.');
//   //     return;
//   //   }

//   //   const dto = {
//   //     title: this.form.value.title,
//   //     description: this.form.value.description,
//   //     categoryId: this.selectedCategoryId!,
//   //     tags: (this.form.value.tags || '')
//   //       .split(',')
//   //       .map((t: string) => t.trim())
//   //       .filter((t: string) => t)
//   //   };

//   //   this.videoService.updateVideo(this.videoId, dto).subscribe(() => {
//   //     alert('Metadata updated!');
//   //     this.router.navigate(['/search']);
//   //   });
//   // }

//   onSubmit(): void {
//     if (!this.selectedCategoryId) {
//       alert('Please select a category.');
//       return;
//     }
  
//     const dto = {
//       title: this.form.value.title,
//       description: this.form.value.description,
//       categoryId: this.selectedCategoryId,
//       tags: (this.form.value.tags || '')
//         .split(',')
//         .map((t: string) => t.trim())
//         .filter((t: string) => t)
//     };
  
//     this.videoService.updateVideo(this.videoId, dto).subscribe(() => {
//       alert('Metadata updated!');
//       this.router.navigate(['/search']);
//     });
//   }
  
//   getUserId(): number | null {
//     const token = this.auth.getToken();
//     if (!token) return null;
  
//     try {
//       const decoded: any = jwtDecode(token);
//       const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
//       return +userId || null;
//     } catch {
//       return null;
//     }
//   }
// }


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoService } from '../services/video';
import { Auth } from '../services/auth';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Header } from '../shared/header/header';
import { jwtDecode } from 'jwt-decode';
import { CategoryService, CategoryNode } from '../services/category';

import {
  MatTreeModule,
  MatTreeFlatDataSource,
  MatTreeFlattener
} from '@angular/material/tree';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { FlatTreeControl } from '@angular/cdk/tree';

import { Tag } from '../services/tag';

interface FlatCategoryNode {
  id: number;
  name: string;
  level: number;
  expandable: boolean;
}

@Component({
  selector: 'app-video-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Header,
    MatTreeModule,
    MatRadioModule,
    MatIconModule
  ],
  templateUrl: './video-details.html',
  styleUrl: './video-details.css'
})
export class VideoDetailsComponent implements OnInit {
  videoId!: number;
  current: any;
  history: any[] = [];
  form!: FormGroup;
  isOwner = false;
  videoUrl: string = '';

  selectedCategoryId: number | null = null;

  treeControl = new FlatTreeControl<FlatCategoryNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener<CategoryNode, FlatCategoryNode>(
    (node: CategoryNode, level: number) => ({
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
    private route: ActivatedRoute,
    private videoService: VideoService,
    private auth: Auth,
    private fb: FormBuilder,
    private router: Router,
    private categoryService: CategoryService,
    private tagService: Tag
  ) {}

  ngOnInit(): void {
    this.videoId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Video ID from route:', this.videoId);

    this.videoService.getVideoUrl(this.videoId).subscribe(res => {
      console.log('🎥 Got video URL:', res.video);
      this.videoUrl = res.video;
    });
    

    this.videoService.getVideoMetadata(this.videoId).subscribe(data => {
      this.current = data.current;
      this.history = data.history;
      this.selectedCategoryId = this.current.categoryId;

      const userId = this.getUserId();
      this.isOwner = userId !== null && userId === this.current.userId;

      this.form = this.fb.group({
        title: [this.current.title],
        description: [this.current.description],
        tags: [this.current.tags?.join(', ')]
      });

      this.categoryService.getTree().subscribe(tree => {
        this.dataSource.data = tree;

        const flatMap: { [id: number]: string } = {};
        const flatten = (nodes: any[]) => {
          for (const node of nodes) {
            flatMap[node.id] = node.name;
            if (node.children) flatten(node.children);
          }
        };
        flatten(tree);

        this.history = this.history.map(entry => {
          const catId = entry.oldMetadata?.CategoryId;
          return {
            ...entry,
            oldMetadata: {
              ...entry.oldMetadata,
              CategoryName: flatMap[catId] || `Category ${catId}`
            }
          };
        });
      });
    });
  }

  onCategorySelect(categoryId: number): void {
    this.selectedCategoryId = categoryId;
  }

  onSubmit(): void {
    if (!this.selectedCategoryId) {
      alert('Please select a category.');
      return;
    }

    const dto = {
      title: this.form.value.title,
      description: this.form.value.description,
      categoryId: this.selectedCategoryId,
      tags: (this.form.value.tags || '')
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t)
    };

    this.videoService.updateVideo(this.videoId, dto).subscribe(() => {
      alert('Metadata updated!');
      this.router.navigate(['/search']);
    });
  }

  generateRecommendedTags(): void {
    const dto = {
      title: this.form.value.title || '',
      description: this.form.value.description || ''
    };
  
    this.tagService.suggestTags(dto).subscribe(suggested => {
      const existing = (this.form.value.tags || '')
        .split(',')
        .map((t: string) => t.trim())
        .filter((t :string) => t);
  
      const merged = Array.from(new Set([...existing, ...suggested]));
      this.form.patchValue({ tags: merged.join(', ') });
      alert('Recommended tags added!');
    });
  }

  getUserId(): number | null {
    const token = this.auth.getToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      const userId =
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      return +userId || null;
    } catch {
      return null;
    }
  }
}
