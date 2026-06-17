import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Customer } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private base = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Customer[]> {
    return this.http.get<any>(this.base).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Customer> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  create(customer: Partial<Customer>): Observable<Customer> {
    return this.http.post<any>(this.base, customer).pipe(map(r => r.data));
  }

  update(id: number, customer: Partial<Customer>): Observable<Customer> {
    return this.http.put<any>(`${this.base}/${id}`, customer).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${id}`).pipe(map(() => undefined));
  }
}
