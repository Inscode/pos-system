import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ProductService, CategoryService } from '../../../core/services/product.service';
import { Product, Category } from '../../../core/models/product.model';
import { ProductFormComponent } from '../product-form/product-form.component';
import { StockAdjustComponent } from '../stock-adjust/stock-adjust.component';
import { LabelPrintDialogComponent } from '../../pos/components/label-print-dialog/label-print-dialog.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, MatChipsModule,
    LabelPrintDialogComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="page-sub">Manage shop inventory</p>
        </div>
        <button mat-flat-button class="primary-btn" (click)="openForm()">
          <mat-icon>add</mat-icon> Add Product
        </button>
      </div>

      <mat-card class="filter-card">
        <div class="filter-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="search" (ngModelChange)="loadProducts()" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="categoryFilter" (ngModelChange)="loadProducts()">
              <mat-option [value]="null">All</mat-option>
              @for (c of categories; track c.id) {
                <mat-option [value]="c.id">{{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <mat-card>
        <table mat-table [dataSource]="products" class="product-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Product</th>
            <td mat-cell *matCellDef="let p">
              <div class="product-cell">
                @if (p.imageUrl) {
                  <img [src]="p.imageUrl" class="thumb" [alt]="p.name" />
                } @else {
                  <div class="thumb-placeholder"><mat-icon>inventory_2</mat-icon></div>
                }
                <div>
                  <div class="p-name">{{ p.name }}</div>
                  <div class="p-barcode">{{ p.barcode || '—' }}</div>
                </div>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let p">{{ p.categoryName || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="retail">
            <th mat-header-cell *matHeaderCellDef>Retail</th>
            <td mat-cell *matCellDef="let p">LKR {{ p.retailPrice | number:'1.2-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="wholesale">
            <th mat-header-cell *matHeaderCellDef>Wholesale</th>
            <td mat-cell *matCellDef="let p">LKR {{ p.wholesalePrice | number:'1.2-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="stock">
            <th mat-header-cell *matHeaderCellDef>SHOP Stock</th>
            <td mat-cell *matCellDef="let p">
              <span [class.low]="p.stockQuantity <= p.minStockAlert">
                {{ p.stockQuantity }} {{ p.unit }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let p">
              <span class="status-chip" [class.active]="p.active" [class.inactive]="!p.active">
                {{ p.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button (click)="openForm(p)" matTooltip="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button (click)="openStockAdjust(p)" matTooltip="Adjust Stock">
                <mat-icon>tune</mat-icon>
              </button>
              <button mat-icon-button (click)="printLabel(p)" matTooltip="Print Label" [disabled]="!p.barcode">
                <mat-icon>label</mat-icon>
              </button>
              <button mat-icon-button (click)="deactivate(p)" matTooltip="Deactivate" *ngIf="p.active">
                <mat-icon>block</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
        @if (products.length === 0) {
          <div class="empty-state">No products found</div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1a2332; }
    .page-sub { color: #6b7280; font-size: 13px; }
    .primary-btn { background: #1a2332 !important; color: #fff !important; }
    .filter-card { margin-bottom: 16px; padding: 16px !important; }
    .filter-row { display: flex; gap: 16px; }
    .search-field { flex: 1; }
    .product-table { width: 100%; }
    .product-cell { display: flex; align-items: center; gap: 12px; }
    .thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
    .thumb-placeholder {
      width: 40px; height: 40px; border-radius: 6px; background: #f4f6f9;
      display: flex; align-items: center; justify-content: center; color: #d1d5db;
    }
    .p-name { font-weight: 600; font-size: 14px; color: #1a2332; }
    .p-barcode { font-size: 11px; color: #6b7280; }
    .low { color: #c62828; font-weight: 600; }
    .status-chip {
      padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
    }
    .active { background: #e8f5e9; color: #2e7d32; }
    .inactive { background: #fdecea; color: #c62828; }
    .empty-state { padding: 40px; text-align: center; color: #6b7280; }
  `]
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  products: Product[] = [];
  categories: Category[] = [];
  search = '';
  categoryFilter: number | null = null;
  cols = ['name', 'category', 'retail', 'wholesale', 'stock', 'status', 'actions'];

  ngOnInit() {
    this.loadProducts();
    this.categoryService.getAll().subscribe(c => this.categories = c);
  }

  loadProducts() {
    this.productService.getAll(this.search || undefined, this.categoryFilter || undefined)
      .subscribe(p => this.products = p);
  }

  openForm(product?: Product) {
    const ref = this.dialog.open(ProductFormComponent, {
      width: '560px',
      data: { product, categories: this.categories }
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.loadProducts(); });
  }

  openStockAdjust(product: Product) {
    const ref = this.dialog.open(StockAdjustComponent, {
      width: '400px',
      data: { product }
    });
    ref.afterClosed().subscribe(done => { if (done) this.loadProducts(); });
  }

  printLabel(product: Product) {
    this.dialog.open(LabelPrintDialogComponent, {
      width: '380px',
      data: {
        productName: product.name,
        barcode: product.barcode,
        retailPrice: product.retailPrice
      }
    });
  }

  deactivate(product: Product) {
    if (!confirm(`Deactivate "${product.name}"?`)) return;
    this.productService.delete(product.id).subscribe(() => {
      this.snack.open('Product deactivated', 'OK', { duration: 2000 });
      this.loadProducts();
    });
  }
}
