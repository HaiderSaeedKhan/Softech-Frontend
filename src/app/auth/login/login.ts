// // src/app/auth/login/login.ts
// import { Component } from '@angular/core';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';
// import { Auth } from '../../services/auth';

// @Component({
//   standalone: true,
//   selector: 'app-login',
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './login.html',
//   styleUrls: ['./login.css']  // typo was: styleUrl → should be plural styleUrls
// })
// export class Login {
//   loginForm = this.fb.group({
//     email: ['', [Validators.required, Validators.email]],
//     password: ['', Validators.required]
//   });

//   error: string = '';

//   constructor(private fb: FormBuilder, private auth: Auth, private router: Router) {}

//   // submit() {
//   //   this.auth.login(this.loginForm.getRawValue() as { email: string; password: string }).subscribe({
//   //     next: (res: { token: string }) => {
//   //       this.auth.saveToken(res.token);
//   //       this.router.navigate(['/dashboard']);
//   //     },
//   //     error: () => this.error = 'Invalid credentials'
//   //   });
//   // }
//   submit() {
//     const formData = this.loginForm.getRawValue();
  
//     this.auth.login({
//       email: formData.email!,
//       password: formData.password!
//     }).subscribe({
//       next: (res: { token: string }) => {
//         this.auth.saveToken(res.token);
//         this.router.navigate(['/dashboard']);
//       },
//       error: () => this.error = 'Invalid credentials'
//     });
//   }
  
// }


// src/app/auth/login/login.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatError } from '@angular/material/form-field';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatError],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  loginForm!: FormGroup;  // will be initialized in ngOnInit
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {

    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  // submit(): void {
  //   const formData = this.loginForm.getRawValue();

  //   this.auth.login({
  //     email: formData.email!,
  //     password: formData.password!
  //   }).subscribe({
  //     next: (res: { token: string }) => {
  //       this.auth.saveToken(res.token);
  //       this.router.navigate(['/dashboard']);
  //     },
  //     error: () => {
  //       this.error = 'Invalid credentials';
  //     }
  //   });
  // }
  submit(): void {
    if (this.loginForm.invalid) {
      this.error = 'Please enter valid credentials';
      return;
    }
  
    const formData = this.loginForm.getRawValue();
    this.auth.login({
      email: formData.email!,
      password: formData.password!
    }).subscribe({
      next: (res: { token: string }) => {
        this.error = '';
        this.auth.saveToken(res.token);
        this.router.navigate(['/dashboard']);
      },
      error: () => this.error = 'Invalid credentials'
    });
  }
}
