import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

type Tab = 'profile' | 'preferences' | 'categories' | 'data' | 'about';

interface Category { id: string; emoji: string; name: string; color: string; isDefault: boolean; }

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', emoji: '🍜', name: 'Food & Dining',   color: '#a78bfa', isDefault: true  },
  { id: '2', emoji: '🚗', name: 'Transport',        color: '#2dd4bf', isDefault: true  },
  { id: '3', emoji: '🎮', name: 'Entertainment',   color: '#fb923c', isDefault: true  },
  { id: '4', emoji: '🏥', name: 'Health',           color: '#facc15', isDefault: true  },
  { id: '5', emoji: '🛍️', name: 'Shopping',         color: '#60a5fa', isDefault: true  },
  { id: '6', emoji: '💡', name: 'Utilities',        color: '#34d399', isDefault: true  },
  { id: '7', emoji: '💰', name: 'Salary',           color: '#4ade80', isDefault: true  },
  { id: '8', emoji: '📦', name: 'Other',            color: '#94a3b8', isDefault: true  },
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="settings-page">

      <!-- Left sub-nav -->
      <nav class="settings-nav">
        @for (tab of tabs; track tab.id) {
          <div class="settings-nav-item" [class.active]="activeTab() === tab.id"
            (click)="activeTab.set(tab.id)">
            <span>{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
          </div>
        }
      </nav>

      <!-- Right content -->
      <div class="settings-content">

        @switch (activeTab()) {

          <!-- ── Profile ── -->
          @case ('profile') {
            <div>
              <h2 class="settings-section-title">Profile</h2>
              <p class="settings-section-sub">Manage your account information</p>
            </div>

            <div class="card settings-card">
              <div class="avatar-row">
                <div class="settings-avatar">K</div>
                <div class="avatar-info">
                  <div class="avatar-name">Kew</div>
                  <div class="avatar-email">koncasnet&#64;gmail.com</div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Display Name</label>
                <input class="form-input" type="text" [(ngModel)]="displayName" />
              </div>

              <div class="form-group">
                <label class="form-label">Email</label>
                <input class="form-input" type="email" [value]="'koncasnet@gmail.com'" disabled
                  style="opacity:0.5;cursor:not-allowed" />
              </div>

              <div style="display:flex;justify-content:flex-end">
                <button class="btn-primary">Save Changes</button>
              </div>

              <!-- Change password -->
              <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:18px">
                <button class="btn-ghost" (click)="showPwForm.set(!showPwForm())">
                  {{ showPwForm() ? '✕ Cancel' : '🔑 Change Password' }}
                </button>
                @if (showPwForm()) {
                  <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
                    <div class="form-group">
                      <label class="form-label">Current Password</label>
                      <input class="form-input" type="password" placeholder="Enter current password" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">New Password</label>
                      <input class="form-input" type="password" placeholder="Enter new password" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Confirm New Password</label>
                      <input class="form-input" type="password" placeholder="Re-enter new password" />
                    </div>
                    <div style="display:flex;justify-content:flex-end">
                      <button class="btn-primary">Update Password</button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ── Preferences ── -->
          @case ('preferences') {
            <div>
              <h2 class="settings-section-title">Preferences</h2>
              <p class="settings-section-sub">Customise how Finlytic works for you</p>
            </div>

            <div class="card settings-card">
              <div class="pref-row">
                <div>
                  <div class="pref-label">Currency</div>
                  <div class="pref-sub">Used for displaying amounts</div>
                </div>
                <select class="form-input" style="width:120px" [(ngModel)]="currency">
                  <option value="THB">฿ THB</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>

              <div style="height:1px;background:rgba(255,255,255,0.05)"></div>

              <div class="pref-row">
                <div>
                  <div class="pref-label">Default Transaction Type</div>
                  <div class="pref-sub">Pre-selected when adding a transaction</div>
                </div>
                <div class="type-toggle" style="width:160px">
                  <button class="type-btn" [class.active-expense]="defaultType === 'Expense'"
                    (click)="defaultType = 'Expense'">Expense</button>
                  <button class="type-btn" [class.active-income]="defaultType === 'Income'"
                    (click)="defaultType = 'Income'">Income</button>
                </div>
              </div>

              <div style="height:1px;background:rgba(255,255,255,0.05)"></div>

              <div class="pref-row">
                <div>
                  <div class="pref-label">Budget Reminders</div>
                  <div class="pref-sub">Alert when approaching budget limit</div>
                </div>
                <label class="toggle-switch" [class.checked]="budgetReminder"
                  (click)="budgetReminder = !budgetReminder">
                  <input type="checkbox" [checked]="budgetReminder" />
                  <span class="toggle-track"></span>
                  <span class="toggle-knob"></span>
                </label>
              </div>

              <div style="height:1px;background:rgba(255,255,255,0.05)"></div>

              <div class="pref-row">
                <div>
                  <div class="pref-label">AI Auto-Categorisation</div>
                  <div class="pref-sub">Automatically suggest categories for new transactions</div>
                </div>
                <label class="toggle-switch" [class.checked]="aiEnabled"
                  (click)="aiEnabled = !aiEnabled">
                  <input type="checkbox" [checked]="aiEnabled" />
                  <span class="toggle-track"></span>
                  <span class="toggle-knob"></span>
                </label>
              </div>

              <div style="height:1px;background:rgba(255,255,255,0.05)"></div>

              <div class="pref-row">
                <div>
                  <div class="pref-label">Theme</div>
                  <div class="pref-sub">Light mode coming soon</div>
                </div>
                <div class="toggle-group">
                  <button class="toggle-opt active">🌙 Dark</button>
                  <button class="toggle-opt" disabled style="opacity:0.4;cursor:not-allowed">☀️ Light</button>
                </div>
              </div>
            </div>
          }

          <!-- ── Categories ── -->
          @case ('categories') {
            <div>
              <h2 class="settings-section-title">Categories</h2>
              <p class="settings-section-sub">Manage spending categories</p>
            </div>

            <div class="card settings-card" style="gap:4px;padding-bottom:20px">
              <div class="cat-list">
                @for (cat of categories(); track cat.id) {
                  <div class="cat-list-item">
                    <div class="cat-list-emoji">{{ cat.emoji }}</div>
                    <span class="cat-list-swatch" [style.background]="cat.color"></span>
                    <span class="cat-list-name">{{ cat.name }}</span>
                    @if (cat.isDefault) {
                      <span class="cat-list-lock" title="Default category">🔒</span>
                    } @else {
                      <button class="icon-btn" title="Edit">✏️</button>
                      <button class="icon-btn" title="Delete">🗑️</button>
                    }
                  </div>
                }
              </div>

              <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:12px;padding-top:16px">
                <button class="btn-ghost" (click)="showCatForm.set(!showCatForm())">
                  {{ showCatForm() ? '✕ Cancel' : '＋ Add Custom Category' }}
                </button>
                @if (showCatForm()) {
                  <div style="display:flex;gap:10px;margin-top:12px;align-items:flex-end">
                    <div class="form-group" style="width:80px">
                      <label class="form-label">Emoji</label>
                      <input class="form-input" type="text" maxlength="2" [(ngModel)]="newEmoji" placeholder="🏠" style="text-align:center;font-size:20px" />
                    </div>
                    <div class="form-group" style="flex:1">
                      <label class="form-label">Name</label>
                      <input class="form-input" type="text" [(ngModel)]="newCatName" placeholder="e.g. Pet Care" />
                    </div>
                    <button class="btn-primary" (click)="addCategory()">Add</button>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ── Data Management ── -->
          @case ('data') {
            <div>
              <h2 class="settings-section-title">Data Management</h2>
              <p class="settings-section-sub">Export or delete your data</p>
            </div>

            <div class="card settings-card">
              <div class="pref-label">Export Data</div>
              <div class="pref-sub" style="margin-bottom:14px">Download all your transactions and budgets</div>
              <div style="display:flex;gap:10px">
                <button class="btn-ghost">📄 Export as CSV</button>
                <button class="btn-ghost">&#123; &#125; Export as JSON</button>
              </div>
            </div>

            <div class="card danger-zone-card">
              <div class="danger-zone-title">⚠ Danger Zone</div>
              <div class="danger-zone-desc">
                Deleting your account is permanent and cannot be undone.
                All your transactions, budgets, and settings will be removed.
              </div>
              <button class="btn-ghost" style="color:var(--coral);border-color:oklch(62% 0.22 25 / 0.3)"
                (click)="showDeleteConfirm.set(!showDeleteConfirm())">
                Delete My Account
              </button>
              @if (showDeleteConfirm()) {
                <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px">
                  <div class="form-group">
                    <label class="form-label" style="color:var(--coral)">Type DELETE to confirm</label>
                    <input class="form-input" type="text" [(ngModel)]="deleteConfirmText"
                      placeholder='Type "DELETE"'
                      style="border-color:oklch(62% 0.22 25 / 0.4)" />
                  </div>
                  <div>
                    <button class="btn-danger" [disabled]="deleteConfirmText !== 'DELETE'">
                      Permanently Delete Account
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- ── About ── -->
          @case ('about') {
            <div>
              <h2 class="settings-section-title">About</h2>
              <p class="settings-section-sub">Finlytic — AI-powered personal finance tracker</p>
            </div>

            <div class="card settings-card">
              <div class="about-logo-row">
                <div class="about-logo-mark">F</div>
                <div>
                  <div style="font-size:18px;font-weight:700">Finlytic</div>
                  <div style="font-size:12px;color:var(--muted)">Personal Finance Tracker</div>
                </div>
              </div>
              <table class="about-table">
                <tr><td>Version</td><td>1.0.0-beta</td></tr>
                <tr><td>Built with</td><td>Angular 19 + .NET 8</td></tr>
                <tr><td>AI Model</td><td>Gemini 1.5 Flash</td></tr>
                <tr><td>Database</td><td>PostgreSQL (Neon)</td></tr>
                <tr><td>Last Updated</td><td>May 2025</td></tr>
              </table>
            </div>
          }

        }
      </div>
    </div>
  `,
})
export class SettingsComponent {
  readonly tabs = [
    { id: 'profile'     as Tab, icon: '👤', label: 'Profile'         },
    { id: 'preferences' as Tab, icon: '⚙️',  label: 'Preferences'    },
    { id: 'categories'  as Tab, icon: '🏷️',  label: 'Categories'     },
    { id: 'data'        as Tab, icon: '📦', label: 'Data Management' },
    { id: 'about'       as Tab, icon: 'ℹ️',  label: 'About'          },
  ];

  activeTab    = signal<Tab>('profile');
  showPwForm   = signal(false);
  showCatForm  = signal(false);
  showDeleteConfirm = signal(false);
  categories   = signal<Category[]>([...DEFAULT_CATEGORIES]);

  // Profile form
  displayName = 'Kew';

  // Preferences
  currency       = 'THB';
  defaultType    = 'Expense';
  budgetReminder = true;
  aiEnabled      = true;

  // New category form
  newEmoji   = '';
  newCatName = '';

  // Delete confirm
  deleteConfirmText = '';

  addCategory(): void {
    if (!this.newCatName.trim()) return;
    this.categories.update(cats => [
      ...cats,
      {
        id: Date.now().toString(),
        emoji: this.newEmoji || '📂',
        name: this.newCatName.trim(),
        color: '#94a3b8',
        isDefault: false,
      },
    ]);
    this.newEmoji = '';
    this.newCatName = '';
    this.showCatForm.set(false);
  }
}
