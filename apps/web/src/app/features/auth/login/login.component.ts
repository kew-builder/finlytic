import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = signal(false);
  loading = signal(false);
  error = signal('');
  emailError = signal('');
  passwordError = signal('');
  remember = signal(false);

  readonly isProd = environment.production;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.emailError.set('');
    this.passwordError.set('');
    this.error.set('');

    if (!this.email.trim()) {
      this.emailError.set('Email is required');
      return;
    }
    if (!this.email.includes('@')) {
      this.emailError.set('Enter a valid email');
      return;
    }

    if (!environment.production && this.password === 'itbypass') {
      this.loading.set(true);
      this.auth.devLogin(this.email).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => {
          this.error.set('Dev bypass failed — is the API running in Development mode?');
          this.loading.set(false);
        },
      });
      return;
    }

    if (!this.password) {
      this.passwordError.set('Password is required');
      return;
    }

    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.error ?? 'Login failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
