import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DemandProduct } from '../models/demand-product.model';

@Injectable({ providedIn: 'root' })
export class DemandProductService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/demand-products`;

  getAll(from?: string, to?: string): Observable<DemandProduct[]> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<any>(this.base, { params }).pipe(map(response => response.data));
  }

  getSuggestions(): Observable<string[]> {
    return this.http.get<any>(`${this.base}/suggestions`).pipe(map(response => response.data));
  }

  addVote(name: string): Observable<DemandProduct> {
    return this.http.post<any>(this.base, { name }).pipe(map(response => response.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
