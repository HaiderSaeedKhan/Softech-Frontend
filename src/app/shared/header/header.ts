import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Auth } from '../../services/auth'; // adjust path as needed
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ]
})
export class Header {
  loggedIn = false;
  constructor(public auth: Auth, private router: Router) {}

  ngOnInit(): void {
    // ✅ Only check once during component initialization
    this.loggedIn = this.auth.isAuthenticated();
    console.log('[Header] JWT present:', this.loggedIn);
  }


  logout() {
    this.auth.logout();
  }

  goToUpload() {
    this.loggedIn
      ? this.router.navigate(['/upload'])
      : this.router.navigate(['/login']);
  }
  goToCategory(): void {
    this.router.navigate(['/category-page']);
  }
}

