import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportService } from '../../../core/services/report.service';
import { DailyReport } from '../../../core/models/report.model';

@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatTableModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Daily Report</h1>
          <p class="page-sub">{{ selectedDate }}</p>
        </div>
        <div class="header-actions">
          <input type="date" [(ngModel)]="selectedDate" (change)="loadReport()" class="date-input" />
          <button mat-stroked-button (click)="window.print()">
            <mat-icon>print</mat-icon> Print
          </button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else if (report) {
        <!-- Summary Cards -->
        <div class="summary-cards">
          <mat-card class="stat-card">
            <div class="stat-label">Total Sales</div>
            <div class="stat-value">{{ report.totalSales }}</div>
          </mat-card>
          <mat-card class="stat-card navy">
            <div class="stat-label">Total Amount</div>
            <div class="stat-value">LKR {{ report.totalAmount | number:'1.0-0' }}</div>
          </mat-card>
          <mat-card class="stat-card green">
            <div class="stat-label">Profit</div>
            <div class="stat-value">LKR {{ report.totalProfit | number:'1.0-0' }}</div>
            <div class="stat-sub">Margin: {{ report.margin }}%</div>
          </mat-card>
          <mat-card class="stat-card gold">
            <div class="stat-label">Retail / Wholesale</div>
            <div class="stat-value small">LKR {{ report.retailAmount | number:'1.0-0' }}</div>
            <div class="stat-sub">Wholesale: LKR {{ report.wholesaleAmount | number:'1.0-0' }}</div>
          </mat-card>
        </div>

        <!-- Salesperson Breakdown -->
        <mat-card class="table-card">
          <h3 class="section-title">By Salesperson</h3>
          <table mat-table [dataSource]="report.salespersonBreakdown">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>
            <ng-container matColumnDef="salesCount">
              <th mat-header-cell *matHeaderCellDef>Sales</th>
              <td mat-cell *matCellDef="let row">{{ row.salesCount }}</td>
            </ng-container>
            <ng-container matColumnDef="totalAmount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let row">LKR {{ row.totalAmount | number:'1.0-0' }}</td>
            </ng-container>
            <ng-container matColumnDef="profit">
              <th mat-header-cell *matHeaderCellDef>Profit</th>
              <td mat-cell *matCellDef="let row">LKR {{ row.profit | number:'1.0-0' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="spCols"></tr>
            <tr mat-row *matRowDef="let row; columns: spCols;"></tr>
          </table>
        </mat-card>

        <!-- Cash Summary & Payment Breakdown -->
        <div class="bottom-cards">
          <mat-card class="info-card">
            <h3 class="section-title">Cash Summary</h3>
            <div class="info-row"><span>Opening Float</span><span>LKR {{ report.cashSummary.openingFloat | number:'1.0-0' }}</span></div>
            <div class="info-row"><span>Cash Sales</span><span>LKR {{ report.cashSummary.totalCashSales | number:'1.0-0' }}</span></div>
            <div class="info-row"><span>Cash In</span><span>LKR {{ report.cashSummary.cashIn | number:'1.0-0' }}</span></div>
            <div class="info-row"><span>Cash Out</span><span class="red">- LKR {{ report.cashSummary.cashOut | number:'1.0-0' }}</span></div>
            <div class="info-row total"><span>Expected in Drawer</span><span>LKR {{ report.cashSummary.expectedCash | number:'1.0-0' }}</span></div>
            @if (cashOutEntries(report).length > 0) {
              <div class="breakdown-header">Cash Out Breakdown</div>
              @for (entry of cashOutEntries(report); track entry[0]) {
                <div class="info-row sub"><span>{{ reasonLabel(entry[0]) }}</span><span class="red">- LKR {{ entry[1] | number:'1.0-0' }}</span></div>
              }
            }
          </mat-card>
          <mat-card class="info-card">
            <h3 class="section-title">Payment Methods</h3>
            <div class="info-row"><span>Cash</span><span>LKR {{ report.paymentBreakdown.cash | number:'1.0-0' }}</span></div>
            <div class="info-row"><span>Card</span><span>LKR {{ report.paymentBreakdown.card | number:'1.0-0' }}</span></div>
            <div class="info-row"><span>Credit</span><span>LKR {{ report.paymentBreakdown.credit | number:'1.0-0' }}</span></div>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1a2332; }
    .page-sub { color: #888; font-size: 13px; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .date-input {
      border: 1px solid #ddd; border-radius: 6px;
      padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 14px;
    }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .stat-card { padding: 20px !important; }
    .stat-card.navy { background: #1a2332 !important; color: #fff !important; }
    .stat-card.green { background: #e8f5e9 !important; }
    .stat-card.gold { background: #fff8e1 !important; }
    .stat-label { font-size: 12px; color: inherit; opacity: 0.7; margin-bottom: 6px; }
    .stat-value { font-size: 24px; font-weight: 700; }
    .stat-value.small { font-size: 18px; }
    .stat-sub { font-size: 12px; opacity: 0.7; margin-top: 4px; }
    .table-card { margin-bottom: 20px; }
    .section-title { font-size: 15px; font-weight: 700; color: #1a2332; padding: 16px 16px 8px; }
    .bottom-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-card { padding: 0 !important; }
    .info-row {
      display: flex; justify-content: space-between;
      padding: 10px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px;
    }
    .info-row.total { font-weight: 700; font-size: 15px; border-bottom: none; }
    .info-row.sub { padding: 6px 16px 6px 28px; font-size: 13px; color: #555; border-bottom: 1px solid #f5f5f5; }
    .breakdown-header { padding: 8px 16px 4px; font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px dashed #eee; margin-top: 4px; }
    .red { color: #f44336; }
  `]
})
export class DailyReportComponent implements OnInit {
  private reportService = inject(ReportService);
  report: DailyReport | null = null;
  loading = false;
  selectedDate = new Date().toISOString().split('T')[0];
  window = window;
  spCols = ['name', 'salesCount', 'totalAmount', 'profit'];

  private readonly reasonLabels: Record<string, string> = {
    CHARITY: 'Charity', SHOP_EXPENSE: 'Shop Expense', TRANSPORT: 'Transport',
    CLEANING: 'Cleaning', FOOD: 'Food', SUPPLIER: 'Supplier Payment', OTHER: 'Other'
  };

  reasonLabel(key: string): string {
    return this.reasonLabels[key] ?? key;
  }

  cashOutEntries(report: DailyReport): [string, number][] {
    const map = report.cashSummary?.cashOutByReason ?? {};
    return Object.entries(map).filter(([, v]) => v > 0);
  }

  ngOnInit() { this.loadReport(); }

  loadReport() {
    this.loading = true;
    this.reportService.getDaily(this.selectedDate).subscribe({
      next: r => { this.report = r; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
