import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DailyReport } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private base = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getDaily(date?: string): Observable<DailyReport> {
    const params: Record<string, string> = date ? { date } : {};
    return this.http.get<{ data: DailyReport }>(`${this.base}/daily`, { params }).pipe(map(r => r.data));
  }
}
