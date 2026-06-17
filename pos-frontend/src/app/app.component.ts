import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PrintService } from './core/services/print.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet />
    @if (showOfflineBanner) {
      <div class="printer-banner">
        <span>⚠ QZ Tray not detected — printing unavailable.</span>
        <button class="retry-link" (click)="retryConnect()">Retry</button>
        <button class="dismiss-link" (click)="showOfflineBanner = false">✕</button>
      </div>
    }
  `,
  styles: [`
    .printer-banner {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
      background: #c62828; color: #fff;
      display: flex; align-items: center; gap: 12px;
      padding: 10px 20px; font-size: 13px; font-weight: 500;
    }
    .retry-link, .dismiss-link {
      background: rgba(255,255,255,0.2); border: none; color: #fff;
      padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
    }
    .retry-link:hover, .dismiss-link:hover { background: rgba(255,255,255,0.35); }
    .dismiss-link { margin-left: auto; }
  `]
})
export class AppComponent implements OnInit {
  private printService = inject(PrintService);
  showOfflineBanner = false;

  ngOnInit() {
    this.printService.connect().catch(() => {
      this.showOfflineBanner = true;
    });
  }

  async retryConnect() {
    this.showOfflineBanner = false;
    try {
      await this.printService.connect();
    } catch {
      this.showOfflineBanner = true;
    }
  }
}
