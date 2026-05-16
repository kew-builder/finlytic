import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

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

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.emailError.set('');
    this.passwordError.set('');
    this.error.set('');

    let valid = true;
    if (!this.email.trim()) {
      this.emailError.set('Email is required');
      valid = false;
    } else if (!this.email.includes('@')) {
      this.emailError.set('Enter a valid email');
      valid = false;
    }
    if (!this.password) {
      this.passwordError.set('Password is required');
      valid = false;
    }
    if (!valid) return;

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