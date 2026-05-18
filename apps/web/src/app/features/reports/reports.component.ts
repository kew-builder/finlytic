import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

type Period = 'month' | '3months' | '6months' | 'year';

interface CatStat { emoji: string; name: string; amount: number; pct: number; color: string; }
interface TopExpense { rank: number; emoji: string; name: string; category: string; amount: number; }
interface DayCell { day: number | null; amount: number; }

const MOCK: Record<Period, {
  trend: { label: string; income: number; expenses: number }[];
  cats: CatStat[];
  topExpenses: TopExpense[];
  momCats: string[];
  momThis: number[];
  momLast: number[];
  days: number[];
}> = {
  month: {
    trend: [
      { label: 'W1', income: 45000, expenses: 12000 },
      { label: 'W2', income: 0,     expenses: 9800  },
      { label: 'W3', income: 0,     expenses: 14200 },
      { label: 'W4', income: 0,     expenses: 8600  },
    ],
    cats: [
      { emoji: '🍜', name: 'Food & Dining',   amount: 8400, pct: 38, color: 'oklch(65% 0.25 280)' },
      { emoji: '🚗', name: 'Transport',        amount: 4200, pct: 19, color: 'oklch(65% 0.18 175)' },
      { emoji: '🎮', name: 'Entertainment',   amount: 3600, pct: 16, color: 'oklch(62% 0.22 25)'  },
      { emoji: '🏥', name: 'Health',           amount: 2800, pct: 13, color: 'oklch(72% 0.18 70)'  },
      { emoji: '🛍️', name: 'Shopping',         amount: 2200, pct: 10, color: '#a78bfa'             },
      { emoji: '💡', name: 'Utilities',        amount: 800,  pct: 4,  color: '#34d399'             },
    ],
    topExpenses: [
      { rank: 1, emoji: '🏡', name: 'Monthly Rent',       category: 'Housing',       amount: 12000 },
      { rank: 2, emoji: '🍜', name: 'Grab Eats',          category: 'Food & Dining', amount: 3200  },
      { rank: 3, emoji: '⚡', name: 'Electricity Bill',   category: 'Utilities',     amount: 2400  },
      { rank: 4, emoji: '🎮', name: 'PlayStation Plus',   category: 'Entertainment', amount: 1800  },
      { rank: 5, emoji: '🚗', name: 'Grab Taxi',          category: 'Transport',     amount: 1500  },
    ],
    momCats: ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping'],
    momThis: [8400, 4200, 3600, 2800, 2200],
    momLast: [7200, 3800, 4100, 2400, 2600],
    days: [0,0,420,0,1200,0,0, 0,850,0,380,0,0,1100, 2200,0,0,650,0,900,0, 0,480,1300,0,0,0,780, 0,320,0],
  },
  '3months': {
    trend: [
      { label: 'Mar', income: 45000, expenses: 32000 },
      { label: 'Apr', income: 45000, expenses: 38500 },
      { label: 'May', income: 45000, expenses: 41200 },
    ],
    cats: [
      { emoji: '🍜', name: 'Food & Dining',   amount: 27000, pct: 36, color: 'oklch(65% 0.25 280)' },
      { emoji: '🚗', name: 'Transport',        amount: 14000, pct: 19, color: 'oklch(65% 0.18 175)' },
      { emoji: '🎮', name: 'Entertainment',   amount: 12000, pct: 16, color: 'oklch(62% 0.22 25)'  },
      { emoji: '🏥', name: 'Health',           amount: 9000,  pct: 12, color: 'oklch(72% 0.18 70)'  },
      { emoji: '🛍️', name: 'Shopping',         amount: 8500,  pct: 11, color: '#a78bfa'             },
      { emoji: '💡', name: 'Utilities',        amount: 4500,  pct: 6,  color: '#34d399'             },
    ],
    topExpenses: [
      { rank: 1, emoji: '🏡', name: 'Monthly Rent',       category: 'Housing',       amount: 36000 },
      { rank: 2, emoji: '🍜', name: 'Grab Eats',          category: 'Food & Dining', amount: 9800  },
      { rank: 3, emoji: '⚡', name: 'Electricity Bill',   category: 'Utilities',     amount: 7200  },
      { rank: 4, emoji: '🎮', name: 'PlayStation Plus',   category: 'Entertainment', amount: 5400  },
      { rank: 5, emoji: '🚗', name: 'Grab Taxi',          category: 'Transport',     amount: 4200  },
    ],
    momCats: ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping'],
    momThis: [9200, 4800, 3400, 3100, 2900],
    momLast: [8800, 4200, 4100, 2700, 2500],
    days: [],
  },
  '6months': {
    trend: [
      { label: 'Dec', income: 58000, expenses: 28000 },
      { label: 'Jan', income: 45000, expenses: 35000 },
      { label: 'Feb', income: 45000, expenses: 31000 },
      { label: 'Mar', income: 45000, expenses: 32000 },
      { label: 'Apr', income: 45000, expenses: 38500 },
      { label: 'May', income: 45000, expenses: 41200 },
    ],
    cats: [
      { emoji: '🍜', name: 'Food & Dining',   amount: 54000, pct: 35, color: 'oklch(65% 0.25 280)' },
      { emoji: '🚗', name: 'Transport',        amount: 28000, pct: 18, color: 'oklch(65% 0.18 175)' },
      { emoji: '🎮', name: 'Entertainment',   amount: 24000, pct: 16, color: 'oklch(62% 0.22 25)'  },
      { emoji: '🏥', name: 'Health',           amount: 18000, pct: 12, color: 'oklch(72% 0.18 70)'  },
      { emoji: '🛍️', name: 'Shopping',         amount: 17000, pct: 11, color: '#a78bfa'             },
      { emoji: '💡', name: 'Utilities',        amount: 9000,  pct: 8,  color: '#34d399'             },
    ],
    topExpenses: [
      { rank: 1, emoji: '🏡', name: 'Monthly Rent',       category: 'Housing',       amount: 72000 },
      { rank: 2, emoji: '🍜', name: 'Grab Eats',          category: 'Food & Dining', amount: 19800 },
      { rank: 3, emoji: '⚡', name: 'Electricity Bill',   category: 'Utilities',     amount: 14400 },
      { rank: 4, emoji: '🎮', name: 'PlayStation Plus',   category: 'Entertainment', amount: 10800 },
      { rank: 5, emoji: '🚗', name: 'Grab Taxi',          category: 'Transport',     amount: 8400  },
    ],
    momCats: ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping'],
    momThis: [9200, 4800, 3400, 3100, 2900],
    momLast: [8400, 4200, 4100, 2700, 2500],
    days: [],
  },
  year: {
    trend: [
      { label: 'Jun', income: 45000, expenses: 28000 },
      { label: 'Jul', income: 45000, expenses: 31000 },
      { label: 'Aug', income: 45000, expenses: 35000 },
      { label: 'Sep', income: 48000, expenses: 29000 },
      { label: 'Oct', income: 45000, expenses: 33000 },
      { label: 'Nov', income: 45000, expenses: 36000 },
      { label: 'Dec', income: 58000, expenses: 28000 },
      { label: 'Jan', income: 45000, expenses: 35000 },
      { label: 'Feb', income: 45000, expenses: 31000 },
      { label: 'Mar', income: 45000, expenses: 32000 },
      { label: 'Apr', income: 45000, expenses: 38500 },
      { label: 'May', income: 45000, expenses: 41200 },
    ],
    cats: [
      { emoji: '🍜', name: 'Food & Dining',   amount: 108000, pct: 35, color: 'oklch(65% 0.25 280)' },
      { emoji: '🚗', name: 'Transport',        amount: 55000,  pct: 18, color: 'oklch(65% 0.18 175)' },
      { emoji: '🎮', name: 'Entertainment',   amount: 48000,  pct: 15, color: 'oklch(62% 0.22 25)'  },
      { emoji: '🏥', name: 'Health',           amount: 36000,  pct: 12, color: 'oklch(72% 0.18 70)'  },
      { emoji: '🛍️', name: 'Shopping',         amount: 33000,  pct: 11, color: '#a78bfa'             },
      { emoji: '💡', name: 'Utilities',        amount: 18000,  pct: 9,  color: '#34d399'             },
    ],
    topExpenses: [
      { rank: 1, emoji: '🏡', name: 'Monthly Rent',       category: 'Housing',       amount: 144000 },
      { rank: 2, emoji: '🍜', name: 'Grab Eats',          category: 'Food & Dining', amount: 38400  },
      { rank: 3, emoji: '⚡', name: 'Electricity Bill',   category: 'Utilities',     amount: 28800  },
      { rank: 4, emoji: '🎮', name: 'PlayStation Plus',   category: 'Entertainment', amount: 21600  },
      { rank: 5, emoji: '🚗', name: 'Grab Taxi',          category: 'Transport',     amount: 16800  },
    ],
    momCats: ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping'],
    momThis: [9200, 4800, 3400, 3100, 2900],
    momLast: [8400, 4200, 4100, 2700, 2500],
    days: [],
  },
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="reports-page">

      <!-- Header -->
      <div class="reports-header">
        <div>
          <h1 class="reports-title">Reports</h1>
          <p class="reports-sub">Analyse your spending patterns over time</p>
        </div>
        <div class="reports-period-row">
          <div class="period-toggle">
            @for (p of periods; track p.value) {
              <button class="period-btn" [class.active]="period() === p.value"
                (click)="setPeriod(p.value)">{{ p.label }}</button>
            }
          </div>
          <button class="btn-ghost" style="gap:6px;display:flex;align-items:center">📄 Export PDF</button>
        </div>
      </div>

      <!-- Row 1: Income vs Expenses | Net Savings -->
      <div class="reports-grid-2col split-14">
        <div class="card reports-card">
          <div class="reports-card-header">
            <div>
              <div class="reports-card-title">Income vs Expenses</div>
              <div class="reports-card-sub">{{ periodLabel() }}</div>
            </div>
            <div style="display:flex;gap:12px">
              <div class="legend-item"><span class="legend-dot" style="background:oklch(65% 0.18 175)"></span>Income</div>
              <div class="legend-item"><span class="legend-dot" style="background:oklch(65% 0.25 280)"></span>Expenses</div>
            </div>
          </div>
          <div class="reports-chart-wrap">
            @if (loading()) { <div class="chart-skeleton"></div> }
            <canvas #areaChart></canvas>
          </div>
        </div>

        <div class="card reports-card">
          <div class="reports-card-header">
            <div>
              <div class="reports-card-title">Net Savings</div>
              <div class="reports-card-sub">Income minus expenses</div>
            </div>
          </div>
          <div class="reports-chart-wrap">
            @if (loading()) { <div class="chart-skeleton"></div> }
            <canvas #netChart></canvas>
          </div>
        </div>
      </div>

      <!-- Row 2: Spending by Category | Month-over-Month -->
      <div class="reports-grid-2col split-12">
        <div class="card reports-card">
          <div class="reports-card-header">
            <div>
              <div class="reports-card-title">Spending by Category</div>
              <div class="reports-card-sub">{{ periodLabel() }}</div>
            </div>
          </div>
          @if (loading()) {
            @for (s of [1,2,3,4,5,6]; track s) {
              <div class="skeleton" style="height:14px;width:100%;margin-bottom:12px;display:block"></div>
            }
          } @else {
            <div class="cat-bar-list">
              @for (cat of data().cats; track cat.name) {
                <div class="cat-bar-row">
                  <span class="cat-bar-icon">{{ cat.emoji }}</span>
                  <span class="cat-bar-name">{{ cat.name }}</span>
                  <div class="cat-bar-track">
                    <div class="cat-bar-fill" [style.width.%]="cat.pct" [style.background]="cat.color"></div>
                  </div>
                  <span class="cat-bar-amt">&#x0E3F;{{ formatK(cat.amount) }}</span>
                  <span class="cat-bar-pct">{{ cat.pct }}%</span>
                </div>
              }
            </div>
          }
        </div>

        <div class="card reports-card">
          <div class="reports-card-header">
            <div>
              <div class="reports-card-title">Month-over-Month</div>
              <div class="reports-card-sub">This month vs last month</div>
            </div>
            <div style="display:flex;gap:12px">
              <div class="legend-item"><span class="legend-dot" style="background:oklch(65% 0.25 280)"></span>This</div>
              <div class="legend-item"><span class="legend-dot" style="background:rgba(255,255,255,0.2)"></span>Last</div>
            </div>
          </div>
          <div class="reports-chart-wrap-sm">
            @if (loading()) { <div class="chart-skeleton" style="height:260px"></div> }
            <canvas #momChart></canvas>
          </div>
        </div>
      </div>

      <!-- Row 3: Top 5 | Heatmap -->
      <div class="reports-grid-2col split-11">
        <div class="card reports-card">
          <div class="reports-card-header">
            <div class="reports-card-title">Top 5 Expenses</div>
          </div>
          @if (loading()) {
            @for (s of [1,2,3,4,5]; track s) {
              <div class="skeleton" style="height:44px;width:100%;margin-bottom:10px;display:block;border-radius:10px"></div>
            }
          } @else {
            <div class="rank-list">
              @for (item of data().topExpenses; track item.rank) {
                <div class="rank-item">
                  <span class="rank-badge">{{ item.rank }}</span>
                  <span class="rank-icon">{{ item.emoji }}</span>
                  <div class="rank-info">
                    <div class="rank-name">{{ item.name }}</div>
                    <div class="rank-cat">{{ item.category }}</div>
                  </div>
                  <span class="rank-amt">-&#x0E3F;{{ item.amount.toLocaleString() }}</span>
                </div>
              }
            </div>
          }
        </div>

        <div class="card reports-card">
          <div class="reports-card-header">
            <div>
              <div class="reports-card-title">Daily Spending</div>
              <div class="reports-card-sub">May 2025 heatmap</div>
            </div>
          </div>
          <div class="heatmap-wrap">
            <div class="heatmap-header">
              @for (d of dayLabels; track d) {
                <div class="heatmap-day-label">{{ d }}</div>
              }
            </div>
            <div class="heatmap-grid">
              @for (cell of heatmapCells(); track $index) {
                @if (cell.day === null) {
                  <div class="heatmap-cell empty"></div>
                } @else {
                  <div class="heatmap-cell"
                    [style.background]="heatColor(cell.amount)"
                    [title]="'May ' + cell.day + ' — \u0E3F' + cell.amount.toLocaleString()">
                    <span class="heatmap-tooltip">May {{ cell.day }} — &#x0E3F;{{ cell.amount.toLocaleString() }}</span>
                  </div>
                }
              }
            </div>
            <div class="heatmap-legend">
              <span>Less</span>
              <div class="heatmap-legend-cells">
                @for (o of [0.06,0.15,0.28,0.42,0.60]; track o) {
                  <div class="heatmap-legend-cell" [style.background]="'oklch(65% 0.25 280 / ' + o + ')'"></div>
                }
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Analysis -->
      <div class="card reports-ai-card">
        <div class="reports-ai-header">
          <span style="font-size:20px">✨</span>
          <span class="reports-ai-title">AI Spending Analysis</span>
          <span class="ai-badge">AI</span>
        </div>
        <div class="reports-ai-grid">
          @for (insight of aiInsights; track insight.text) {
            <div class="reports-ai-item">
              <span class="reports-ai-dot" [style.background]="insight.color"></span>
              <span>{{ insight.text }}</span>
            </div>
          }
        </div>
      </div>

    </div>
  `,
})
export class ReportsComponent implements OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('areaChart') areaRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('netChart')  netRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('momChart')  momRef!:  ElementRef<HTMLCanvasElement>;

  period  = signal<Period>('month');
  loading = signal(true);

  readonly periods = [
    { value: 'month'   as Period, label: 'This Month' },
    { value: '3months' as Period, label: 'Last 3M'    },
    { value: '6months' as Period, label: 'Last 6M'    },
    { value: 'year'    as Period, label: 'This Year'  },
  ];

  readonly periodLabel = computed(() => {
    const map: Record<Period, string> = {
      month: 'May 2025', '3months': 'Mar – May 2025',
      '6months': 'Dec 2024 – May 2025', year: 'Jun 2024 – May 2025',
    };
    return map[this.period()];
  });

  readonly data = computed(() => MOCK[this.period()]);

  readonly dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  readonly heatmapCells = computed<DayCell[]>(() => {
    const days = this.data().days;
    // May 2025 starts on Thursday (index 3 in Mon=0 grid)
    const cells: DayCell[] = [];
    for (let i = 0; i < 3; i++) cells.push({ day: null, amount: 0 });
    for (let d = 1; d <= 31; d++) cells.push({ day: d, amount: days[d - 1] ?? 0 });
    while (cells.length % 7 !== 0) cells.push({ day: null, amount: 0 });
    return cells;
  });

  readonly aiInsights = [
    { color: 'var(--coral)', text: 'Food & Dining spending increased 16% vs last month. Consider meal prepping to cut costs.' },
    { color: 'var(--amber)', text: 'You\'ve spent \u0E3F14,200 in week 3 alone — your highest single-week spend this month.' },
    { color: 'var(--teal)',  text: 'Transport costs are steady. At this rate you\'ll finish the month 12% under transport budget.' },
  ];

  private charts: Chart[] = [];

  constructor() {
    afterNextRender(() => {
      setTimeout(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
        setTimeout(() => this.buildCharts(), 50);
      }, 600);
    });
  }

  setPeriod(p: Period): void {
    this.period.set(p);
    this.destroyCharts();
    setTimeout(() => this.buildCharts(), 50);
  }

  private buildCharts(): void {
    this.buildAreaChart();
    this.buildNetChart();
    this.buildMomChart();
  }

  private buildAreaChart(): void {
    const canvas = this.areaRef?.nativeElement;
    if (!canvas) return;
    const d = this.data();
    const labels = d.trend.map(t => t.label);
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: d.trend.map(t => t.income),
            borderColor: 'oklch(65% 0.18 175)',
            backgroundColor: 'oklch(65% 0.18 175 / 0.10)',
            fill: true, tension: 0.4, pointRadius: 3,
          },
          {
            label: 'Expenses',
            data: d.trend.map(t => t.expenses),
            borderColor: 'oklch(65% 0.25 280)',
            backgroundColor: 'oklch(65% 0.25 280 / 0.08)',
            fill: true, tension: 0.4, pointRadius: 3,
          },
        ],
      },
      options: this.baseOpts(240),
    });
    this.charts.push(chart);
  }

  private buildNetChart(): void {
    const canvas = this.netRef?.nativeElement;
    if (!canvas) return;
    const d = this.data();
    const nets = d.trend.map(t => t.income - t.expenses);
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: d.trend.map(t => t.label),
        datasets: [{
          label: 'Net',
          data: nets,
          backgroundColor: nets.map(n => n >= 0 ? 'oklch(65% 0.18 175 / 0.7)' : 'oklch(62% 0.22 25 / 0.7)'),
          borderRadius: 4,
        }],
      },
      options: this.baseOpts(240),
    });
    this.charts.push(chart);
  }

  private buildMomChart(): void {
    const canvas = this.momRef?.nativeElement;
    if (!canvas) return;
    const d = this.data();
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: d.momCats,
        datasets: [
          {
            label: 'This Month',
            data: d.momThis,
            backgroundColor: 'oklch(65% 0.25 280 / 0.75)',
            borderRadius: 4,
          },
          {
            label: 'Last Month',
            data: d.momLast,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 4,
          },
        ],
      },
      options: { ...this.baseOpts(260), indexAxis: 'y' as const },
    });
    this.charts.push(chart);
  }

  private baseOpts(height: number): object {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e1e3a',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#e8e8f0',
          bodyColor: 'rgba(232,232,240,0.7)',
          callbacks: {
            label: (ctx: any) => ` \u0E3F${Number(ctx.raw).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(232,232,240,0.5)', font: { family: 'Outfit', size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(232,232,240,0.5)', font: { family: 'Outfit', size: 11 } } },
      },
    };
  }

  heatColor(amount: number): string {
    if (!amount) return 'oklch(65% 0.25 280 / 0.06)';
    const max = 2200;
    const ratio = Math.min(amount / max, 1);
    const opacity = 0.10 + ratio * 0.55;
    return `oklch(65% 0.25 280 / ${opacity.toFixed(2)})`;
  }

  formatK(n: number): string {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toString();
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  ngOnDestroy(): void { this.destroyCharts(); }
}
