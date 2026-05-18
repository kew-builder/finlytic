import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { AuthService } from '../../core/auth/auth.service';
import { TransactionService } from '../transactions/services/transaction.service';
import { DashboardService } from './services/dashboard.service';
import {
  BudgetVsActual,
  CategorySummary,
  DashboardSummary,
  Forecast,
  PeriodFilter,
  SpendingTrend,
} from './models/dashboard.model';
import { AiInsight, TransactionResponse } from '../transactions/models/transaction.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-content">

      <!-- Header -->
      <div class="dash-header">
        <div>
          <h1 class="dash-greeting">สวัสดี, {{ auth.currentUser()?.name ?? 'User' }} 👋</h1>
          <p class="dash-sub">ภาพรวมการเงินของคุณ</p>
        </div>
        <!-- Period toggle -->
        <div class="period-toggle">
          <button class="period-btn" [class.active]="period() === 'month'" (click)="setPeriod('month')">เดือนนี้</button>
          <button class="period-btn" [class.active]="period() === '3months'" (click)="setPeriod('3months')">3 เดือน</button>
          <button class="period-btn" [class.active]="period() === '6months'" (click)="setPeriod('6months')">6 เดือน</button>
        </div>
      </div>

      <!-- Row 1: Summary Cards (4 cards, responsive) -->
      @if (loading()) {
        <div class="summary-row summary-row-4">
          @for (s of [1,2,3,4]; track s) { <div class="card summary-card skeleton-card"></div> }
        </div>
      } @else {
        <div class="summary-row summary-row-4">
          <div class="card summary-card glow-teal">
            <div class="summary-label"><span class="label-dot" style="background:#2dd4bf"></span>Income</div>
            <div class="summary-value" style="color:#2dd4bf">{{ fmt(summary()?.totalIncome ?? 0) }}</div>
            <div class="summary-change change-neutral">{{ periodLabel() }}</div>
          </div>
          <div class="card summary-card glow-coral">
            <div class="summary-label"><span class="label-dot" style="background:oklch(62% 0.22 25)"></span>Expenses</div>
            <div class="summary-value" style="color:oklch(62% 0.22 25)">{{ fmt(summary()?.totalExpenses ?? 0) }}</div>
            <div class="summary-change change-neutral">{{ periodLabel() }}</div>
          </div>
          <div class="card summary-card glow-violet">
            <div class="summary-label"><span class="label-dot" style="background:oklch(65% 0.25 280)"></span>Net</div>
            <div class="summary-value" [style.color]="(summary()?.net ?? 0) >= 0 ? '#2dd4bf' : 'oklch(62% 0.22 25)'">
              {{ fmt(summary()?.net ?? 0) }}
            </div>
            <div class="summary-change" [class]="(summary()?.net ?? 0) >= 0 ? 'change-up' : 'change-down'">
              {{ (summary()?.net ?? 0) >= 0 ? '▲ Positive cash flow' : '▼ Negative cash flow' }}
            </div>
          </div>
          <div class="card summary-card">
            <div class="summary-label"><span class="label-dot" style="background:#facc15"></span>Top Category</div>
            <div class="summary-value" style="font-size:1.1rem">{{ summary()?.topCategoryName ?? '—' }}</div>
            <div class="summary-change change-neutral">
              {{ summary()?.topCategoryAmount ? fmt(summary()!.topCategoryAmount!) : 'No data' }}
            </div>
          </div>
        </div>
      }

      <!-- Row 2: Charts -->
      <div class="charts-row">

        <!-- Line: Spending Trend -->
        <div class="card chart-card">
          <div class="chart-title">Monthly Cash Flow</div>
          <div class="chart-subtitle">Income vs Expenses — 6 months</div>
          @if (loading()) { <div class="chart-skeleton"></div> } @else {
            <div class="chart-wrap">
              <canvas #lineCanvas></canvas>
            </div>
            <div class="chart-legend">
              <div class="legend-item"><span class="legend-dot" style="background:#2dd4bf"></span>Income</div>
              <div class="legend-item"><span class="legend-dot" style="background:#a78bfa"></span>Expenses</div>
            </div>
          }
        </div>

        <!-- Donut: Category breakdown -->
        <div class="card chart-card">
          <div class="chart-title">Spending by Category</div>
          <div class="chart-subtitle">{{ periodLabel() }} breakdown</div>
          @if (loading()) { <div class="chart-skeleton"></div> } @else if (categories().length === 0) {
            <div class="ai-empty">No expense data for this period.</div>
          } @else {
            <div class="donut-wrap">
              <div class="donut-canvas-wrap">
                <canvas #donutCanvas width="160" height="160"></canvas>
                <div class="donut-center">
                  <div class="donut-center-label">Total</div>
                  <div class="donut-center-value">{{ fmtShort(donutTotal()) }}</div>
                </div>
              </div>
              <div class="donut-legend">
                @for (cat of categories(); track cat.categoryName) {
                  <div class="donut-legend-item">
                    <span class="donut-swatch" [style.background]="cat.categoryColor"></span>
                    <span class="donut-legend-name">{{ cat.categoryName }}</span>
                    <div class="donut-bar-wrap">
                      <div class="donut-bar" [style.width.%]="cat.percentage" [style.background]="cat.categoryColor"></div>
                    </div>
                    <span class="donut-pct">{{ cat.percentage }}%</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Row 3: Budget vs Actual + Forecast -->
      <div class="charts-row">

        <!-- Bar: Budget vs Actual -->
        <div class="card chart-card">
          <div class="chart-title">Budget vs Actual</div>
          <div class="chart-subtitle">{{ currentMonthLabel() }}</div>
          @if (loading()) { <div class="chart-skeleton"></div> } @else if (budgetVsActual().length === 0) {
            <div class="ai-empty">No budgets set. <a routerLink="/budget" style="color:#a78bfa">Set budgets →</a></div>
          } @else {
            <div class="chart-wrap">
              <canvas #barCanvas></canvas>
            </div>
            <div class="chart-legend">
              <div class="legend-item"><span class="legend-dot" style="background:#a78bfa"></span>Budget</div>
              <div class="legend-item"><span class="legend-dot" style="background:#2dd4bf"></span>Actual</div>
            </div>
          }
        </div>

        <!-- Line: Forecast -->
        <div class="card chart-card">
          <div class="chart-title">Cash Flow Forecast</div>
          <div class="chart-subtitle">AI prediction — next 3 months</div>
          @if (loading()) { <div class="chart-skeleton"></div> } @else if (forecastLoading()) {
            <div class="chart-skeleton"></div>
          } @else if (forecast().length === 0) {
            <div class="ai-empty">Not enough data for forecast yet.</div>
          } @else {
            <div class="chart-wrap">
              <canvas #forecastCanvas></canvas>
            </div>
            <div class="chart-legend">
              <div class="legend-item"><span class="legend-dot" style="background:#2dd4bf"></span>Income (predicted)</div>
              <div class="legend-item"><span class="legend-dot" style="background:#a78bfa"></span>Expenses (predicted)</div>
            </div>
          }
        </div>
      </div>

      <!-- Row 4: Recent Transactions + AI Insights -->
      <div class="bottom-row">

        <!-- Recent Transactions -->
        <div class="card section-card">
          <div class="section-header">
            <div class="section-title">Recent Transactions</div>
          </div>
          @if (txLoading()) {
            @for (s of [1,2,3,4,5]; track s) { <div class="insight-skeleton" style="margin-bottom:8px"></div> }
          } @else if (recentTx().length === 0) {
            <div class="ai-empty">No transactions yet.</div>
          } @else {
            <div class="tx-list">
              @for (tx of recentTx(); track tx.id) {
                <div class="tx-item">
                  <div class="tx-icon">{{ tx.type === 'Income' ? '💰' : (tx.categoryName ? '💳' : '💸') }}</div>
                  <div class="tx-info">
                    <div class="tx-desc">{{ tx.description || tx.categoryName || 'Transaction' }}</div>
                    <div class="tx-meta">{{ tx.transactionDate }} · {{ tx.categoryName ?? 'Uncategorized' }}</div>
                  </div>
                  <div class="tx-amount" [class.income]="tx.type === 'Income'" [class.expense]="tx.type === 'Expense'">
                    {{ tx.type === 'Income' ? '+' : '-' }}{{ fmtShort(tx.amount) }}
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- AI Insights -->
        <div class="card section-card ai-card">
          <div class="ai-header">
            <div class="ai-icon">✨</div>
            <div class="ai-title">AI Insights</div>
            <div class="ai-badge">Gemini</div>
          </div>

          @if (insightsLoading()) {
            <div class="ai-list">
              @for (s of [1,2,3]; track s) { <div class="insight-skeleton"></div> }
            </div>
          } @else if (insightsError()) {
            <div class="ai-empty">Could not load insights. Try again later.</div>
          } @else if (aiInsights().length === 0) {
            <div class="ai-empty">No insights yet — add more transactions to get started.</div>
          } @else {
            <div class="ai-list">
              @for (insight of aiInsights(); track insight.title) {
                <div class="insight-item">
                  <div class="insight-bullet" [style.background]="insightColor(insight.type)"></div>
                  <div class="insight-body">
                    <div class="insight-title">{{ insightIcon(insight.type) }} {{ insight.title }}</div>
                    <div class="insight-text">{{ insight.description }}</div>
                    @if (insight.amount) {
                      <div class="insight-amount">฿{{ insight.amount.toLocaleString() }}</div>
                    }
                  </div>
                </div>
              }
            </div>
          }
          <div class="ai-footer"><span class="ai-note">✦ Powered by Gemini AI</span></div>
        </div>

      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('lineCanvas') lineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('forecastCanvas') forecastCanvas!: ElementRef<HTMLCanvasElement>;

  private lineChart?: Chart;
  private donutChart?: Chart;
  private barChart?: Chart;
  private forecastChart?: Chart;

  auth = inject(AuthService);
  private txService = inject(TransactionService);
  private dashService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  period = signal<PeriodFilter>('month');
  loading = signal(true);
  txLoading = signal(true);
  insightsLoading = signal(true);
  insightsError = signal(false);
  forecastLoading = signal(true);

  summary = signal<DashboardSummary | null>(null);
  categories = signal<CategorySummary[]>([]);
  trend = signal<SpendingTrend[]>([]);
  budgetVsActual = signal<BudgetVsActual[]>([]);
  forecast = signal<Forecast[]>([]);
  aiInsights = signal<AiInsight[]>([]);
  recentTx = signal<TransactionResponse[]>([]);

  donutTotal = computed(() => this.categories().reduce((s, c) => s + c.total, 0));

  periodLabel = computed(() => ({
    month: 'This month', '3months': 'Last 3 months', '6months': 'Last 6 months',
  })[this.period()]);

  currentMonthLabel = computed(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  constructor() {
    Chart.register(
      LineController, LineElement, PointElement, LinearScale,
      CategoryScale, DoughnutController, ArcElement,
      BarController, BarElement,
      Tooltip, Filler,
    );
  }

  ngOnInit(): void {
    this.loadDashboard();
    this.loadInsights();
    this.loadForecast();
  }

  ngOnDestroy(): void {
    this.lineChart?.destroy();
    this.donutChart?.destroy();
    this.barChart?.destroy();
    this.forecastChart?.destroy();
  }

  setPeriod(p: PeriodFilter): void {
    this.period.set(p);
    this.loadDashboard();
  }

  private getDateRange(): { startDate: string; endDate: string } {
    const today = new Date();
    const endDate = this.toDateStr(today);
    const p = this.period();
    let start = new Date(today.getFullYear(), today.getMonth(), 1);
    if (p === '3months') start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    if (p === '6months') start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    return { startDate: this.toDateStr(start), endDate };
  }

  private toDateStr(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private loadDashboard(): void {
    this.loading.set(true);
    const { startDate, endDate } = this.getDateRange();
    const now = new Date();

    forkJoin({
      summary: this.dashService.getSummary(startDate, endDate),
      categories: this.dashService.getCategorySummary(startDate, endDate),
      trend: this.dashService.getTrend(),
      budgetVsActual: this.dashService.getBudgetVsActual(now.getFullYear(), now.getMonth() + 1),
    }).subscribe({
      next: ({ summary, categories, trend, budgetVsActual }) => {
        this.summary.set(summary);
        this.categories.set(categories);
        this.trend.set(trend);
        this.budgetVsActual.set(budgetVsActual);
        this.loading.set(false);
        this.cdr.markForCheck();
        afterNextRender(() => this.initOrUpdateCharts(), { injector: this.injector });
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });

    this.txLoading.set(true);
    this.txService.getAll({ startDate, endDate }).subscribe({
      next: (txs) => {
        this.recentTx.set(txs.slice(0, 5));
        this.txLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => { this.txLoading.set(false); this.cdr.markForCheck(); },
    });
  }

  private loadInsights(): void {
    this.txService.getInsights().subscribe({
      next: (data) => { this.aiInsights.set(data); this.insightsLoading.set(false); this.cdr.markForCheck(); },
      error: () => { this.insightsError.set(true); this.insightsLoading.set(false); this.cdr.markForCheck(); },
    });
  }

  private loadForecast(): void {
    this.dashService.getForecast().subscribe({
      next: (data) => {
        this.forecast.set(data);
        this.forecastLoading.set(false);
        this.cdr.markForCheck();
        afterNextRender(() => this.initForecastChart(), { injector: this.injector });
      },
      error: () => { this.forecastLoading.set(false); this.cdr.markForCheck(); },
    });
  }

  private initOrUpdateCharts(): void {
    this.initLineChart();
    this.initDonutChart();
    this.initBarChart();
  }

  private initLineChart(): void {
    if (!this.lineCanvas) return;
    const ctx = this.lineCanvas.nativeElement.getContext('2d')!;
    const trend = this.trend();

    if (this.lineChart) {
      this.lineChart.data.labels = trend.map((t) => t.label);
      this.lineChart.data.datasets[0].data = trend.map((t) => t.income);
      this.lineChart.data.datasets[1].data = trend.map((t) => t.expenses);
      this.lineChart.update();
      return;
    }

    const tealGrad = ctx.createLinearGradient(0, 0, 0, 220);
    tealGrad.addColorStop(0, 'rgba(45,212,191,0.28)');
    tealGrad.addColorStop(1, 'rgba(45,212,191,0)');
    const violetGrad = ctx.createLinearGradient(0, 0, 0, 220);
    violetGrad.addColorStop(0, 'rgba(167,139,250,0.35)');
    violetGrad.addColorStop(1, 'rgba(167,139,250,0)');

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trend.map((t) => t.label),
        datasets: [
          { label: 'Income', data: trend.map((t) => t.income), borderColor: '#2dd4bf', borderWidth: 2.5, pointBackgroundColor: '#2dd4bf', pointRadius: 4, pointHoverRadius: 6, fill: true, backgroundColor: tealGrad, tension: 0.4 },
          { label: 'Expenses', data: trend.map((t) => t.expenses), borderColor: '#a78bfa', borderWidth: 2.5, pointBackgroundColor: '#a78bfa', pointRadius: 4, pointHoverRadius: 6, fill: true, backgroundColor: violetGrad, tension: 0.4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1a1a35', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, titleColor: '#fff', bodyColor: 'rgba(232,232,240,0.75)', padding: 10, callbacks: { label: (c) => ` ${c.dataset.label}: ฿${(c.parsed.y ?? 0).toLocaleString()}` } },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(232,232,240,0.45)', font: { family: 'Outfit', size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(232,232,240,0.45)', font: { family: 'Outfit', size: 11 }, callback: (v) => `฿${(Number(v) / 1000).toFixed(0)}k` } },
        },
      },
    });
  }

  private initDonutChart(): void {
    if (!this.donutCanvas) return;
    const cats = this.categories();
    const ctx = this.donutCanvas.nativeElement.getContext('2d')!;

    if (this.donutChart) {
      this.donutChart.data.labels = cats.map((c) => c.categoryName);
      this.donutChart.data.datasets[0].data = cats.map((c) => c.total);
      (this.donutChart.data.datasets[0] as any).backgroundColor = cats.map((c) => c.categoryColor);
      this.donutChart.update();
      return;
    }

    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: cats.map((c) => c.categoryName),
        datasets: [{ data: cats.map((c) => c.total), backgroundColor: cats.map((c) => c.categoryColor), borderColor: '#0e0e22', borderWidth: 3, hoverOffset: 6 }],
      },
      options: {
        responsive: false, maintainAspectRatio: false, cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1a1a35', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, titleColor: '#fff', bodyColor: 'rgba(232,232,240,0.75)', padding: 10, callbacks: { label: (c) => ` ฿${(c.raw as number).toLocaleString()} (${cats[c.dataIndex]?.percentage ?? 0}%)` } },
        },
      },
    });
  }

  private initBarChart(): void {
    if (!this.barCanvas) return;
    const bva = this.budgetVsActual();

    if (this.barChart) {
      this.barChart.data.labels = bva.map((b) => b.categoryName);
      this.barChart.data.datasets[0].data = bva.map((b) => b.budgetAmount);
      this.barChart.data.datasets[1].data = bva.map((b) => b.actualSpent);
      (this.barChart.data.datasets[1] as any).backgroundColor = bva.map((b) => b.isOverBudget ? 'rgba(251,146,60,0.7)' : 'rgba(45,212,191,0.7)');
      this.barChart.update();
      return;
    }

    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: bva.map((b) => b.categoryName),
        datasets: [
          { label: 'Budget', data: bva.map((b) => b.budgetAmount), backgroundColor: 'rgba(167,139,250,0.4)', borderColor: '#a78bfa', borderWidth: 1.5, borderRadius: 4 },
          { label: 'Actual', data: bva.map((b) => b.actualSpent), backgroundColor: bva.map((b) => b.isOverBudget ? 'rgba(251,146,60,0.7)' : 'rgba(45,212,191,0.7)'), borderColor: bva.map((b) => b.isOverBudget ? '#fb923c' : '#2dd4bf'), borderWidth: 1.5, borderRadius: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1a1a35', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, titleColor: '#fff', bodyColor: 'rgba(232,232,240,0.75)', padding: 10, callbacks: { label: (c) => ` ${c.dataset.label}: ฿${(c.parsed.y ?? 0).toLocaleString()}` } },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(232,232,240,0.45)', font: { family: 'Outfit', size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(232,232,240,0.45)', font: { family: 'Outfit', size: 11 }, callback: (v) => `฿${(Number(v) / 1000).toFixed(0)}k` } },
        },
      },
    });
  }

  private initForecastChart(): void {
    if (!this.forecastCanvas) return;
    const fc = this.forecast();

    this.forecastChart = new Chart(this.forecastCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: fc.map((f) => f.label),
        datasets: [
          { label: 'Income', data: fc.map((f) => f.predictedIncome), borderColor: '#2dd4bf', borderWidth: 2, borderDash: [5, 4], pointBackgroundColor: '#2dd4bf', pointRadius: 5, tension: 0.3, fill: false },
          { label: 'Expenses', data: fc.map((f) => f.predictedExpenses), borderColor: '#a78bfa', borderWidth: 2, borderDash: [5, 4], pointBackgroundColor: '#a78bfa', pointRadius: 5, tension: 0.3, fill: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1a1a35', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, titleColor: '#fff', bodyColor: 'rgba(232,232,240,0.75)', padding: 10, callbacks: { label: (c) => ` ${c.dataset.label}: ฿${(c.parsed.y ?? 0).toLocaleString()}`, afterLabel: (c) => `  Confidence: ${fc[c.dataIndex]?.confidence ?? '?'}%` } },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(232,232,240,0.45)', font: { family: 'Outfit', size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(232,232,240,0.45)', font: { family: 'Outfit', size: 11 }, callback: (v) => `฿${(Number(v) / 1000).toFixed(0)}k` } },
        },
      },
    });
  }

  fmt(n: number): string {
    return `฿${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  fmtShort(n: number): string {
    const abs = Math.abs(n);
    if (abs >= 1000) return `฿${(abs / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `฿${abs.toLocaleString()}`;
  }

  insightIcon(type: AiInsight['type']): string {
    return { overspending: '⚠️', trend: '📈', anomaly: '🔍', saving_opportunity: '💡' }[type] ?? '✨';
  }

  insightColor(type: AiInsight['type']): string {
    return { overspending: '#fb923c', trend: '#2dd4bf', anomaly: '#a78bfa', saving_opportunity: '#facc15' }[type] ?? '#94a3b8';
  }
}
