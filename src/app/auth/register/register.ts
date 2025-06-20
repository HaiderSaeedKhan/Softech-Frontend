// src/app/auth/register.ts
import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatError } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Header } from '../../shared/header/header';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatError,
    Header,
    RouterModule
  ]
})
export class Register {
  registerForm!: FormGroup;
  error: string = '';

  constructor(private fb: FormBuilder, private auth: Auth, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/search']);
      return;
    }
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }


  submit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched(); // trigger all validation messages
      return;
    }
  
    const data = this.registerForm.getRawValue();
  
    this.auth.register({
      username: data.username!,
      email: data.email!,
      password: data.password!
    }).subscribe({
      next: () => {
        this.snackBar.open('Registered successfully!', 'OK', { duration: 3000 });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = typeof err.error === 'string'
          ? err.error
          : 'Registration failed';
      }
    });
  }
  
  
}
