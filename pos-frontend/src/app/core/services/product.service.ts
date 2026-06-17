import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, Product, Salesperson, Supplier } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(search?: string, categoryId?: number): Observable<Product[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http.get<any>(this.base, { params }).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Product> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  getByBarcode(barcode: string): Observable<Product> {
    return this.http.get<any>(`${this.base}/barcode/${barcode}`).pipe(map(r => r.data));
  }

  create(product: any): Observable<Product> {
    return this.http.post<any>(this.base, product).pipe(map(r => r.data));
  }

  update(id: number, product: any): Observable<Product> {
    return this.http.put<any>(`${this.base}/${id}`, product).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Category[]> {
    return this.http.get<any>(`${environment.apiUrl}/categories`).pipe(map(r => r.data));
  }

  create(name: string): Observable<Category> {
    return this.http.post<any>(`${environment.apiUrl}/categories`, { name }).pipe(map(r => r.data));
  }
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Supplier[]> {
    return this.http.get<any>(`${environment.apiUrl}/suppliers`).pipe(map(r => r.data));
  }

  create(supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<any>(`${environment.apiUrl}/suppliers`, supplier).pipe(map(r => r.data));
  }

  update(id: number, supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<any>(`${environment.apiUrl}/suppliers/${id}`, supplier).pipe(map(r => r.data));
  }
}

@Injectable({ providedIn: 'root' })
export class SalespersonService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Salesperson[]> {
    return this.http.get<any>(`${environment.apiUrl}/salespersons`).pipe(map(r => r.data));
  }

  create(name: string): Observable<Salesperson> {
    return this.http.post<any>(`${environment.apiUrl}/salespersons`, { name }).pipe(map(r => r.data));
  }

  update(id: number, name: string, active: boolean): Observable<Salesperson> {
    return this.http.put<any>(`${environment.apiUrl}/salespersons/${id}`, { name, active }).pipe(map(r => r.data));
  }
}
