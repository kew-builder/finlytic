import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BudgetService } from './services/budget.service';
import { TransactionService } from '../transactions/services/transaction.service';
import { BudgetResponse, CreateBudgetRequest } from './models/budget.model';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-content">

      <div class="page-header">
        <div>
          <h1 class="page-title">Budget Management</h1>
          <p class="page-sub">ตั้งงบประมาณรายหมวดหมู่ต่อเดือน</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">+ Add Budget</button>
      </div>

      <!-- Overview ring card -->
      @if (!loading() && budgets().length > 0) {
        <div class="card budget-overview">
          <div class="budget-ring-wrap">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <!-- Track -->
              <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="12"/>
              <!-- Fill -->
              <circle cx="80" cy="80" r="64" fill="none"
                [attr.stroke]="ringColor()"
                stroke-width="12"
                stroke-linecap="round"
                [attr.stroke-dasharray]="ringCircumference"
                [attr.stroke-dashoffset]="ringOffset()"
                style="transition: stroke-dashoffset 0.6s ease, stroke 0.4s ease"/>
            </svg>
            <div class="budget-ring-center">
              <span class="budget-ring-pct" [style.color]="ringColor()">{{ overallPct() }}%</span>
              <span class="budget-ring-label">used</span>
            </div>
          </div>

          <div class="budget-ring-stats">
            <div class="budget-ring-stat">
              <span class="budget-ring-stat-label">Total Budget</span>
              <span class="budget-ring-stat-val">฿{{ totalBudget().toLocaleString() }}</span>
            </div>
            <div class="budget-ring-stat">
              <span class="budget-ring-stat-label">Total Spent</span>
              <span class="budget-ring-stat-val" [style.color]="ringColor()">฿{{ totalSpent().toLocaleString() }}</span>
            </div>
            <div class="budget-ring-stat">
              <span class="budget-ring-stat-label">Remaining</span>
              <span class="budget-ring-stat-val" style="color:var(--teal)">฿{{ remaining().toLocaleString() }}</span>
            </div>
          </div>
        </div>
      }

      <!-- Budget List -->
      @if (loading()) {
        <div class="budget-grid">
          @for (s of [1,2,3,4]; track s) {
            <div class="card budget-card skeleton-card" style="height:140px"></div>
          }
        </div>
      } @else if (budgets().length === 0) {
        <div class="card empty-state">
          <div class="empty-icon">💰</div>
          <div class="empty-title">No budgets yet</div>
          <div class="empty-sub">Set a monthly budget for a category to start tracking.</div>
          <button class="btn-primary" (click)="openCreate()">Create your first budget</button>
        </div>
      } @else {
        <div class="budget-grid">
          @for (b of budgets(); track b.id) {
            <div class="card budget-card" [class.over-budget]="spentPct(b) > 100">
              <div class="budget-card-header">
                <div class="budget-category">
                  <span class="budget-swatch" [style.background]="b.categoryColor"></span>
                  <span class="budget-cat-name">{{ b.categoryName }}</span>
                </div>
                <div class="budget-actions">
                  <button class="icon-btn" title="Edit" (click)="openEdit(b)">✏️</button>
                  <button class="icon-btn" title="Delete" (click)="confirmDelete(b)">🗑️</button>
                </div>
              </div>

              <div class="budget-amounts">
                <span class="budget-spent">฿{{ b.amount.toLocaleString() }}</span>
                <span class="budget-period">/ {{ b.period }}</span>
              </div>

              <div class="budget-progress-wrap">
                <div class="budget-progress-bar">
                  <div
                    class="budget-progress-fill"
                    [style.width.%]="Math.min(spentPct(b), 100)"
                    [style.background]="progressColor(spentPct(b))">
                  </div>
                </div>
                <span class="budget-pct" [class.over]="spentPct(b) > 100">
                  {{ spentPct(b) > 100 ? 'Over budget' : spentPct(b) + '% used' }}
                </span>
              </div>
            </div>
          }
        </div>

        <!-- AI Budget Insights -->
        <div class="card budget-ai-insights">
          <div class="budget-insights-header">
            <span style="font-size:18px">✨</span>
            <span class="budget-insights-title">AI Budget Insights</span>
            <span class="ai-badge">AI</span>
          </div>
          <div class="budget-insights-list">
            @for (insight of aiInsights; track insight.text) {
              <div class="budget-insight-item">
                <span class="budget-insight-dot" [style.background]="insight.color"></span>
                <span>{{ insight.text }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Create / Edit Modal -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editingId() ? 'Edit Budget' : 'New Budget' }}</h2>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>

            <div class="form-group">
              <label class="form-label">Category</label>
              @if (editingId()) {
                <input class="form-input" [value]="editCategoryName()" disabled />
              } @else {
                <select class="form-input" [(ngModel)]="form.categoryId" [disabled]="categoriesLoading()">
                  <option value="">Select category...</option>
                  @for (cat of availableCategories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Monthly Limit (฿)</label>
              <input class="form-input" type="number" min="1" [(ngModel)]="form.amount" placeholder="e.g. 5000" />
            </div>

            <div class="form-group">
              <label class="form-label">Period</label>
              <select class="form-input" [(ngModel)]="form.period">
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input class="form-input" type="date" [(ngModel)]="form.startDate" />
            </div>

            @if (formError()) {
              <div class="form-error">{{ formError() }}</div>
            }

            <div class="modal-footer">
              <button class="btn-ghost" (click)="closeModal()">Cancel</button>
              <button class="btn-primary" [disabled]="saving()" (click)="save()">
                {{ saving() ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirm -->
      @if (deleteTarget()) {
        <div class="modal-backdrop" (click)="deleteTarget.set(null)">
          <div class="modal modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">Delete Budget</h2>
            </div>
            <p style="color:rgba(232,232,240,0.7);margin-bottom:20px">
              Delete the <strong>{{ deleteTarget()!.categoryName }}</strong> budget?
              This cannot be undone.
            </p>
            <div class="modal-footer">
              <button class="btn-ghost" (click)="deleteTarget.set(null)">Cancel</button>
              <button class="btn-danger" [disabled]="saving()" (click)="doDelete()">
                {{ saving() ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class BudgetComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private txService = inject(TransactionService);
  private cdr = inject(ChangeDetectorRef);

  readonly Math = Math;

  budgets = signal<BudgetResponse[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  formError = signal<string | null>(null);
  editingId = signal<string | null>(null);
  editCategoryName = signal('');
  deleteTarget = signal<BudgetResponse | null>(null);
  categoriesLoading = signal(true);
  availableCategories = signal<{ id: string; name: string; color: string }[]>([]);

  form: { categoryId: string; amount: number; period: string; startDate: string } = {
    categoryId: '', amount: 0, period: 'Monthly', startDate: '',
  };

  // Ring constants
  readonly ringCircumference = 2 * Math.PI * 64; // r=64

  // Computed ring values
  readonly totalBudget = computed(() => this.budgets().reduce((s, b) => s + b.amount, 0));
  readonly totalSpent  = computed(() => Math.round(this.budgets().reduce((s, b) => s + (this.spentPct(b) / 100) * b.amount, 0)));
  readonly remaining   = computed(() => Math.max(0, this.totalBudget() - this.totalSpent()));
  readonly overallPct  = computed(() => {
    const total = this.totalBudget();
    return total > 0 ? Math.min(Math.round((this.totalSpent() / total) * 100), 100) : 0;
  });
  readonly ringOffset  = computed(() => this.ringCircumference * (1 - this.overallPct() / 100));

  ringColor(): string {
    const pct = this.overallPct();
    if (pct >= 90) return 'var(--coral)';
    if (pct >= 70) return 'var(--amber)';
    return 'oklch(65% 0.25 280)';
  }

  progressColor(pct: number): string {
    if (pct >= 90) return 'var(--coral)';
    if (pct >= 70) return 'var(--amber)';
    return 'oklch(65% 0.25 280)';
  }

  readonly aiInsights = [
    { color: 'var(--coral)', text: 'Food & Dining is tracking 18% above last month — consider reviewing dining out frequency.' },
    { color: 'var(--amber)', text: 'Entertainment budget is at 65% with 12 days left in the month.' },
    { color: 'var(--teal)',  text: 'Transportation spending is on track — you\'re 20% under budget so far this month.' },
  ];

  // Simulated spent amounts — real implementation would come from BudgetVsActual API
  // For Phase 4 MVP: show 0% until dashboard provides the spent data
  spentPct(_b: BudgetResponse): number {
    return 0;
  }

  ngOnInit(): void {
    this.loadBudgets();
    this.loadCategories();
  }

  private loadBudgets(): void {
    this.loading.set(true);
    this.budgetService.getAll().subscribe({
      next: (data) => { this.budgets.set(data); this.loading.set(false); this.cdr.markForCheck(); },
      error: () => { this.loading.set(false); this.cdr.markForCheck(); },
    });
  }

  private loadCategories(): void {
    // Reuse transaction.getAll to find categories that exist for this user
    // In a future phase this would be GET /categories
    this.txService.getAll().subscribe({
      next: (txs) => {
        const seen = new Map<string, { id: string; name: string; color: string }>();
        for (const tx of txs) {
          if (tx.categoryId && tx.categoryName && !seen.has(tx.categoryId))
            seen.set(tx.categoryId, { id: tx.categoryId, name: tx.categoryName, color: tx.categoryColor ?? '#6b7280' });
        }
        this.availableCategories.set([...seen.values()]);
        this.categoriesLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => { this.categoriesLoading.set(false); this.cdr.markForCheck(); },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editCategoryName.set('');
    const today = new Date().toISOString().split('T')[0];
    this.form = { categoryId: '', amount: 0, period: 'Monthly', startDate: today };
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEdit(b: BudgetResponse): void {
    this.editingId.set(b.id);
    this.editCategoryName.set(b.categoryName);
    this.form = { categoryId: b.categoryId, amount: b.amount, period: b.period, startDate: b.startDate };
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.formError.set(null);
  }

  confirmDelete(b: BudgetResponse): void {
    this.deleteTarget.set(b);
  }

  save(): void {
    if (!this.editingId() && !this.form.categoryId) {
      this.formError.set('Please select a category.');
      return;
    }
    if (!this.form.amount || this.form.amount <= 0) {
      this.formError.set('Amount must be greater than 0.');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const req: CreateBudgetRequest = {
      categoryId: this.form.categoryId,
      amount: Number(this.form.amount),
      period: this.form.period,
      startDate: this.form.startDate,
    };

    const id = this.editingId();
    const obs$ = id
      ? this.budgetService.update(id, req)
      : this.budgetService.create(req);

    obs$.subscribe({
      next: (saved) => {
        if (id) {
          this.budgets.update((bs) => bs.map((b) => b.id === id ? saved : b));
        } else {
          this.budgets.update((bs) => [...bs, saved]);
        }
        this.saving.set(false);
        this.showModal.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.formError.set(err?.error?.message ?? 'Failed to save. Please try again.');
        this.saving.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  doDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;

    this.saving.set(true);
    this.budgetService.delete(target.id).subscribe({
      next: () => {
        this.budgets.update((bs) => bs.filter((b) => b.id !== target.id));
        this.deleteTarget.set(null);
        this.saving.set(false);
        this.cdr.markForCheck();
      },
      error: () => { this.saving.set(false); this.cdr.markForCheck(); },
    });
  }
}
