import { Component, inject, signal, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TransactionService } from '../transactions/services/transaction.service';
import { ImportJobResponse } from '../transactions/models/transaction.model';

type ImportStep = 'pick' | 'uploading' | 'processing' | 'done' | 'error';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="import-page">
      <div class="import-card">

        <!-- Header -->
        <div class="import-header">
          <a routerLink="/transactions" class="back-link">← Back</a>
          <h1>Import CSV</h1>
          <p class="subtitle">Upload your bank export and AI will auto-categorize every transaction</p>
        </div>

        <!-- Step: Pick file -->
        @if (step() === 'pick') {
          <div
            class="drop-zone"
            [class.drag-over]="dragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="dragging.set(false)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()">
            <div class="drop-icon">📂</div>
            <p class="drop-label">
              @if (selectedFile()) {
                <strong>{{ selectedFile()!.name }}</strong><br>
                <span class="file-size">{{ formatSize(selectedFile()!.size) }}</span>
              } @else {
                Drag & drop your CSV here, or <span class="link-text">browse</span>
              }
            </p>
            <p class="drop-hint">Supports .csv files up to 5 MB</p>
          </div>
          <input #fileInput type="file" accept=".csv" hidden (change)="onFileSelected($event)">

          @if (selectedFile()) {
            <button class="btn-primary" (click)="upload()">
              ✨ Upload & Categorize
            </button>
          }
          @if (errorMsg()) {
            <p class="error-msg">{{ errorMsg() }}</p>
          }
        }

        <!-- Step: Uploading -->
        @if (step() === 'uploading') {
          <div class="status-section">
            <div class="spinner"></div>
            <p>Uploading <strong>{{ selectedFile()!.name }}</strong>…</p>
          </div>
        }

        <!-- Step: Processing (poll for progress) -->
        @if (step() === 'processing') {
          <div class="status-section">
            <div class="progress-bar-wrap">
              <div class="progress-bar" [style.width.%]="progressPercent()"></div>
            </div>
            <p class="progress-label">
              AI categorizing… {{ job()?.processed ?? 0 }} / {{ job()?.total ?? 0 }} rows
            </p>
            <p class="status-badge status-{{ job()?.status }}">{{ job()?.status }}</p>
          </div>
        }

        <!-- Step: Done -->
        @if (step() === 'done' && job()) {
          <div class="result-section">
            <div class="result-icon">✅</div>
            <h2>Import Complete</h2>
            <div class="result-stats">
              <div class="stat">
                <span class="stat-num">{{ job()!.imported }}</span>
                <span class="stat-label">Imported</span>
              </div>
              <div class="stat">
                <span class="stat-num">{{ job()!.failed }}</span>
                <span class="stat-label">Failed</span>
              </div>
              <div class="stat">
                <span class="stat-num">{{ job()!.total }}</span>
                <span class="stat-label">Total</span>
              </div>
            </div>
            @if (job()!.errors.length > 0) {
              <div class="error-list">
                <p class="error-list-title">Issues encountered:</p>
                @for (err of job()!.errors; track err) {
                  <p class="error-list-item">• {{ err }}</p>
                }
              </div>
            }
            <div class="done-actions">
              <button class="btn-primary" (click)="goToTransactions()">View Transactions</button>
              <button class="btn-ghost" (click)="reset()">Import Another File</button>
            </div>
          </div>
        }

        <!-- Step: Error -->
        @if (step() === 'error') {
          <div class="status-section">
            <div class="result-icon">❌</div>
            <p>{{ errorMsg() }}</p>
            <button class="btn-ghost" (click)="reset()">Try Again</button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .import-page {
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 2rem 1rem;
      background: var(--bg-primary, #0f0f1a);
    }
    .import-card {
      width: 100%;
      max-width: 560px;
      background: var(--bg-card, #1a1a2e);
      border-radius: 16px;
      padding: 2rem;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .import-header { margin-bottom: 1.5rem; }
    .back-link { color: #a78bfa; font-size: 0.85rem; text-decoration: none; }
    .back-link:hover { text-decoration: underline; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; margin: 0.5rem 0 0.25rem; }
    .subtitle { color: #94a3b8; font-size: 0.9rem; margin: 0; }

    .drop-zone {
      border: 2px dashed rgba(167,139,250,0.4);
      border-radius: 12px;
      padding: 2.5rem 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 1rem;
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: #a78bfa;
      background: rgba(167,139,250,0.06);
    }
    .drop-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .drop-label { color: #e2e8f0; margin: 0 0 0.5rem; font-size: 0.95rem; }
    .file-size { color: #64748b; font-size: 0.8rem; }
    .drop-hint { color: #475569; font-size: 0.8rem; margin: 0; }
    .link-text { color: #a78bfa; }

    .btn-primary {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-primary:hover { opacity: 0.88; }
    .btn-ghost {
      width: 100%;
      margin-top: 0.75rem;
      padding: 0.65rem;
      background: transparent;
      color: #94a3b8;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .btn-ghost:hover { border-color: #a78bfa; color: #a78bfa; }

    .status-section {
      text-align: center;
      padding: 2rem 0;
      color: #e2e8f0;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(167,139,250,0.2);
      border-top-color: #a78bfa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .progress-bar-wrap {
      background: rgba(255,255,255,0.06);
      border-radius: 99px;
      height: 8px;
      overflow: hidden;
      margin-bottom: 1rem;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #7c3aed, #a78bfa);
      border-radius: 99px;
      transition: width 0.4s ease;
    }
    .progress-label { color: #94a3b8; font-size: 0.9rem; }
    .status-badge { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }

    .result-section { text-align: center; padding: 1rem 0; }
    .result-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    h2 { color: #f1f5f9; font-size: 1.25rem; margin: 0 0 1.5rem; }
    .result-stats { display: flex; justify-content: center; gap: 2rem; margin-bottom: 1.5rem; }
    .stat { display: flex; flex-direction: column; align-items: center; }
    .stat-num { font-size: 2rem; font-weight: 700; color: #a78bfa; }
    .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

    .error-list { text-align: left; background: rgba(239,68,68,0.08); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .error-list-title { color: #f87171; font-size: 0.85rem; font-weight: 600; margin: 0 0 0.5rem; }
    .error-list-item { color: #fca5a5; font-size: 0.8rem; margin: 0.25rem 0; }

    .done-actions { display: flex; flex-direction: column; gap: 0.5rem; }
    .error-msg { color: #f87171; font-size: 0.85rem; margin-top: 0.5rem; text-align: center; }
  `]
})
export class ImportComponent implements OnDestroy {
  private txService = inject(TransactionService);
  private router = inject(Router);

  step = signal<ImportStep>('pick');
  dragging = signal(false);
  selectedFile = signal<File | null>(null);
  job = signal<ImportJobResponse | null>(null);
  errorMsg = signal<string | null>(null);

  progressPercent = () => {
    const j = this.job();
    if (!j || j.total === 0) return 0;
    return Math.round((j.processed / j.total) * 100);
  };

  private pollInterval?: ReturnType<typeof setInterval>;

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(true);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      this.errorMsg.set('Only .csv files are accepted.');
      return;
    }
    this.errorMsg.set(null);
    this.selectedFile.set(file);
  }

  upload() {
    const file = this.selectedFile();
    if (!file) return;

    this.step.set('uploading');

    this.txService.uploadCsv(file).subscribe({
      next: ({ jobId }) => {
        this.step.set('processing');
        this.startPolling(jobId);
      },
      error: (err) => {
        const msg = err.error?.error ?? 'Upload failed. Please try again.';
        this.errorMsg.set(msg);
        this.step.set('error');
      }
    });
  }

  private startPolling(jobId: string) {
    this.pollInterval = setInterval(() => {
      this.txService.getImportJob(jobId).subscribe({
        next: (job) => {
          this.job.set(job);
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(this.pollInterval);
            this.step.set('done');
          }
        },
        error: () => clearInterval(this.pollInterval)
      });
    }, 2000);
  }

  goToTransactions() {
    this.router.navigate(['/transactions']);
  }

  reset() {
    clearInterval(this.pollInterval);
    this.step.set('pick');
    this.selectedFile.set(null);
    this.job.set(null);
    this.errorMsg.set(null);
  }

  formatSize(bytes: number): string {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
  }
}
