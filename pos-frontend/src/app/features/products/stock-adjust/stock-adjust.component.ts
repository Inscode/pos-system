import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StockService } from '../../../core/services/stock.service';

@Component({
  selector: 'app-stock-adjust',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Adjust Stock — {{ data.product.name }}</h2>
    <mat-dialog-content>
      <p class="current">Current SHOP stock: <strong>{{ data.product.stockQuantity }} {{ data.product.unit }}</strong></p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>New Quantity</mat-label>
        <input matInput type="number" [(ngModel)]="newQty" min="0" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Reason</mat-label>
        <mat-select [(ngModel)]="reason">
          <mat-option value="INITIAL_ENTRY">Initial Entry</mat-option>
          <mat-option value="CORRECTION">Correction</mat-option>
          <mat-option value="DAMAGE">Damage</mat-option>
          <mat-option value="FOUND">Stock Found</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Notes</mat-label>
        <input matInput [(ngModel)]="notes" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">CANCEL</button>
      <button mat-flat-button class="save-btn" (click)="save()" [disabled]="loading">
        @if (loading) { <mat-spinner diameter="18" /> } @else { ADJUST }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { padding: 16px 24px 0; font-size: 16px; }
    mat-dialog-content { padding: 8px 24px; }
    .current { margin-bottom: 12px; color: #555; font-size: 14px; }
    .full-width { width: 100%; }
    .save-btn { background: #1a2332 !important; color: #fff !important; }
  `]
})
export class StockAdjustComponent {
  dialogRef = inject(MatDialogRef<StockAdjustComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private stockService = inject(StockService);

  newQty = this.data.product.stockQuantity;
  reason = 'CORRECTION';
  notes = '';
  loading = false;

  save() {
    this.loading = true;
    this.stockService.adjust(this.data.product.id, this.newQty, this.reason, this.notes).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.loading = false; }
    });
  }
}
