import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div style="color: #e8e8f0;">
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">
        Welcome back, {{ auth.currentUser()?.name ?? 'User' }} 👋
      </h1>
      <p style="color: rgba(232,232,240,0.45); font-size: 14px;">
        Your financial dashboard is coming soon.
      </p>
    </div>
  `,
})
export class DashboardComponent {
  auth = inject(AuthService);
}
