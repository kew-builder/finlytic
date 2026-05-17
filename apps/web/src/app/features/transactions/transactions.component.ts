import { ChangeDetectionStrategy, Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TransactionService } from './services/transaction.service';
import {
  CategoryMeta,
  CreateTransactionRequest,
  DEFAULT_CATEGORIES,
  TransactionResponse,
} from './models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tx-page">

      <!-- Page header -->
      <div class="tx-page-header">
        <h1 class="tx-page-title">Transactions</h1>
        <div class="tx-header-actions">
          <button class="btn-ghost" disabled style="opacity:0.5;cursor:not-allowed">📄 Import CSV</button>
          <button class="btn-primary" (click)="openAdd()">＋ Add Transaction</button>
        </div>
      </div>

      <!-- Summary bar -->
      @if (!loading() && transactions().length > 0) {
        <div class="summary-bar card">
          <span class="summary-label">{{ currentPeriodLabel }}</span>
          <div class="summary-divider"></div>
          <span class="summary-item">Income
            <span class="summary-val income">+{{ formatAmount(totalIncome()) }}</span>
          </span>
          <div class="summary-divider"></div>
          <span class="summary-item">Expenses
            <span class="summary-val expense">-{{ formatAmount(totalExpense()) }}</span>
          </span>
          <div class="summary-divider"></div>
          <span class="summary-item">Net
            <span class="summary-val" [class.income]="netAmount() >= 0" [class.expense]="netAmount() < 0">
              {{ netAmount() >= 0 ? '+' : '-' }}{{ formatAmount(absNet()) }}
            </span>
          </span>
        </div>
      }

      <!-- Filter bar -->
      <div class="filter-bar">
        <input class="filter-input" type="date" [(ngModel)]="filterStart" (ngModelChange)="applyFilters()" />
        <span class="filter-to">to</span>
        <input class="filter-input" type="date" [(ngModel)]="filterEnd" (ngModelChange)="applyFilters()" />

        <select class="filter-input" [(ngModel)]="filterCategory" (ngModelChange)="applyFilters()">
          <option value="">All Categories</option>
          @for (c of categories; track c.name) {
            <option [value]="c.name">{{ c.emoji }} {{ c.name }}</option>
          }
        </select>

        <div class="toggle-group">
          @for (t of typeOptions; track t.value) {
            <button class="toggle-opt" [class.active]="filterType === t.value"
              (click)="setTypeFilter(t.value)">{{ t.label }}</button>
          }
        </div>

        <input class="filter-input filter-search" placeholder="Search description…"
          [(ngModel)]="filterSearch" (ngModelChange)="applyFilters()" />

        <select class="filter-input" [(ngModel)]="filterSort" (ngModelChange)="applyFilters()">
          <option value="date">Sort: Date (newest)</option>
          <option value="amount">Sort: Amount (highest)</option>
        </select>

        <button class="btn-ghost" (click)="clearFilters()">Clear</button>
      </div>

      <!-- Error -->
      @if (error()) {
        <div class="tx-error">{{ error() }}</div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="tx-loading">Loading...</div>
      }

      <!-- Empty state -->
      @if (!loading() && !error() && filtered().length === 0) {
        <div class="card tx-empty">
          <div class="tx-empty-icon">📋</div>
          <div class="tx-empty-title">No transactions found</div>
          <div class="tx-empty-sub">
            {{ transactions().length === 0 ? 'Click "+ Add Transaction" to get started' : 'Try adjusting your filters' }}
          </div>
        </div>
      }

      <!-- Table -->
      @if (!loading() && filtered().length > 0) {
        <div class="card tx-table-wrap">
          <table class="tx-table">
            <thead>
              <tr class="tx-table-head">
                <th style="width:110px">Date</th>
                <th>Description</th>
                <th style="width:140px">Category</th>
                <th style="width:100px">Type</th>
                <th class="tx-th-amount" style="width:120px">Amount</th>
                <th style="width:80px"></th>
              </tr>
            </thead>
            <tbody>
              @for (tx of paged(); track tx.id) {
                <tr class="tx-table-row">
                  <td class="tx-td-muted">{{ formatDate(tx.transactionDate) }}</td>
                  <td>
                    <div class="tx-desc-cell">
                      <div class="cat-icon" [style.background]="getCategoryMeta(tx.categoryName).bg">
                        {{ getCategoryMeta(tx.categoryName).emoji }}
                      </div>
                      <div class="tx-desc-text">
                        <span class="tx-desc-main">{{ tx.description || '—' }}</span>
                        @if (tx.aiCategorized) {
                          <span class="badge-ai">AI</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="tx-td-muted" style="font-size:13px">{{ tx.categoryName || '—' }}</td>
                  <td>
                    <span class="badge"
                      [class.badge-income]="tx.type === 'Income'"
                      [class.badge-expense]="tx.type === 'Expense'">
                      {{ tx.type === 'Income' ? '↑ Income' : '↓ Expense' }}
                    </span>
                  </td>
                  <td class="tx-th-amount">
                    <span [class.amount-pos]="tx.type === 'Income'" [class.amount-neg]="tx.type === 'Expense'">
                      {{ tx.type === 'Income' ? '+' : '-' }}{{ formatAmount(tx.amount) }}
                    </span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="row-action-btn" (click)="openEdit(tx)" title="Edit">✎</button>
                      <button class="row-action-btn danger" (click)="openDelete(tx)" title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination-bar">
              <div class="pagination-info">
                Showing {{ showingFrom() }}–{{ showingTo() }} of {{ filtered().length }} transactions
              </div>
              <div class="pagination-btns">
                <button class="page-btn page-nav" [disabled]="page() <= 1"
                  (click)="prevPage()">‹ Prev</button>
                @for (p of pageNumbers(); track p) {
                  <button class="page-btn" [class.active]="page() === p"
                    (click)="page.set(p)">{{ p }}</button>
                }
                <button class="page-btn page-nav" [disabled]="page() >= totalPages()"
                  (click)="nextPage()">Next ›</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Add/Edit Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal-box" (click)="$event.stopPropagation()">

            <div class="modal-header">
              <div class="modal-title">{{ editingTx() ? 'Edit Transaction' : 'Add Transaction' }}</div>
              <button class="modal-close" (click)="closeForm()">✕</button>
            </div>

            @if (formError()) {
              <div class="form-error-banner">{{ formError() }}</div>
            }

            <div class="modal-body">

              <!-- Type toggle -->
              <div class="form-group">
                <label class="form-label">Type</label>
                <div class="type-toggle">
                  <button class="type-btn" type="button"
                    [class.active-expense]="fType === 'Expense'"
                    (click)="fType = 'Expense'">↓ Expense</button>
                  <button class="type-btn" type="button"
                    [class.active-income]="fType === 'Income'"
                    (click)="fType = 'Income'">↑ Income</button>
                </div>
              </div>

              <!-- Amount — large -->
              <div class="form-group">
                <label class="form-label">Amount *</label>
                <div class="amount-input-row" [class.income]="fType === 'Income'" [class.expense]="fType === 'Expense'">
                  <span class="amount-prefix">฿</span>
                  <input type="number" min="0.01" step="0.01"
                    [(ngModel)]="fAmount" placeholder="0.00" />
                </div>
              </div>

              <!-- Description -->
              <div class="form-group">
                <label class="form-label">Description</label>
                <input class="form-input" type="text" maxlength="500"
                  [(ngModel)]="fDescription" placeholder="e.g. Lunch at MK Restaurant, Monthly Salary…" />
              </div>

              <!-- Category -->
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-input" [(ngModel)]="fCategory">
                  <option value="">Select category…</option>
                  @for (c of categories; track c.name) {
                    <option [value]="c.name">{{ c.emoji }} {{ c.name }}</option>
                  }
                </select>
              </div>

              <!-- Date -->
              <div class="form-group">
                <label class="form-label">Date *</label>
                <input class="form-input" type="date" [(ngModel)]="fDate" />
              </div>

              <!-- Note -->
              <div class="form-group">
                <label class="form-label">Note <span class="form-label-opt">(optional)</span></label>
                <textarea class="form-input form-textarea" [(ngModel)]="fNote"
                  placeholder="Add a note…" rows="2"></textarea>
              </div>

            </div>

            <div class="modal-footer">
              <button class="btn-ghost" (click)="closeForm()" [disabled]="saving()">Cancel</button>
              <button class="btn-primary" (click)="save()" [disabled]="saving()">
                {{ saving() ? 'Saving…' : (editingTx() ? 'Save Changes' : 'Save Transaction') }}
              </button>
            </div>

          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (deletingTx()) {
        <div class="modal-overlay" (click)="closeDelete()">
          <div class="modal-box modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title">Delete Transaction</div>
              <button class="modal-close" (click)="closeDelete()">✕</button>
            </div>
            <div class="modal-body">
              <p class="confirm-text">
                Are you sure you want to delete
                <strong>{{ deletingTx()!.description ?? ('฿' + deletingTx()!.amount) }}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" (click)="closeDelete()">Cancel</button>
              <button class="btn-danger" (click)="executeDelete()">Delete</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class TransactionsComponent implements OnInit {
  private svc = inject(TransactionService);

  readonly currentPeriodLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  readonly categories = DEFAULT_CATEGORIES;
  readonly typeOptions = [
    { value: '',        label: 'All' },
    { value: 'Income',  label: 'Income' },
    { value: 'Expense', label: 'Expense' },
  ];
  readonly perPage = 10;

  // Data
  transactions = signal<TransactionResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filtered list (updated manually by applyFilters)
  filtered = signal<TransactionResponse[]>([]);

  // Pagination
  page = signal(1);

  // Modal state
  showForm = signal(false);
  editingTx = signal<TransactionResponse | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);
  deletingTx = signal<TransactionResponse | null>(null);

  // Filter state (plain properties for ngModel)
  filterType = '';
  filterStart = '';
  filterEnd = '';
  filterCategory = '';
  filterSearch = '';
  filterSort: 'date' | 'amount' = 'date';

  // Form fields
  fAmount = '';
  fType: 'Income' | 'Expense' = 'Expense';
  fDescription = '';
  fDate = new Date().toISOString().split('T')[0];
  fCategory = '';
  fNote = '';

  // Computed: pagination
  paged = computed(() => {
    const start = (this.page() - 1) * this.perPage;
    return this.filtered().slice(start, start + this.perPage);
  });
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.perPage)));
  showingFrom = computed(() => this.filtered().length === 0 ? 0 : (this.page() - 1) * this.perPage + 1);
  showingTo = computed(() => Math.min(this.page() * this.perPage, this.filtered().length));
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  // Computed: summary (from ALL loaded transactions, not filtered)
  totalIncome = computed(() =>
    this.transactions().filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0));
  totalExpense = computed(() =>
    this.transactions().filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0));
  netAmount = computed(() => this.totalIncome() - this.totalExpense());
  absNet = computed(() => Math.abs(this.netAmount()));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getAll().subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load transactions. Please try again.');
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    let list = [...this.transactions()];
    if (this.filterType) list = list.filter(t => t.type === this.filterType);
    if (this.filterStart) list = list.filter(t => t.transactionDate >= this.filterStart);
    if (this.filterEnd)   list = list.filter(t => t.transactionDate <= this.filterEnd);
    if (this.filterCategory) list = list.filter(t => t.categoryName === this.filterCategory);
    if (this.filterSearch) {
      const q = this.filterSearch.toLowerCase();
      list = list.filter(t => t.description?.toLowerCase().includes(q));
    }
    if (this.filterSort === 'amount') list.sort((a, b) => b.amount - a.amount);
    this.filtered.set(list);
    this.page.set(1);
  }

  setTypeFilter(value: string): void {
    this.filterType = value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterType = '';
    this.filterStart = '';
    this.filterEnd = '';
    this.filterCategory = '';
    this.filterSearch = '';
    this.filterSort = 'date';
    this.applyFilters();
  }

  openAdd(): void {
    this.editingTx.set(null);
    this.fAmount = '';
    this.fType = 'Expense';
    this.fDescription = '';
    this.fDate = new Date().toISOString().split('T')[0];
    this.fCategory = '';
    this.fNote = '';
    this.formError.set(null);
    this.showForm.set(true);
  }

  openEdit(tx: TransactionResponse): void {
    this.editingTx.set(tx);
    this.fAmount = tx.amount.toString();
    this.fType = tx.type;
    this.fDescription = tx.description ?? '';
    this.fDate = tx.transactionDate;
    this.fCategory = tx.categoryName ?? '';
    this.fNote = '';
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingTx.set(null);
  }

  save(): void {
    const amount = parseFloat(this.fAmount);
    if (!this.fAmount || isNaN(amount) || amount <= 0) {
      this.formError.set('Amount must be greater than 0.');
      return;
    }
    if (!this.fDate) {
      this.formError.set('Date is required.');
      return;
    }

    const categoryId = this.fCategory
      ? this.transactions().find(t => t.categoryName === this.fCategory)?.categoryId ?? null
      : null;

    const req: CreateTransactionRequest = {
      amount,
      type: this.fType,
      description: this.fDescription.trim() || null,
      transactionDate: this.fDate,
      categoryId,
    };

    this.saving.set(true);
    this.formError.set(null);

    const editing = this.editingTx();
    const call = editing ? this.svc.update(editing.id, req) : this.svc.create(req);

    call.subscribe({
      next: (saved) => {
        if (editing) {
          this.transactions.update(list => list.map(t => t.id === saved.id ? saved : t));
        } else {
          this.transactions.update(list => [saved, ...list]);
        }
        this.applyFilters();
        this.saving.set(false);
        this.closeForm();
      },
      error: () => {
        this.formError.set('Failed to save. Please check your input and try again.');
        this.saving.set(false);
      },
    });
  }

  openDelete(tx: TransactionResponse): void {
    this.deletingTx.set(tx);
  }

  closeDelete(): void {
    this.deletingTx.set(null);
  }

  executeDelete(): void {
    const tx = this.deletingTx();
    if (!tx) return;
    this.svc.delete(tx.id).subscribe({
      next: () => {
        this.transactions.update(list => list.filter(t => t.id !== tx.id));
        this.applyFilters();
        this.closeDelete();
      },
      error: () => this.error.set('Failed to delete. Please try again.'),
    });
  }

  prevPage(): void { this.page.update(p => p - 1); }
  nextPage(): void { this.page.update(p => p + 1); }

  getCategoryMeta(name: string | null): CategoryMeta {
    return this.categories.find(c => c.name === name)
      ?? { name: name ?? '', emoji: '📌', bg: 'rgba(148,163,184,0.12)' };
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      day: 'numeric', month: 'short',
    });
  }

  formatAmount(n: number): string {
    return `฿${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
}
