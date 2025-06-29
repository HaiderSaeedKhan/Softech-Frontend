// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';


export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./auth/register/register').then(m => m.Register) },
  { path: 'category-page', loadComponent: () => import('./category-page/category-page').then(m => m.CategoryPage) },
  { path: 'upload', loadComponent: () => import('./upload/upload').then(m => m.UploadComponent) },
  { path: 'search', loadComponent: () => import('./search/search/search').then(m => m.SearchComponent) },
  { path: 'video/:id', loadComponent: () => import('./video-details/video-details').then(m => m.VideoDetailsComponent) },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard) },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
