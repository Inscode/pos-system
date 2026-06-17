import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-return-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Returns</h1>
      <mat-card class="coming-soon">
        <mat-icon>assignment_return</mat-icon>
        <p>Returns processing is available via the POS screen checkout flow.</p>
        <p class="hint">Select a completed sale and process a return from there.</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1a2332; margin-bottom: 20px; }
    .coming-soon {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 60px; text-align: center; color: #888;
    }
    .coming-soon mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; color: #ccc; }
    .hint { font-size: 12px; color: #aaa; margin-top: 8px; }
  `]
})
export class ReturnListComponent {}
