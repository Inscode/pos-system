import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CustomerService } from '../../core/services/customer.service';
import { ExpenseService } from '../../core/services/expense.service';
import { ProductService, SupplierService } from '../../core/services/product.service';
import { ReportService } from '../../core/services/report.service';
import { QuickSaleService, SaleService } from '../../core/services/sale.service';
import { StockService } from '../../core/services/stock.service';
import { DailyReport, ProductStat, RangeReport, SalespersonBreakdown } from '../../core/models/report.model';
import { Product, Supplier } from '../../core/models/product.model';

interface ChartDay { date: string; label: string; revenue: number; previousRevenue: number; }

function colomboDate(offsetDays = 0): string {
  const now = new Date();
  const localParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const parts = Object.fromEntries(localParts.map(part => [part.type, part.value]));
  // Keep Colombo calendar arithmetic independent from the browser timezone.
  const date = new Date(Date.UTC(Number(parts['year']), Number(parts['month']) - 1, Number(parts['day']) + offsetDays));
  return date.toISOString().slice(0, 10);
}

function addDays(dateValue: string, offsetDays: number): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="dashboard-page">
      <header class="dashboard-header">
        <div>
          <div class="eyebrow">OWNER OVERVIEW</div>
          <h1>Dashboard</h1>
          <p>Business overview for {{ selectedDateLabel }}.</p>
        </div>
        <div class="header-actions">
          <label class="date-pill" for="dashboard-date">
            <mat-icon>calendar_today</mat-icon>
            <span>Date</span>
            <input id="dashboard-date" type="date" [ngModel]="selectedDate"
              (ngModelChange)="onDateChange($event)" [max]="todayDate" aria-label="Dashboard date" />
          </label>
          <a class="pos-link" routerLink="/pos"><mat-icon>point_of_sale</mat-icon> Open POS</a>
        </div>
      </header>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="34"></mat-spinner><span>Loading your business summary…</span></div>
      } @else {
        <section class="metric-grid" aria-label="Selected date business metrics">
          <article class="metric-card sales-card">
            <div class="metric-head"><span>Total Sales</span><mat-icon>trending_up</mat-icon></div>
            <strong>{{ money(todaySales) }}</strong>
            <small>{{ (daily?.totalSales || 0) + (daily?.quickSaleCount || 0) }} sales on selected date, including {{ daily?.quickSaleCount || 0 }} quick</small>
          </article>
          <article class="metric-card profit-card">
            <div class="metric-head"><span>Net Profit</span><mat-icon>show_chart</mat-icon></div>
            <strong>{{ money(daily?.netProfit || 0) }}</strong>
            <small>After {{ money(daily?.totalExpenses || 0) }} expenses · {{ daily?.margin || 0 }}% margin</small>
          </article>
          <article class="metric-card credit-card">
            <div class="metric-head"><span>Customer Due</span><mat-icon>account_balance</mat-icon></div>
            <strong>{{ money(customerDue) }}</strong>
            <small>{{ credits.length }} unpaid credit sales</small>
          </article>
          <article class="metric-card expense-card">
            <div class="metric-head"><span>Expenses</span><mat-icon>receipt_long</mat-icon></div>
            <strong>{{ money(daily?.totalExpenses || 0) }}</strong>
            <small>Operating outflow on selected date</small>
          </article>
          <article class="metric-card supplier-card">
            <div class="metric-head"><span>Supplier Due</span><mat-icon>local_shipping</mat-icon></div>
            <strong>{{ money(supplierDue) }}</strong>
            <small>{{ suppliers.length }} active suppliers</small>
          </article>
          <article class="metric-card stock-card">
            <div class="metric-head"><span>Low Stock Items</span><mat-icon>inventory_2</mat-icon></div>
            <strong>{{ lowStock.length }}</strong>
            <small>{{ products.length }} active products in catalog</small>
          </article>
        </section>

        <section class="main-grid">
          <article class="panel sales-panel">
            <div class="panel-heading">
              <div><h2>Sales Overview</h2><p>7 days ending {{ selectedDateLabel }} compared with the prior 7 days</p></div>
              <div class="legend"><span><i class="legend-current"></i>Selected period</span><span><i class="legend-previous"></i>Previous period</span></div>
            </div>
            @if (chartDays.length) {
              <div class="chart-wrap">
                <div class="chart-y-labels"><span>{{ moneyShort(chartMax) }}</span><span>{{ moneyShort(chartMax / 2) }}</span><span>Rs 0</span></div>
                <svg viewBox="0 0 700 220" preserveAspectRatio="none" role="img" aria-label="Sales comparison chart">
                  <line x1="0" y1="25" x2="700" y2="25" class="grid-line" />
                  <line x1="0" y1="105" x2="700" y2="105" class="grid-line" />
                  <line x1="0" y1="185" x2="700" y2="185" class="grid-line" />
                  <polyline [attr.points]="chartLine('previousRevenue')" class="chart-line previous-line" />
                  <polyline [attr.points]="chartLine('revenue')" class="chart-line current-line" />
                  @for (point of chartDots('revenue'); track $index) {
                    <circle [attr.cx]="point.x" [attr.cy]="point.y" r="4" class="current-dot"><title>{{ chartDays[$index].label }}: {{ money(chartDays[$index].revenue) }}</title></circle>
                  }
                </svg>
                <div class="chart-x-labels">@for (day of chartDays; track day.date) { <span>{{ day.label }}</span> }</div>
              </div>
            } @else { <div class="chart-empty">No sales data for this period yet.</div> }
            <div class="chart-total"><span>Selected period</span><strong>{{ money(weekTotal) }}</strong><span class="muted">Previous period {{ money(previousWeekTotal) }}</span></div>
          </article>

          <article class="panel payment-panel">
          <div class="panel-heading"><div><h2>Payment Methods</h2><p>Recorded sales on selected date</p></div><mat-icon class="panel-icon">donut_large</mat-icon></div>
            <div class="payment-content">
              <div class="donut" [style.background]="paymentGradient">
                <div class="donut-center"><strong>{{ money(paymentTotal) }}</strong><small>Total</small></div>
              </div>
              <div class="payment-legend">
                <div><i class="pay-cash"></i><span>Cash</span><strong>{{ money(cashPayments) }}</strong></div>
                <div><i class="pay-credit"></i><span>Credit</span><strong>{{ money(creditPayments) }}</strong></div>
                <div><i class="pay-other"></i><span>Other / transfer</span><strong>{{ money(otherPayments) }}</strong></div>
              </div>
            </div>
            <p class="chart-note">Includes regular and quick sales for the selected date; cancelled sales are excluded.</p>
          </article>

          <article class="panel category-panel">
            <div class="panel-heading"><div><h2>Top Selling Categories</h2><p>Ranked by sales revenue · selected 7 days</p></div><mat-icon class="panel-icon">sell</mat-icon></div>
            @if (topCategories.length) {
              <div class="category-list">
                @for (category of topCategories; track category.name) {
                  <div class="category-row">
                    <div class="category-label"><span>{{ category.name }}</span><strong>{{ money(category.revenue) }} <small>({{ categoryShare(category.revenue) }}%)</small></strong></div>
                    <div class="bar-track"><div class="bar-fill" [style.width.%]="categoryWidth(category.revenue)"></div></div>
                  </div>
                }
              </div>
            } @else { <div class="chart-empty">No product sales in the selected 7 days.</div> }
            <div class="panel-foot">{{ categories.length }} categories tracked</div>
          </article>
        </section>

        <section class="quick-stats" aria-label="Shop totals">
          <a class="quick-stat" routerLink="/products"><span class="quick-icon blue"><mat-icon>inventory_2</mat-icon></span><span><small>Total Products</small><strong>{{ products.length }}</strong><em>Active catalog</em></span></a>
          <a class="quick-stat" routerLink="/customers"><span class="quick-icon green"><mat-icon>groups</mat-icon></span><span><small>Total Customers</small><strong>{{ customers.length }}</strong><em>Active clients</em></span></a>
          <a class="quick-stat" routerLink="/suppliers"><span class="quick-icon purple"><mat-icon>local_shipping</mat-icon></span><span><small>Total Suppliers</small><strong>{{ suppliers.length }}</strong><em>Active vendors</em></span></a>
          <a class="quick-stat" routerLink="/credits"><span class="quick-icon red"><mat-icon>payments</mat-icon></span><span><small>Customer Due</small><strong>{{ money(customerDue) }}</strong><em>{{ credits.length }} open credits</em></span></a>
          <a class="quick-stat" routerLink="/suppliers"><span class="quick-icon amber"><mat-icon>request_quote</mat-icon></span><span><small>Supplier Due</small><strong>{{ money(supplierDue) }}</strong><em>Outstanding balances</em></span></a>
        </section>

        <section class="lower-grid">
          <article class="panel salesperson-panel">
            <div class="panel-heading"><div><h2>Sales by Salesperson</h2><p>Regular and quick sales · selected date</p></div><mat-icon class="panel-icon">groups</mat-icon></div>
            @if (salespersonRows.length) {
              <div class="salesperson-list">
                @for (row of salespersonRows; track row.id ?? row.name) {
                  <div class="salesperson-entry">
                    <div class="salesperson-entry-heading">
                      <span>{{ row.name }}</span>
                      <strong>{{ money(row.totalAmount) }}</strong>
                    </div>
                    <div class="salesperson-entry-meta">{{ row.salesCount }} sales</div>
                    <div class="bar-track"><div class="bar-fill" [style.width.%]="salespersonBarWidth(row.totalAmount)"></div></div>
                  </div>
                }
              </div>
            } @else {
              <div class="chart-empty compact">
                @if (salespersonTransactionCount) {
                  {{ salespersonTransactionCount }} sale(s) loaded for {{ selectedDateLabel }}, but the report returned no salesperson names.
                } @else {
                  No sales found for {{ selectedDateLabel }}.
                }
              </div>
            }
          </article>
          <article class="panel expense-panel">
            <div class="panel-heading"><div><h2>Expenses Breakdown</h2><p>Operating outflow on selected date</p></div><span class="expense-total">{{ money(daily?.totalExpenses || 0) }}</span></div>
            @if (expenseRows.length) {
              <div class="expense-list">@for (row of expenseRows; track row.name) {
                <div class="expense-row"><span>{{ labelForExpense(row.name) }}</span><strong>{{ money(row.amount) }}</strong></div>
              }</div>
            } @else { <div class="chart-empty compact">No expenses recorded on this date.</div> }
            <a class="panel-link" routerLink="/expenses">View expenses <mat-icon>arrow_forward</mat-icon></a>
          </article>
          <article class="panel inventory-panel">
            <div class="panel-heading"><div><h2>Inventory Watch</h2><p>Low stock needs attention</p></div><span class="inventory-count" [class.alert]="lowStock.length > 0">{{ lowStock.length }} low</span></div>
            @if (lowStock.length) {
              <div class="inventory-list">@for (item of lowStock.slice(0, 5); track item.id) {
                <div class="inventory-row"><span class="inventory-dot"></span><span class="inventory-name">{{ item.name }}</span><span class="inventory-qty">{{ item.shopStock ?? item.stockQuantity ?? 0 }} left</span></div>
              }</div>
            } @else { <div class="healthy-state"><mat-icon>check_circle</mat-icon><span>Stock levels look healthy.</span></div> }
            <a class="panel-link" routerLink="/products">Manage inventory <mat-icon>arrow_forward</mat-icon></a>
          </article>
        </section>
        <p class="data-note">Quick sale revenue is included in the selected date's sales total. Quick sales don’t include cost prices, so they aren’t included in profit calculations.</p>
      }
    </div>
  `,
  styles: [`
    :host { display:block; min-height:100%; background:#f4f6fa; color:#192b45; }
    .dashboard-page { max-width:1600px; margin:0 auto; padding:28px 32px 34px; }
    .dashboard-header { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:24px; }
    .eyebrow { color:#38866b; font-size:10px; font-weight:800; letter-spacing:1.4px; margin-bottom:6px; }
    h1 { margin:0; color:#172a44; font-size:27px; line-height:1.2; letter-spacing:-.5px; }
    .dashboard-header p { margin:7px 0 0; color:#7d8a9a; font-size:13px; }
    .header-actions { display:flex; align-items:center; gap:10px; }
    .date-pill,.pos-link { display:flex; align-items:center; gap:8px; border:1px solid #e5eaf0; border-radius:8px; background:#fff; padding:8px 11px; color:#53647a; font-size:12px; font-weight:600; text-decoration:none; white-space:nowrap; }
    .date-pill mat-icon { color:#408d73; font-size:17px; width:17px; height:17px; }
    .date-pill input { border:0; background:transparent; color:#53647a; font:inherit; outline:none; min-width:120px; cursor:pointer; }
    .date-pill:focus-within { border-color:#168454; box-shadow:0 0 0 2px rgba(22,132,84,.12); }
    .pos-link { background:#158357; color:#fff; border-color:#158357; }
    .pos-link mat-icon { font-size:17px; width:17px; height:17px; }
    .metric-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:16px; }
    .metric-card,.panel,.quick-stat { background:#fff; border:1px solid #e9edf2; border-radius:10px; box-shadow:0 2px 8px rgba(28,48,72,.035); }
    .metric-card { min-width:0; padding:17px 18px 16px; border-top:3px solid #178253; }
    .profit-card { border-top-color:#249a63; }.credit-card { border-top-color:#ce8a32; }.expense-card { border-top-color:#8062bd; }.supplier-card { border-top-color:#c95359; }.stock-card { border-top-color:#318aa3; }
    .metric-head { display:flex; align-items:center; justify-content:space-between; gap:8px; color:#7c8797; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.45px; }
    .metric-head mat-icon { color:#a9b4c0; font-size:18px; width:18px; height:18px; }
    .metric-card strong { display:block; margin-top:13px; color:#168153; font-size:26px; line-height:1.15; letter-spacing:-.5px; font-weight:800; }
    .profit-card strong { color:#169561; }.credit-card strong { color:#c47a26; }.expense-card strong { color:#7652b4; }.supplier-card strong { color:#c2444b; }.stock-card strong { color:#217d96; }
    .metric-card small { display:block; margin-top:8px; color:#8995a3; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .main-grid { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(280px,.88fr) minmax(280px,1fr); gap:14px; align-items:stretch; }
    .panel { min-width:0; padding:18px; }
    .panel-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .panel-heading h2 { margin:0; color:#24374f; font-size:14px; font-weight:750; }
    .panel-heading p { margin:5px 0 0; color:#98a2af; font-size:10.5px; }
    .panel-icon { color:#aab5c0; font-size:18px; width:18px; height:18px; }
    .legend { display:flex; align-items:center; gap:12px; color:#768496; font-size:10px; white-space:nowrap; }
    .legend span { display:flex; align-items:center; gap:5px; }.legend i { display:inline-block; width:8px; height:8px; border-radius:50%; }
    .legend-current { background:#138454; }.legend-previous { background:#c8d4cd; }
    .chart-wrap { display:grid; grid-template-columns:46px minmax(0,1fr); grid-template-rows:175px 20px; margin-top:22px; }
    .chart-y-labels { display:flex; flex-direction:column; justify-content:space-between; align-items:flex-end; padding:4px 8px 2px 0; color:#9aa5b2; font-size:9px; }
    .chart-wrap svg { width:100%; height:175px; overflow:visible; }
    .grid-line { stroke:#edf1f4; stroke-width:1; }.chart-line { fill:none; stroke-linecap:round; stroke-linejoin:round; stroke-width:3; }
    .current-line { stroke:#148354; }.previous-line { stroke:#c8d4cd; stroke-width:2; stroke-dasharray:5 5; }
    .current-dot { fill:#fff; stroke:#148354; stroke-width:2.5; }
    .chart-x-labels { grid-column:2; display:flex; justify-content:space-between; color:#8995a3; font-size:9px; padding-top:5px; }
    .chart-total { display:flex; align-items:baseline; gap:9px; margin-top:12px; padding-top:12px; border-top:1px solid #f0f2f5; color:#8995a3; font-size:10px; }
    .chart-total strong { color:#1c8659; font-size:15px; }.chart-total .muted { margin-left:auto; }
    .chart-empty { display:flex; align-items:center; justify-content:center; min-height:150px; color:#a0aab6; font-size:12px; }.chart-empty.compact { min-height:80px; }
    .payment-content { display:flex; flex-direction:column; align-items:center; gap:18px; padding:20px 0 10px; }
    .donut { width:154px; height:154px; border-radius:50%; display:grid; place-items:center; position:relative; }
    .donut::before { content:''; position:absolute; inset:18px; border-radius:50%; background:#fff; }
    .donut-center { position:relative; display:flex; flex-direction:column; align-items:center; gap:3px; }.donut-center strong { color:#33485e; font-size:16px; }.donut-center small { color:#94a0ad; font-size:10px; }
    .payment-legend { display:grid; grid-template-columns:1fr 1fr; width:100%; gap:10px 16px; }
    .payment-legend div { display:grid; grid-template-columns:10px 1fr; align-items:center; gap:5px; color:#67778a; font-size:10px; }
    .payment-legend strong { grid-column:2; color:#475b70; font-size:10px; font-weight:600; }
    .payment-legend i { grid-row:span 2; width:8px; height:8px; border-radius:50%; }.pay-cash { background:#168454; }.pay-credit { background:#d69239; }.pay-other { background:#398bb2; }
    .chart-note { color:#a0a9b4; font-size:9px; line-height:1.4; margin:6px 0 0; }
    .category-list { display:flex; flex-direction:column; gap:19px; padding:24px 0 12px; }
    .category-label { display:flex; justify-content:space-between; gap:10px; margin-bottom:7px; font-size:11px; color:#65768a; }.category-label strong { color:#344a60; font-size:10px; white-space:nowrap; }.category-label small { color:#8f9aa7; font-weight:500; }
    .bar-track { height:6px; background:#edf2ef; border-radius:99px; overflow:hidden; }.bar-fill { height:100%; background:#188657; border-radius:99px; }
    .panel-foot { margin-top:auto; border-top:1px solid #f0f2f4; padding-top:12px; color:#9aa4b0; font-size:10px; }
    .quick-stats { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:11px; margin:14px 0; }
    .quick-stat { padding:13px; display:flex; align-items:center; gap:11px; min-width:0; text-decoration:none; transition:transform .15s,box-shadow .15s; }.quick-stat:hover { transform:translateY(-2px); box-shadow:0 5px 16px rgba(28,48,72,.08); }
    .quick-icon { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; flex:none; }.quick-icon mat-icon { font-size:17px; width:17px; height:17px; }.quick-icon.blue { color:#2786a4; background:#eaf5f8; }.quick-icon.green { color:#208658; background:#e9f5ef; }.quick-icon.purple { color:#795db0; background:#f1edfa; }.quick-icon.red { color:#c05a61; background:#fbefef; }.quick-icon.amber { color:#bd842a; background:#faf4e8; }
    .quick-stat>span:last-child { display:flex; flex-direction:column; min-width:0; }.quick-stat small { color:#8591a0; font-size:9px; text-transform:uppercase; font-weight:700; letter-spacing:.35px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }.quick-stat strong { color:#283d54; margin-top:4px; font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }.quick-stat em { color:#4d9b78; font-style:normal; font-size:9px; margin-top:3px; }
    .lower-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }.lower-grid .panel { min-height:190px; display:flex; flex-direction:column; }
    .salesperson-list { display:flex; flex-direction:column; gap:13px; margin:15px 0; }
    .salesperson-entry-heading { display:flex; justify-content:space-between; gap:10px; color:#52657a; font-size:11px; }
    .salesperson-entry-heading span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .salesperson-entry-heading strong { color:#344a60; font-size:10px; white-space:nowrap; }
    .salesperson-entry-meta { margin:3px 0 6px; color:#98a2af; font-size:9px; }
    .expense-total { color:#795bb0; font-size:13px; font-weight:750; }.expense-list { margin:15px 0; display:flex; flex-direction:column; gap:10px; }.expense-row { display:flex; justify-content:space-between; color:#69798b; font-size:11px; }.expense-row strong { color:#394e63; font-size:11px; }
    .panel-link { display:flex; align-items:center; gap:4px; align-self:flex-start; margin-top:auto; color:#23825b; text-decoration:none; font-size:10px; font-weight:700; }.panel-link mat-icon { font-size:14px; width:14px; height:14px; }
    .inventory-count { border-radius:99px; padding:5px 9px; color:#338a62; background:#eaf6ef; font-size:10px; font-weight:700; }.inventory-count.alert { color:#b26034; background:#fff2e7; }
    .inventory-list { display:flex; flex-direction:column; margin:13px 0; }.inventory-row { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid #f2f4f6; font-size:10px; }.inventory-dot { width:7px; height:7px; border-radius:50%; background:#dc9b4c; flex:none; }.inventory-name { flex:1; color:#52657a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.inventory-qty { color:#b36b2d; font-weight:700; white-space:nowrap; }
    .healthy-state { display:flex; align-items:center; gap:8px; min-height:95px; color:#4d9670; font-size:12px; }.healthy-state mat-icon { font-size:19px; width:19px; height:19px; }
    .data-note { margin:13px 2px 0; color:#98a3b0; font-size:10px; }
    .loading { min-height:55vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; color:#8b97a5; font-size:13px; }
    @media (max-width:1150px) { .main-grid { grid-template-columns:1fr 1fr; }.sales-panel { grid-column:1 / -1; }.quick-stats { grid-template-columns:repeat(3,minmax(0,1fr)); }.lower-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media (max-width:700px) { .dashboard-page { padding:18px 14px 24px; }.dashboard-header { align-items:flex-start; flex-direction:column; margin-bottom:17px; }.header-actions { width:100%; }.date-pill { flex:1; }.metric-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }.metric-card { padding:13px; }.metric-card strong { font-size:20px; }.metric-card small { font-size:9px; }.main-grid,.lower-grid { grid-template-columns:1fr; }.sales-panel { grid-column:auto; }.panel { padding:15px; }.quick-stats { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }.quick-stat { padding:10px; }.chart-wrap { grid-template-rows:150px 20px; }.chart-wrap svg { height:150px; }.legend { gap:8px; }.chart-total { flex-wrap:wrap; }.chart-total .muted { width:100%; margin-left:0; } }
    @media (max-width:390px) { .metric-grid { grid-template-columns:1fr; }.quick-stats { grid-template-columns:1fr; }.header-actions { flex-wrap:wrap; }.date-pill { min-width:100%; } }
  `]
})
export class DashboardComponent implements OnInit {
  private reports = inject(ReportService);
  private expensesService = inject(ExpenseService);
  private productsService = inject(ProductService);
  private supplierService = inject(SupplierService);
  private customerService = inject(CustomerService);
  private stockService = inject(StockService);
  private saleService = inject(SaleService);
  private quickSaleService = inject(QuickSaleService);

  loading = true;
  todayDate = colomboDate();
  selectedDate = this.todayDate;
  daily: DailyReport | null = null;
  thisWeek: RangeReport | null = null;
  lastWeek: RangeReport | null = null;
  products: Product[] = [];
  suppliers: Supplier[] = [];
  customers: any[] = [];
  lowStock: any[] = [];
  credits: any[] = [];
  productStats: ProductStat[] = [];
  expenses: Record<string, number> = {};
  private salespersonSales: SalespersonBreakdown[] = [];
  private paymentAmounts = { cash: 0, credit: 0, other: 0 };
  salespersonTransactionCount = 0;

  ngOnInit() { this.loadDashboard(); }

  onDateChange(value: string) {
    if (!value || value > this.todayDate) return;
    this.selectedDate = value;
    this.loadDashboard();
  }

  get selectedDateLabel(): string {
    return new Intl.DateTimeFormat('en-LK', {
      timeZone: 'Asia/Colombo', year: 'numeric', month: 'short', day: 'numeric'
    }).format(new Date(`${this.selectedDate}T12:00:00Z`));
  }

  loadDashboard() {
    const selectedDate = this.selectedDate;
    this.loading = true;
    const weekStart = addDays(selectedDate, -6);
    const previousWeekStart = addDays(selectedDate, -13);
    const previousWeekEnd = addDays(selectedDate, -7);

    forkJoin({
      daily: this.reports.getDaily(selectedDate).pipe(catchError(() => of(null))),
      thisWeek: this.reports.getRange(weekStart, selectedDate).pipe(catchError(() => of(null))),
      lastWeek: this.reports.getRange(previousWeekStart, previousWeekEnd).pipe(catchError(() => of(null))),
      productStats: this.reports.getProducts(weekStart, selectedDate).pipe(catchError(() => of([] as ProductStat[]))),
      expenses: this.expensesService.getDailySummary(selectedDate).pipe(catchError(() => of({} as Record<string, number>))),
      products: this.productsService.getAll().pipe(catchError(() => of([] as Product[]))),
      suppliers: this.supplierService.getAll().pipe(catchError(() => of([] as Supplier[]))),
      customers: this.customerService.getAll().pipe(catchError(() => of([] as any[]))),
      lowStock: this.stockService.getLowStock().pipe(catchError(() => of([] as any[]))),
      credits: this.saleService.getCredits().pipe(catchError(() => of([] as any[]))),
      dailySales: this.saleService.getByDate(selectedDate).pipe(catchError(() => of([] as any[]))),
      dailyQuickSales: this.quickSaleService.getByDate(selectedDate).pipe(catchError(() => of([] as any[])))
    }).subscribe(data => {
      if (selectedDate !== this.selectedDate) return;
      this.daily = data.daily;
      this.thisWeek = data.thisWeek;
      this.lastWeek = data.lastWeek;
      this.productStats = data.productStats;
      this.expenses = data.expenses;
      this.products = data.products;
      this.suppliers = data.suppliers;
      this.customers = data.customers;
      this.lowStock = data.lowStock;
      this.credits = data.credits;
      this.salespersonTransactionCount = [...data.dailySales, ...data.dailyQuickSales]
        .filter(sale => String(sale?.status || '').toUpperCase() !== 'CANCELLED').length;
      this.salespersonSales = this.buildSalespersonBreakdown(data.dailySales, data.dailyQuickSales);
      if (!this.salespersonSales.length) {
        this.salespersonSales = [...(data.daily?.salespersonBreakdown || [])];
      }
      this.paymentAmounts = this.buildPaymentBreakdown(data.dailySales, data.dailyQuickSales, data.daily);
      this.loading = false;
    });
  }

  get todaySales(): number { return Number(this.daily?.totalAmount || 0) + Number(this.daily?.quickSaleTotal || 0); }
  get customerDue(): number { return this.credits.reduce((total, sale) => total + Number(sale.total || 0), 0); }
  get supplierDue(): number { return this.suppliers.reduce((total, supplier) => total + Number(supplier.balance || 0), 0); }
  get paymentTotal(): number {
    return this.paymentAmounts.cash + this.paymentAmounts.credit + this.paymentAmounts.other;
  }
  get cashPayments(): number { return this.paymentAmounts.cash; }
  get creditPayments(): number { return this.paymentAmounts.credit; }
  get otherPayments(): number {
    return this.paymentAmounts.other;
  }
  get paymentGradient(): string {
    const total = this.paymentTotal;
    if (!total) return 'conic-gradient(#e8edf0 0% 100%)';
    const cashEnd = Math.min(100, this.cashPayments / total * 100);
    const creditEnd = Math.min(100, cashEnd + this.creditPayments / total * 100);
    return `conic-gradient(#168454 0% ${cashEnd}%, #d69239 ${cashEnd}% ${creditEnd}%, #398bb2 ${creditEnd}% 100%)`;
  }

  private buildPaymentBreakdown(sales: any[], quickSales: any[], daily: DailyReport | null): { cash: number; credit: number; other: number } {
    const amounts = { cash: 0, credit: 0, other: 0 };
    const records = [...sales, ...quickSales];
    for (const sale of records) {
      if (String(sale?.status || '').toUpperCase() === 'CANCELLED') continue;
      const method = String(sale?.paymentMethod || '').toUpperCase();
      const amount = Number(sale?.total || 0);
      if (method === 'CASH') amounts.cash += amount;
      else if (method === 'CREDIT') amounts.credit += amount;
      else amounts.other += amount;
    }
    // Keep the report summary as a fallback if the daily lists are unavailable.
    if (!records.length && daily?.paymentBreakdown) {
      amounts.cash = Number(daily.paymentBreakdown.cash || 0);
      amounts.credit = Number(daily.paymentBreakdown.credit || 0);
      amounts.other = Number(daily.paymentBreakdown.card || 0);
    }
    return amounts;
  }

  get chartDays(): ChartDay[] {
    const currentRows = new Map((this.thisWeek?.dailyBreakdown || []).map(row => [row.date, Number(row.revenue || 0)]));
    const previousRows = new Map((this.lastWeek?.dailyBreakdown || []).map(row => [row.date, Number(row.revenue || 0)]));
    return Array.from({ length: 7 }, (_, index) => {
      const currentDate = addDays(this.selectedDate, index - 6);
      const previousDate = addDays(this.selectedDate, index - 13);
      const date = new Date(`${currentDate}T12:00:00Z`);
      return {
        date: currentDate,
        label: new Intl.DateTimeFormat('en', { timeZone: 'Asia/Colombo', weekday: 'short' }).format(date),
        revenue: currentRows.get(currentDate) || 0,
        previousRevenue: previousRows.get(previousDate) || 0
      };
    });
  }

  get chartMax(): number { return Math.max(1, ...this.chartDays.map(day => Math.max(day.revenue, day.previousRevenue))) * 1.12; }
  get weekTotal(): number { return this.chartDays.reduce((sum, day) => sum + day.revenue, 0); }
  get previousWeekTotal(): number { return this.chartDays.reduce((sum, day) => sum + day.previousRevenue, 0); }
  get categories(): { name: string; revenue: number }[] {
    const totals = new Map<string, number>();
    for (const stat of this.productStats) {
      const category = stat.category || 'Uncategorized';
      totals.set(category, (totals.get(category) || 0) + Number(stat.revenue || 0));
    }
    return Array.from(totals, ([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  }
  get topCategories(): { name: string; revenue: number }[] { return this.categories.slice(0, 5); }
  get topCategoryTotal(): number { return this.topCategories.reduce((sum, category) => sum + category.revenue, 0); }
  get salespersonRows(): SalespersonBreakdown[] {
    return [...this.salespersonSales]
      .sort((a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0));
  }

  private buildSalespersonBreakdown(sales: any[], quickSales: any[]): SalespersonBreakdown[] {
    const totals = new Map<string, SalespersonBreakdown>();
    const addSale = (sale: any) => {
      const salesperson = sale?.salesperson;
      const name = (typeof salesperson === 'string' ? salesperson : salesperson?.name)
        || sale?.salespersonName || sale?.salesperson_name || sale?.worker?.name;
      if (!name || String(sale?.status || '').toUpperCase() === 'CANCELLED') return;
      const id = typeof salesperson === 'object' ? salesperson?.id : sale?.salespersonId;
      const key = id != null ? `id:${id}` : `name:${String(name).trim().toLowerCase()}`;
      let row = totals.get(key);
      if (!row) {
        row = {
          id: id ?? undefined,
          name: String(name),
          salesCount: 0,
          totalAmount: 0
        };
        totals.set(key, row);
      }
      row.salesCount += 1;
      row.totalAmount += Number(sale.total || 0);
    };
    sales.forEach(addSale);
    quickSales.forEach(addSale);
    return [...totals.values()];
  }
  salespersonBarWidth(amount: number): number {
    const max = Math.max(0, ...this.salespersonRows.map(row => Number(row.totalAmount || 0)));
    return max ? Math.max(3, Number(amount || 0) / max * 100) : 0;
  }
  get expenseRows(): { name: string; amount: number }[] {
    return Object.entries(this.expenses).map(([name, amount]) => ({ name, amount: Number(amount || 0) }))
      .sort((a, b) => b.amount - a.amount).slice(0, 5);
  }

  chartLine(key: 'revenue' | 'previousRevenue'): string {
    const days = this.chartDays;
    if (!days.length) return '';
    return days.map((day, index) => `${index * (700 / (days.length - 1))},${185 - (day[key] / this.chartMax) * 160}`).join(' ');
  }
  chartDots(key: 'revenue'): { x: number; y: number }[] {
    return this.chartDays.map((day, index) => ({ x: index * (700 / (this.chartDays.length - 1)), y: 185 - (day[key] / this.chartMax) * 160 }));
  }
  categoryWidth(revenue: number): number { return this.topCategories.length ? Math.max(3, revenue / Math.max(...this.topCategories.map(category => category.revenue)) * 100) : 0; }
  categoryShare(revenue: number): number { return this.topCategoryTotal ? Math.round(revenue / this.topCategoryTotal * 100) : 0; }
  money(value: number): string { return `Rs ${Number(value || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`; }
  moneyShort(value: number): string {
    const amount = Number(value || 0);
    return amount >= 1000 ? `Rs ${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k` : `Rs ${Math.round(amount)}`;
  }
  labelForExpense(value: string): string { return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()); }
}
