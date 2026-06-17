import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StockService {
  private base = `${environment.apiUrl}/stock`;

  constructor(private http: HttpClient) {}

  adjust(productId: number, newQuantity: number, reason: string, notes?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/adjust`, { productId, newQuantity, reason, notes }).pipe(map(r => r.data));
  }

  receive(productId: number, quantity: number, supplierId?: number, costPrice?: number, notes?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/receive`, { productId, quantity, supplierId, costPrice, notes }).pipe(map(r => r.data));
  }

  getLowStock(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/low`).pipe(map(r => r.data));
  }

  getAdjustments(productId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (productId) params = params.set('productId', productId);
    return this.http.get<any>(`${this.base}/adjustments`, { params }).pipe(map(r => r.data));
  }
}
