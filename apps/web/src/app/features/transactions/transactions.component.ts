import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TransactionService } from './services/transaction.service';
import {
  CreateTransactionRequest,
  TransactionResponse,
} from './models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tx-page">

      <!-- Header -->
      <div class="tx-page-header">
        <div>
          <h1 class="tx-page-title">Transactions</h1>
          <p class="tx-page-sub">บันทึกรายรับ-รายจ่ายของคุณ</p>
        </div>
        <button class="btn-primary" (click)="openAdd()">+ Add Transaction</button>
      </div>

      <!-- Filter bar -->
      <div class="card tx-filters">
        <select class="form-input" [(ngModel)]="filterType" (ngModelChange)="load()">
          <option value="">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
        <input class="form-input" type="date" [(ngModel)]="filterStart" (ngModelChange)="load()" placeholder="Start date" />
        <input class="form-input" type="date" [(ngModel)]="filterEnd" (ngModelChange)="load()" placeholder="End date" />
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
      @if (!loading() && !error() && transactions().length === 0) {
        <div class="card tx-empty">
          <div class="tx-empty-icon">📋</div>
          <div class="tx-empty-title">No transactions yet</div>
          <div class="tx-empty-sub">Click "+ Add Transaction" to get started</div>
        </div>
      }

      <!-- Table -->
      @if (!loading() && transactions().length > 0) {
        <div class="card tx-table-wrap">
          <table class="tx-table">
            <thead>
              <tr class="tx-table-head">
                <th>Description</th>
                <th>Date</th>
                <th>Category</th>
                <th>Type</th>
                <th class="tx-th-amount">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (tx of transactions(); track tx.id) {
                <tr class="tx-table-row">
                  <td class="tx-td-desc">
                    <span class="tx-type-dot" [class.income]="tx.type === 'Income'" [class.expense]="tx.type === 'Expense'"></span>
                    {{ tx.description || '—' }}
                  </td>
                  <td class="tx-td-muted">{{ formatDate(tx.transactionDate) }}</td>
                  <td class="tx-td-muted">
                    @if (tx.categoryName) {
                      <span class="tx-cat-badge" [style.background]="tx.categoryColor + '22'" [style.color]="tx.categoryColor ?? 'inherit'">
                        {{ tx.categoryName }}
                      </span>
                    } @else {
                      <span class="tx-td-muted">—</span>
                    }
                  </td>
                  <td>
                    <span class="tx-type-badge" [class.income]="tx.type === 'Income'" [class.expense]="tx.type === 'Expense'">
                      {{ tx.type }}
                    </span>
                  </td>
                  <td class="tx-td-amount" [class.income]="tx.type === 'Income'" [class.expense]="tx.type === 'Expense'">
                    {{ tx.type === 'Income' ? '+' : '-' }}{{ formatAmount(tx.amount) }}
                  </td>
                  <td class="tx-td-actions">
                    <button class="btn-icon" (click)="openEdit(tx)" title="Edit">✏️</button>
                    <button class="btn-icon btn-icon-danger" (click)="confirmDelete(tx)" title="Delete">🗑️</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal -->
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

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Amount (฿) *</label>
                  <input class="form-input" type="number" min="0.01" step="0.01"
                    [(ngModel)]="fAmount" placeholder="0.00" />
                </div>
                <div class="form-group">
                  <label class="form-label">Type *</label>
                  <select class="form-input" [(ngModel)]="fType">
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <input class="form-input" type="text" maxlength="500"
                  [(ngModel)]="fDescription" placeholder="e.g. Lunch, Salary..." />
              </div>

              <div class="form-group">
                <label class="form-label">Date *</label>
                <input class="form-input" type="date" [(ngModel)]="fDate" />
              </div>

            </div>

            <div class="modal-footer">
              <button class="btn-ghost" (click)="closeForm()" [disabled]="saving()">Cancel</button>
              <button class="btn-primary" (click)="save()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : (editingTx() ? 'Save Changes' : 'Add') }}
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
})
export class TransactionsComponent implements OnInit {
  private svc = inject(TransactionService);

  transactions = signal<TransactionResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showForm = signal(false);
  editingTx = signal<TransactionResponse | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);

  filterType = '';
  filterStart = '';
  filterEnd = '';

  fAmount = '';
  fType: 'Income' | 'Expense' = 'Expense';
  fDescription = '';
  fDate = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getAll({
      type: this.filterType as 'Income' | 'Expense' | undefined || undefined,
      startDate: this.filterStart || undefined,
      endDate: this.filterEnd || undefined,
    }).subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load transactions. Please try again.');
        this.loading.set(false);
      },
    });
  }

  clearFilters(): void {
    this.filterType = '';
    this.filterStart = '';
    this.filterEnd = '';
    this.load();
  }

  openAdd(): void {
    this.editingTx.set(null);
    this.fAmount = '';
    this.fType = 'Expense';
    this.fDescription = '';
    this.fDate = new Date().toISOString().split('T')[0];
    this.formError.set(null);
    this.showForm.set(true);
  }

  openEdit(tx: TransactionResponse): void {
    this.editingTx.set(tx);
    this.fAmount = tx.amount.toString();
    this.fType = tx.type;
    this.fDescription = tx.description ?? '';
    this.fDate = tx.transactionDate;
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

    const req: CreateTransactionRequest = {
      amount,
      type: this.fType,
      description: this.fDescription.trim() || null,
      transactionDate: this.fDate,
      categoryId: null,
    };

    this.saving.set(true);
    this.formError.set(null);

    const editing = this.editingTx();
    const call = editing
      ? this.svc.update(editing.id, req)
      : this.svc.create(req);

    call.subscribe({
      next: (saved) => {
        if (editing) {
          this.transactions.update(list => list.map(t => t.id === saved.id ? saved : t));
        } else {
          this.transactions.update(list => [saved, ...list]);
        }
        this.saving.set(false);
        this.closeForm();
      },
      error: () => {
        this.formError.set('Failed to save. Please check your input and try again.');
        this.saving.set(false);
      },
    });
  }

  confirmDelete(tx: TransactionResponse): void {
    const label = tx.description ?? `transaction of ฿${tx.amount}`;
    if (!confirm(`Delete "${label}"?`)) return;

    this.svc.delete(tx.id).subscribe({
      next: () => this.transactions.update(list => list.filter(t => t.id !== tx.id)),
      error: () => this.error.set('Failed to delete. Please try again.'),
    });
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  formatAmount(n: number): string {
    return `฿${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }
}
