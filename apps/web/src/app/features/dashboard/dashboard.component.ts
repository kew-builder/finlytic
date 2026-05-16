import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center" style="background-color: #0d0d1f;">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white mb-2">
          Welcome, {{ auth.currentUser()?.name ?? 'User' }} 👋
        </h1>
        <p class="text-gray-400 mb-8">Your financial dashboard is coming soon.</p>
        <button (click)="auth.logout()"
          class="px-6 py-2 rounded-lg text-white text-sm hover:opacity-80 transition"
          style="background-color: #1a1a2e; border: 1px solid #2a2a4a;">
          Log out
        </button>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  auth = inject(AuthService);
}
