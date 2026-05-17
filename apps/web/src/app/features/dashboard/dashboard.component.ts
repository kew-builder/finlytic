import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { AiInsight } from '../transactions/models/transaction.model';
import { TransactionService } from '../transactions/services/transaction.service';
import {
  ArcElement,
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

interface SummaryCard {
  label: string;
  amount: number;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  glowClass: string;
  dotColor: string;
  valueColor?: string;
}

interface CategoryItem {
  label: string;
  value: number;
  pct: number;
  color: string;
}

interface TransactionItem {
  emoji: string;
  desc: string;
  date: string;
  amount: number;
  cat: string;
}

interface InsightItem {
  text: string;
  color: string;
}

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
          <p class="dash-sub">พฤษภาคม 2569 — ภาพรวมการเงินของคุณ</p>
        </div>
        <div class="month-pill">📅 พ.ค. 2026</div>
      </div>

      <!-- Row 1: Summary Cards -->
      <div class="summary-row">
        @for (card of summaryCards; track card.label) {
          <div class="card summary-card {{ card.glowClass }}">
            <div class="summary-label">
              <span class="label-dot" [style.background]="card.dotColor"></span>
              {{ card.label }}
            </div>
            <div class="summary-value" [style.color]="card.valueColor ?? 'inherit'">{{ formatFull(card.amount) }}</div>
            <div class="summary-change change-{{ card.changeType }}">{{ card.change }}</div>
          </div>
        }
      </div>

      <!-- Row 2: Charts -->
      <div class="charts-row">

        <!-- Line Chart -->
        <div class="card chart-card">
          <div class="chart-title">Monthly Cash Flow</div>
          <div class="chart-subtitle">Income vs Expenses — 6 months</div>
          <div class="chart-wrap">
            <canvas #lineCanvas></canvas>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-dot" style="background:#2dd4bf"></span>Income
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background:#a78bfa"></span>Expenses
            </div>
          </div>
        </div>

        <!-- Donut Chart -->
        <div class="card chart-card">
          <div class="chart-title">Spending by Category</div>
          <div class="chart-subtitle">May 2026 breakdown</div>
          <div class="donut-wrap">
            <div class="donut-canvas-wrap">
              <canvas #donutCanvas width="160" height="160"></canvas>
              <div class="donut-center">
                <div class="donut-center-label">Total</div>
                <div class="donut-center-value">฿22.5k</div>
              </div>
            </div>
            <div class="donut-legend">
              @for (cat of categories; track cat.label) {
                <div class="donut-legend-item">
                  <span class="donut-swatch" [style.background]="cat.color"></span>
                  <span class="donut-legend-name">{{ cat.label }}</span>
                  <div class="donut-bar-wrap">
                    <div class="donut-bar" [style.width.%]="cat.pct" [style.background]="cat.color"></div>
                  </div>
                  <span class="donut-pct">{{ cat.pct }}%</span>
                </div>
              }
            </div>
          </div>
        </div>

      </div>

      <!-- Row 3: Transactions + AI Insights -->
      <div class="bottom-row">

        <!-- Recent Transactions -->
        <div class="card section-card">
          <div class="section-header">
            <div class="section-title">Recent Transactions</div>
            <span class="view-all-link">View All →</span>
          </div>
          <div class="tx-list">
            @for (tx of transactions; track tx.desc) {
              <div class="tx-item">
                <div class="tx-icon">{{ tx.emoji }}</div>
                <div class="tx-info">
                  <div class="tx-desc">{{ tx.desc }}</div>
                  <div class="tx-meta">{{ tx.date }} · {{ tx.cat }}</div>
                </div>
                <div class="tx-amount" [class.income]="tx.amount > 0" [class.expense]="tx.amount < 0">
                  {{ tx.amount > 0 ? '+' : '' }}{{ formatShort(tx.amount) }}
                </div>
              </div>
            }
          </div>
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
              @for (s of [1,2,3]; track s) {
                <div class="insight-skeleton"></div>
              }
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

          <div class="ai-footer">
            <span class="ai-note">✦ Powered by Gemini AI</span>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineCanvas') lineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;

  private lineChart?: Chart;
  private donutChart?: Chart;

  auth = inject(AuthService);
  private txService = inject(TransactionService);

  aiInsights = signal<AiInsight[]>([]);
  insightsLoading = signal(true);
  insightsError = signal(false);

  ngOnInit(): void {
    this.txService.getInsights().subscribe({
      next: (data) => { this.aiInsights.set(data); this.insightsLoading.set(false); },
      error: () => { this.insightsError.set(true); this.insightsLoading.set(false); },
    });
  }

  insightIcon(type: AiInsight['type']): string {
    return { overspending: '⚠️', trend: '📈', anomaly: '🔍', saving_opportunity: '💡' }[type] ?? '✨';
  }

  insightColor(type: AiInsight['type']): string {
    return { overspending: '#fb923c', trend: '#2dd4bf', anomaly: '#a78bfa', saving_opportunity: '#facc15' }[type] ?? '#94a3b8';
  }

  readonly summaryCards: SummaryCard[] = [
    {
      label: 'Total Balance',
      amount: 45230,
      change: 'Across all accounts',
      changeType: 'neutral',
      glowClass: 'glow-violet',
      dotColor: 'oklch(65% 0.25 280)',
    },
    {
      label: 'Income This Month',
      amount: 35000,
      change: '↑ +8% vs last month',
      changeType: 'up',
      glowClass: 'glow-teal',
      dotColor: '#2dd4bf',
      valueColor: '#2dd4bf',
    },
    {
      label: 'Expenses This Month',
      amount: 22450,
      change: '↑ +12% vs last month',
      changeType: 'down',
      glowClass: 'glow-coral',
      dotColor: 'oklch(62% 0.22 25)',
      valueColor: 'oklch(62% 0.22 25)',
    },
  ];

  readonly categories: CategoryItem[] = [
    { label: 'Food',          value: 8430, pct: 37.5, color: '#a78bfa' },
    { label: 'Transport',     value: 3200, pct: 14.2, color: '#2dd4bf' },
    { label: 'Bills',         value: 5100, pct: 22.7, color: '#f472b6' },
    { label: 'Entertainment', value: 1680, pct: 7.5,  color: '#fb923c' },
    { label: 'Shopping',      value: 2640, pct: 11.7, color: '#facc15' },
    { label: 'Others',        value: 1400, pct: 6.2,  color: '#94a3b8' },
  ];

  readonly transactions: TransactionItem[] = [
    { emoji: '🍜', desc: 'Lunch at MK Restaurant', date: 'May 3',  amount: -350,   cat: 'Food' },
    { emoji: '💰', desc: 'Salary',                  date: 'May 1',  amount: 35000,  cat: 'Income' },
    { emoji: '🚗', desc: 'BTS Monthly Pass',         date: 'May 1',  amount: -1400,  cat: 'Transport' },
    { emoji: '🎬', desc: 'Netflix',                  date: 'Apr 30', amount: -419,   cat: 'Entertainment' },
    { emoji: '🛒', desc: "Lotus's Grocery",          date: 'Apr 29', amount: -1250,  cat: 'Shopping' },
  ];


  formatFull(n: number): string {
    return `฿${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  formatShort(n: number): string {
    const abs = Math.abs(n);
    if (abs >= 1000) return `฿${(abs / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `฿${abs.toLocaleString()}`;
  }

  ngAfterViewInit(): void {
    Chart.register(
      LineController, LineElement, PointElement, LinearScale,
      CategoryScale, DoughnutController, ArcElement, Tooltip, Filler,
    );
    this.initLineChart();
    this.initDonutChart();
  }

  ngOnDestroy(): void {
    this.lineChart?.destroy();
    this.donutChart?.destroy();
  }

  private initLineChart(): void {
    const ctx = this.lineCanvas.nativeElement.getContext('2d')!;

    const tealGrad = ctx.createLinearGradient(0, 0, 0, 220);
    tealGrad.addColorStop(0, 'rgba(45,212,191,0.28)');
    tealGrad.addColorStop(1, 'rgba(45,212,191,0)');

    const violetGrad = ctx.createLinearGradient(0, 0, 0, 220);
    violetGrad.addColorStop(0, 'rgba(167,139,250,0.35)');
    violetGrad.addColorStop(1, 'rgba(167,139,250,0)');

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026'],
        datasets: [
          {
            label: 'Income',
            data: [28000, 30500, 31000, 32000, 33500, 35000],
            borderColor: '#2dd4bf',
            borderWidth: 2.5,
            pointBackgroundColor: '#2dd4bf',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            backgroundColor: tealGrad,
            tension: 0.4,
          },
          {
            label: 'Expenses',
            data: [18000, 20000, 19500, 21000, 20000, 22450],
            borderColor: '#a78bfa',
            borderWidth: 2.5,
            pointBackgroundColor: '#a78bfa',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            backgroundColor: violetGrad,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a35',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: 'rgba(232,232,240,0.75)',
            padding: 10,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ฿${(ctx.parsed.y ?? 0).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: 'rgba(232,232,240,0.45)', font: { family: 'Outfit', size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: 'rgba(232,232,240,0.45)',
              font: { family: 'Outfit', size: 11 },
              callback: (v) => `฿${(Number(v) / 1000).toFixed(0)}k`,
            },
          },
        },
      },
    });
  }

  private initDonutChart(): void {
    const ctx = this.donutCanvas.nativeElement.getContext('2d')!;

    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.categories.map((c) => c.label),
        datasets: [
          {
            data: this.categories.map((c) => c.value),
            backgroundColor: this.categories.map((c) => c.color),
            borderColor: '#0e0e22',
            borderWidth: 3,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a35',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: 'rgba(232,232,240,0.75)',
            padding: 10,
            callbacks: {
              label: (ctx) =>
                ` ฿${(ctx.raw as number).toLocaleString()} (${this.categories[ctx.dataIndex].pct}%)`,
            },
          },
        },
      },
    });
  }
}
