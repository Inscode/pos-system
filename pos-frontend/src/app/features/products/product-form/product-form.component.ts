import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService, SupplierService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.product ? 'Edit Product' : 'Add Product' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="product-form">
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Name *</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
        </div>
        <div class="form-row two-col">
          <mat-form-field appearance="outline">
            <mat-label>Retail Price *</mat-label>
            <input matInput type="number" formControlName="retailPrice" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Wholesale Price *</mat-label>
            <input matInput type="number" formControlName="wholesalePrice" />
          </mat-form-field>
        </div>
        @if (auth.isOwner()) {
          <div class="form-row two-col">
            <mat-form-field appearance="outline">
              <mat-label>Cost Price</mat-label>
              <input matInput type="number" formControlName="costPrice" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Online Price</mat-label>
              <input matInput type="number" formControlName="onlinePrice" />
            </mat-form-field>
          </div>
        }
        <div class="form-row two-col">
          <mat-form-field appearance="outline">
            <mat-label>Barcode</mat-label>
            <input matInput formControlName="barcode" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Unit</mat-label>
            <input matInput formControlName="unit" />
          </mat-form-field>
        </div>
        <div class="form-row two-col">
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="categoryId">
              <mat-option [value]="null">None</mat-option>
              @for (c of data.categories; track c.id) {
                <mat-option [value]="c.id">{{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Supplier</mat-label>
            <mat-select formControlName="supplierId">
              <mat-option [value]="null">None</mat-option>
              @for (s of suppliers; track s.id) {
                <mat-option [value]="s.id">{{ s.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <div class="form-row two-col">
          <mat-form-field appearance="outline">
            <mat-label>Product Source</mat-label>
            <mat-select formControlName="productSource">
              <mat-option value="SHOP_DIRECT">Shop Direct</mat-option>
              <mat-option value="STORE_PRODUCT">Store Product</mat-option>
              <mat-option value="BOTH">Both</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Min Stock Alert</mat-label>
            <input matInput type="number" formControlName="minStockAlert" />
          </mat-form-field>
        </div>
        @if (!data.product) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Initial Stock</mat-label>
            <input matInput type="number" formControlName="initialStock" />
          </mat-form-field>
        }
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Image URL</mat-label>
          <input matInput formControlName="imageUrl" />
        </mat-form-field>
        <div class="checkboxes">
          <mat-checkbox formControlName="showInPos">Show in POS</mat-checkbox>
          <mat-checkbox formControlName="showOnline">Show Online</mat-checkbox>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">CANCEL</button>
      <button mat-flat-button class="save-btn" (click)="save()" [disabled]="loading || form.invalid">
        @if (loading) { <mat-spinner diameter="18" /> } @else { SAVE }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { padding: 16px 24px 0; }
    mat-dialog-content { padding: 8px 24px; max-height: 70vh; }
    .product-form { display: flex; flex-direction: column; gap: 0; }
    .form-row { margin-bottom: 4px; }
    .two-col { display: flex; gap: 12px; }
    .two-col mat-form-field { flex: 1; }
    .full-width { width: 100%; }
    .checkboxes { display: flex; gap: 24px; margin: 8px 0; }
    .save-btn { background: #1a2332 !important; color: #fff !important; }
  `]
})
export class ProductFormComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ProductFormComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private supplierService = inject(SupplierService);
  private snack = inject(MatSnackBar);

  auth = inject(AuthService);
  suppliers: any[] = [];
  loading = false;
  p = this.data.product;

  form = this.fb.group({
    name: [this.p?.name || '', Validators.required],
    retailPrice: [this.p?.retailPrice || '', Validators.required],
    wholesalePrice: [this.p?.wholesalePrice || '', Validators.required],
    costPrice: [this.p?.costPrice || ''],
    onlinePrice: [this.p?.onlinePrice || ''],
    barcode: [this.p?.barcode || ''],
    unit: [this.p?.unit || 'piece'],
    categoryId: [this.p?.categoryId || null],
    supplierId: [this.p?.supplierId || null],
    productSource: [this.p?.productSource || 'SHOP_DIRECT'],
    fulfillmentSource: ['SHOP'],
    minStockAlert: [this.p?.minStockAlert || 0],
    minWholesaleQty: [this.p?.minWholesaleQty || 1],
    showInPos: [this.p?.showInPos ?? true],
    showOnline: [this.p?.showOnline ?? true],
    imageUrl: [this.p?.imageUrl || ''],
    initialStock: [0]
  });

  ngOnInit() {
    this.supplierService.getAll().subscribe(s => this.suppliers = s);
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    const val = this.form.value;
    const obs = this.p
      ? this.productService.update(this.p.id, val as any)
      : this.productService.create(val as any);

    obs.subscribe({
      next: () => { this.snack.open('Saved!', '', { duration: 1500 }); this.dialogRef.close(true); },
      error: err => { this.loading = false; this.snack.open(err.error?.message || 'Error', 'OK', { duration: 3000 }); }
    });
  }
}
