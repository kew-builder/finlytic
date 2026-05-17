import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule],
  styles: [`
    :host { display: flex; height: 100vh; width: 100%; overflow: hidden; }

    .sidebar {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      width: 240px;
      min-height: 100vh;
      background: #0e0e22;
      border-right: 1px solid rgba(255,255,255,0.08);
      overflow: hidden;
      position: sticky;
      top: 0;
      z-index: 40;
      transition: width 300ms ease;
    }
    .sidebar.collapsed { width: 68px; }

    .sidebar-logo {
      height: 64px;
      display: flex;
      align-items: center;
      padding: 0 18px;
      gap: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
    .logo-mark {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
      background: linear-gradient(135deg, oklch(65% 0.25 280), oklch(58% 0.22 250));
      box-shadow: 0 0 16px oklch(65% 0.25 280 / 0.5);
    }
    .logo-text {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.3px;
      white-space: nowrap;
      overflow: hidden;
      background: linear-gradient(90deg, #fff 60%, oklch(65% 0.25 280));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      transition: opacity 200ms, width 200ms;
    }
    .sidebar.collapsed .logo-text { opacity: 0; width: 0; }

    .nav-section {
      flex: 1;
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-radius: 9px;
      cursor: pointer;
      color: rgba(232,232,240,0.45);
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-decoration: none;
      transition: background 150ms, color 150ms;
    }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: #e8e8f0; }
    .nav-item.active {
      color: oklch(65% 0.25 280);
      background: oklch(65% 0.25 280 / 0.15);
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      width: 3px;
      height: 60%;
      border-radius: 0 2px 2px 0;
      background: oklch(65% 0.25 280);
      box-shadow: 0 0 8px oklch(65% 0.25 280);
    }
    .nav-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 17px;
    }
    .nav-label { transition: opacity 200ms, width 200ms; }
    .sidebar.collapsed .nav-label { opacity: 0; width: 0; }

    .sidebar-user {
      padding: 14px 10px;
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      overflow: hidden;
    }
    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
      background: linear-gradient(135deg, oklch(55% 0.20 280), oklch(65% 0.18 175));
    }
    .user-info { overflow: hidden; transition: opacity 200ms, width 200ms; }
    .sidebar.collapsed .user-info { opacity: 0; width: 0; }
    .user-name { font-size: 13px; font-weight: 600; color: #e8e8f0; white-space: nowrap; }
    .user-role { font-size: 11px; color: rgba(232,232,240,0.45); white-space: nowrap; }

    .collapse-btn {
      position: absolute;
      right: -12px;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #0e0e22;
      border: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: rgba(232,232,240,0.45);
      font-size: 11px;
      z-index: 50;
      transition: color 150ms, background 150ms;
    }
    .collapse-btn:hover { color: #e8e8f0; background: #0a0a1a; }

    .main-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #0a0a1a;
    }

    .topbar {
      height: 64px;
      background: #0e0e22;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      padding: 0 28px;
      gap: 16px;
      flex-shrink: 0;
    }
    .topbar-title { font-size: 18px; font-weight: 700; color: #e8e8f0; }
    .topbar-spacer { flex: 1; }
    .topbar-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
      background: linear-gradient(135deg, oklch(55% 0.20 280), oklch(65% 0.18 175));
      cursor: pointer;
    }
    .logout-btn {
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: rgba(232,232,240,0.6);
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      cursor: pointer;
      transition: color 150ms, background 150ms;
    }
    .logout-btn:hover { color: #e8e8f0; background: rgba(255,255,255,0.06); }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 28px;
    }
    .content::-webkit-scrollbar { width: 6px; }
    .content::-webkit-scrollbar-track { background: transparent; }
    .content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  `],
  template: `
    <div class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar-logo">
        <div class="logo-mark">F</div>
        <div class="logo-text">Finlytic</div>
      </div>

      <nav class="nav-section">
        @for (item of navItems; track item.route) {
          <a class="nav-item"
             [class.active]="isActive(item.route)"
             [routerLink]="item.route">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="sidebar-user">
        <div class="user-avatar">{{ userInitials() }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.currentUser()?.name ?? 'User' }}</div>
          <div class="user-role">Free Plan</div>
        </div>
      </div>

      <div class="collapse-btn" (click)="toggleCollapse()">
        {{ collapsed() ? '›' : '‹' }}
      </div>
    </div>

    <div class="main-wrap">
      <div class="topbar">
        <span class="topbar-title">{{ activeLabel() }}</span>
        <div class="topbar-spacer"></div>
        <button class="logout-btn" (click)="auth.logout()">Log out</button>
        <div class="topbar-avatar">{{ userInitials() }}</div>
      </div>
      <div class="content">
        <router-outlet />
      </div>
    </div>
  `,
})
export class LayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  collapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard',    icon: '⊞', route: '/dashboard' },
    { label: 'Transactions', icon: '↕', route: '/transactions' },
    { label: 'Budget',       icon: '◎', route: '/budget' },
    { label: 'Reports',      icon: '◈', route: '/reports' },
    { label: 'Settings',     icon: '⚙', route: '/settings' },
  ];

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  activeLabel = computed(() => {
    const url = this.router.url;
    const match = this.navItems.find(n => url.startsWith(n.route));
    return match?.label ?? 'Dashboard';
  });

  userInitials = computed(() => {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  });
}
