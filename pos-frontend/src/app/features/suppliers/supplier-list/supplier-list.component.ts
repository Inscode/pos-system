import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupplierService } from '../../../core/services/product.service';
import { Supplier } from '../../../core/models/product.model';
import { SupplierFormComponent } from '../supplier-form/supplier-form.component';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Suppliers</h1>
          <p class="page-sub">Manage supplier contacts</p>
        </div>
        <button mat-flat-button class="primary-btn" (click)="openForm()">
          <mat-icon>add</mat-icon> Add Supplier
        </button>
      </div>
      <mat-card>
        <table mat-table [dataSource]="suppliers">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let s"><strong>{{ s.name }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Phone</th>
            <td mat-cell *matCellDef="let s">{{ s.phone || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="address">
            <th mat-header-cell *matHeaderCellDef>Address</th>
            <td mat-cell *matCellDef="let s">{{ s.address || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let s">
              <button mat-icon-button (click)="openForm(s)"><mat-icon>edit</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1a2332; }
    .page-sub { color: #888; font-size: 13px; }
    .primary-btn { background: #1a2332 !important; color: #fff !important; }
  `]
})
export class SupplierListComponent implements OnInit {
  private supplierService = inject(SupplierService);
  private dialog = inject(MatDialog);
  suppliers: Supplier[] = [];
  cols = ['name', 'phone', 'address', 'actions'];

  ngOnInit() { this.load(); }
  load() { this.supplierService.getAll().subscribe(s => this.suppliers = s); }
  openForm(supplier?: Supplier) {
    this.dialog.open(SupplierFormComponent, { width: '400px', data: { supplier } })
      .afterClosed().subscribe(saved => { if (saved) this.load(); });
  }
}
