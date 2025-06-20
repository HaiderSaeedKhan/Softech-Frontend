// src/app/auth/login/login.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Auth } from '../../services/auth';
import { Header } from '../../shared/header/header';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    Header
  ]
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/search']);
      return;
    }
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    this.auth.login({ email, password }).subscribe({
      next: (res) => {
        this.auth.saveToken(res.token); // Save JWT to localStorage
        this.snackBar.open('Login successful!', 'OK', { duration: 3000 });
        this.router.navigate(['/upload'], { replaceUrl: true });
      },
      error: (err) => {
        this.error = typeof err.error === 'string' ? err.error : 'Login failed. Please try again.';
      }
    });
  }
}
