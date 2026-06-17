import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  collapsed = signal(false);
  toggle() { this.collapsed.update(v => !v); }
}
