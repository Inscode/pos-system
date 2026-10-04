import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { DemandProductService } from '../../core/services/demand-product.service';
import { DemandProduct } from '../../core/models/demand-product.model';

@Component({
  selector: 'app-demand-products',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <h1>Demand Products</h1>
          <p>Record items customers ask for that are not in stock.</p>
        </div>
      </header>

      <section class="request-card">
        <div class="card-heading">
          <span class="heading-icon"><mat-icon>add_shopping_cart</mat-icon></span>
          <div>
            <h2>Add a customer request</h2>
            <p>Type a new product name, or search and choose an existing request.</p>
          </div>
        </div>
        <form class="request-form" (ngSubmit)="submit()">
          <label for="demand-product-name">Product name</label>
          <div class="input-row">
            <div class="request-input-wrap">
              <input id="demand-product-name" name="demandProductName" [(ngModel)]="productName"
                (focus)="showSuggestions = true" (blur)="showSuggestions = false" (ngModelChange)="showSuggestions = true"
                maxlength="255" placeholder="Search existing requests or enter a new product…" autocomplete="off" />
              @if (showSuggestions && productName.trim()) {
                <div class="suggestion-menu" role="listbox" aria-label="Existing demand products">
                  @if (filteredSuggestions.length > 0) {
                    <div class="suggestion-heading">Existing requests · choose to add a vote</div>
                    @for (name of filteredSuggestions; track name) {
                      <button type="button" class="suggestion-option" role="option"
                        (mousedown)="$event.preventDefault()" (click)="selectSuggestion(name)">
                        <mat-icon>search</mat-icon><span>{{ name }}</span><mat-icon class="choose-icon">north_west</mat-icon>
                      </button>
                    }
                  } @else if (suggestionsLoading) {
                    <div class="suggestion-empty">Loading saved requests…</div>
                  } @else {
                    <div class="suggestion-empty">{{ suggestionsLoadFailed ? 'Could not load saved requests.' : (productName.trim() ? 'No match. Submit to add this as a new request.' : 'No requests yet. Type a product name to add one.') }}</div>
                  }
                </div>
              }
            </div>
            <button type="submit" [disabled]="saving || !canSubmit">
              @if (saving) { <mat-spinner diameter="18" /> } @else { <mat-icon>how_to_vote</mat-icon> }
              {{ isExistingRequest ? 'Add vote' : 'Add request' }}
            </button>
          </div>
          <span class="form-hint">Choose a suggestion to add a vote to it, or submit a new name. Matching ignores capitalization and extra spaces.</span>
        </form>
      </section>

      @if (isOwner) {
        <section class="demand-section">
          <div class="section-heading">
            <div>
              <h2>Customer demand</h2>
              <p>Highest requested items appear first.</p>
            </div>
            @if (!loading && demands.length) {
              <span class="demand-count">{{ demands.length }} product{{ demands.length === 1 ? '' : 's' }}</span>
            }
          </div>

          <div class="date-filters">
            <label>From <input type="date" name="demandFrom" [(ngModel)]="fromDate" /></label>
            <label>To <input type="date" name="demandTo" [(ngModel)]="toDate" /></label>
            <button class="filter-btn" (click)="applyDateFilter()"><mat-icon>filter_list</mat-icon> Apply</button>
            @if (fromDate || toDate) { <button class="clear-filter-btn" (click)="clearDateFilter()">All time</button> }
            @if (!fromDate && !toDate) { <span class="filter-note">Leave both dates blank for all-time totals</span> }
          </div>
          @if (fromDate && toDate) {
            <div class="history-note">Date filters count individual requests recorded since vote history tracking was enabled. All-time totals include earlier votes.</div>
          }

          @if (loading) {
            <div class="loading"><mat-spinner diameter="32" /></div>
          } @else if (demands.length) {
            <div class="demand-list">
              <div class="list-header"><span>Product</span><span>Requests</span><span>Last requested</span><span></span></div>
              @for (demand of demands; track demand.id; let i = $index) {
                <div class="demand-row">
                  <span class="rank">{{ i + 1 }}</span>
                  <div class="product-name"><mat-icon>inventory_2</mat-icon><strong>{{ demand.name }}</strong></div>
                  <span class="votes"><mat-icon>thumb_up</mat-icon>{{ demand.voteCount }}</span>
                  <span class="last-requested">{{ demand.lastRequestedAt | date:'dd MMM yyyy, HH:mm':'+0530' }}</span>
                  <button class="restocked-btn" [disabled]="deletingId === demand.id" (click)="deleteRestocked(demand)" title="Remove after restocking">
                    <mat-icon>inventory</mat-icon><span>Restocked</span>
                  </button>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <mat-icon>checklist</mat-icon>
              <span>{{ fromDate && toDate ? 'No requests for the selected period.' : 'No customer demand recorded yet.' }}</span>
            </div>
          }
        </section>
      }
    </main>
  `,
  styles: [`
    .page { max-width: 1050px; padding: 26px; margin: 0 auto; color: #1b3050; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .page-header h1 { margin:0; font-size:24px; font-weight:750; }
    .page-header p, .card-heading p, .section-heading p { color:#7b8798; font-size:13px; margin:5px 0 0; }
    .request-card, .demand-section { background:#fff; border:1px solid #e8edf3; border-radius:14px; box-shadow:0 4px 18px rgba(27,48,80,.045); }
    .request-card { padding:22px 24px; }
    .card-heading { display:flex; align-items:center; gap:13px; }
    .heading-icon { display:grid; place-items:center; width:42px; height:42px; border-radius:12px; background:#eaf2ff; color:#2563a8; }
    .heading-icon mat-icon { font-size:22px; width:22px; height:22px; }
    .card-heading h2, .section-heading h2 { font-size:16px; margin:0; font-weight:700; }
    .request-form { margin-top:20px; }
    .request-form label { display:block; margin-bottom:7px; color:#46566d; font-size:12px; font-weight:700; }
    .input-row { display:flex; gap:10px; }
    .request-input-wrap { flex:1; position:relative; min-width:0; }
    .request-input-wrap input { width:100%; min-width:0; height:44px; box-sizing:border-box; border:1px solid #d8e0e9; border-radius:8px; padding:0 13px; color:#1b3050; background:#fff; font-family:inherit; font-size:14px; outline:none; }
    .request-input-wrap input:focus { border-color:#3976b8; box-shadow:0 0 0 3px rgba(57,118,184,.11); }
    .suggestion-menu { position:absolute; z-index:20; top:calc(100% + 5px); left:0; right:0; max-height:280px; overflow:auto; padding:5px; background:#fff; border:1px solid #dfe6ee; border-radius:9px; box-shadow:0 10px 24px rgba(24,45,72,.16); }
    .suggestion-heading { padding:7px 9px 8px; color:#8995a3; font-size:10px; font-weight:700; letter-spacing:.45px; text-transform:uppercase; }
    .suggestion-empty { padding:11px 10px; color:#7b8798; font-size:12px; }
    .suggestion-option { display:flex; align-items:center; gap:9px; width:100%; padding:9px 10px; border:0; border-radius:6px; background:transparent; color:#263d58; text-align:left; font:inherit; font-size:13px; cursor:pointer; }
    .suggestion-option:hover, .suggestion-option:focus-visible { outline:none; background:#f1f6fb; }
    .suggestion-option mat-icon { flex:none; width:17px; height:17px; font-size:17px; color:#8093a8; }
    .suggestion-option span { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .suggestion-option .choose-icon { width:15px; height:15px; font-size:15px; color:#aab5c1; }
    .input-row > button { display:flex; align-items:center; justify-content:center; gap:7px; min-width:128px; border:0; border-radius:8px; padding:0 16px; background:#1b4c7e; color:#fff; font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; }
    .input-row > button:hover:not(:disabled) { background:#153e69; }
    .input-row > button:disabled { opacity:.55; cursor:default; }
    .input-row > button mat-icon { font-size:18px; width:18px; height:18px; }
    .form-hint { display:block; color:#929eac; font-size:11px; margin-top:8px; }
    .demand-section { margin-top:22px; overflow:hidden; }
    .section-heading { display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid #edf0f4; }
    .date-filters { display:flex; align-items:flex-end; gap:10px; padding:14px 24px; border-bottom:1px solid #edf0f4; background:#fcfdff; }
    .date-filters label { display:flex; flex-direction:column; gap:5px; color:#7b8798; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; }
    .date-filters input { height:34px; box-sizing:border-box; border:1px solid #d8e0e9; border-radius:7px; padding:0 9px; color:#34445a; font-family:inherit; font-size:12px; }
    .filter-btn, .clear-filter-btn { height:34px; display:flex; align-items:center; justify-content:center; gap:5px; border:1px solid #d8e0e9; border-radius:7px; padding:0 11px; background:#fff; color:#385976; font-family:inherit; font-size:12px; font-weight:600; cursor:pointer; }
    .filter-btn { background:#1b4c7e; border-color:#1b4c7e; color:white; }
    .filter-btn mat-icon { font-size:16px; width:16px; height:16px; }
    .clear-filter-btn { color:#738093; }
    .filter-note { margin-left:auto; padding-bottom:9px; color:#98a3b1; font-size:11px; }
    .history-note { padding:9px 24px; border-bottom:1px solid #edf0f4; background:#fffdf5; color:#8b7847; font-size:11px; }
    .demand-count { border-radius:20px; background:#f0f4f8; color:#5a6a7c; padding:5px 10px; font-size:11px; font-weight:700; }
    .list-header { display:grid; grid-template-columns:minmax(0,1fr) 110px 190px 100px; padding:10px 24px 10px 62px; background:#f8fafc; color:#8995a3; font-size:10px; text-transform:uppercase; letter-spacing:.5px; font-weight:700; }
    .list-header span:nth-child(n+2) { text-align:right; }
    .demand-row { display:grid; grid-template-columns:28px minmax(0,1fr) 110px 190px 100px; gap:10px; align-items:center; min-height:58px; padding:8px 24px; border-bottom:1px solid #f0f2f5; }
    .demand-row:last-child { border-bottom:0; }
    .rank { color:#a2acb8; font-size:12px; font-weight:600; }
    .product-name { display:flex; align-items:center; gap:10px; min-width:0; }
    .product-name mat-icon { flex:none; color:#8b9aad; font-size:18px; width:18px; height:18px; }
    .product-name strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px; }
    .votes { display:flex; align-items:center; justify-content:flex-end; gap:6px; color:#1f5f98; font-size:13px; font-weight:750; }
    .votes mat-icon { font-size:16px; width:16px; height:16px; }
    .last-requested { text-align:right; color:#7b8798; font-size:12px; }
    .restocked-btn { display:flex; justify-content:center; align-items:center; gap:4px; border:1px solid #e4e9ef; border-radius:7px; background:#fff; color:#60758a; padding:6px 7px; font-family:inherit; font-size:10px; font-weight:650; cursor:pointer; white-space:nowrap; }
    .restocked-btn:hover:not(:disabled) { border-color:#b8d7c5; background:#f0f9f3; color:#247146; }
    .restocked-btn:disabled { opacity:.5; cursor:default; }
    .restocked-btn mat-icon { font-size:15px; width:15px; height:15px; }
    .loading, .empty-state { display:flex; align-items:center; justify-content:center; gap:10px; padding:38px 20px; color:#929eac; font-size:13px; }
    .empty-state mat-icon { color:#aab5c1; }
    @media (max-width:650px) {
      .page { padding:16px; }
      .request-card { padding:18px; }
      .input-row { flex-direction:column; }
      .date-filters { flex-wrap:wrap; padding:12px 16px; }
      .filter-note { width:100%; margin-left:0; padding-bottom:0; }
      .history-note { padding:9px 16px; line-height:1.45; }
      .input-row button { height:42px; }
      .list-header { display:none; }
      .demand-row { grid-template-columns:20px minmax(0,1fr) auto auto; grid-template-areas:"rank name votes action" ". date date date"; gap:8px; padding:12px 16px; }
      .rank { grid-area:rank; }
      .product-name { grid-area:name; }
      .votes { grid-area:votes; }
      .last-requested { grid-area:date; text-align:left; font-size:11px; }
      .restocked-btn { grid-area:action; }
      .restocked-btn span { display:none; }
      .section-heading { padding:18px; }
    }
  `]
})
export class DemandProductsComponent implements OnInit {
  private service = inject(DemandProductService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  productName = '';
  showSuggestions = false;
  suggestions: string[] = [];
  demands: DemandProduct[] = [];
  fromDate = '';
  toDate = '';
  loading = false;
  saving = false;
  suggestionsLoading = false;
  suggestionsLoadFailed = false;
  deletingId: number | null = null;

  get isOwner(): boolean { return this.auth.isOwner(); }
  get canSubmit(): boolean { return !!this.productName.trim(); }
  get filteredSuggestions(): string[] {
    const query = this.productName.trim().toLowerCase();
    return this.suggestions
      .filter(name => !query || name.toLowerCase().includes(query))
      .sort((a, b) => {
        if (!query) return a.localeCompare(b);
        return Number(b.toLowerCase().startsWith(query)) - Number(a.toLowerCase().startsWith(query)) || a.localeCompare(b);
      })
      .slice(0, 8);
  }
  get isExistingRequest(): boolean {
    const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
    const name = normalize(this.productName);
    return !!name && this.suggestions.some(existing => normalize(existing) === name);
  }

  ngOnInit() {
    this.loadSuggestions();
    if (this.isOwner) this.loadDemands();
  }

  submit() {
    const name = this.productName.trim().replace(/\s+/g, ' ');
    if (!name || this.saving) return;
    this.saving = true;
    this.service.addVote(name).subscribe({
      next: demand => {
        this.saving = false;
        this.productName = '';
        this.showSuggestions = false;
        this.snack.open(`Demand recorded for ${demand.name} · ${demand.voteCount} vote${demand.voteCount === 1 ? '' : 's'}`, '', { duration: 2500 });
        this.loadSuggestions();
        if (this.isOwner) this.loadDemands();
      },
      error: () => {
        this.saving = false;
        this.snack.open('Could not record this request. Please try again.', 'OK', { duration: 3000 });
      }
    });
  }

  selectSuggestion(name: string) {
    this.productName = name;
    this.showSuggestions = false;
  }

  private loadSuggestions() {
    this.suggestionsLoading = true;
    this.service.getSuggestions().subscribe({
      next: names => { this.suggestions = names; this.suggestionsLoading = false; this.suggestionsLoadFailed = false; },
      error: () => { this.suggestions = []; this.suggestionsLoading = false; this.suggestionsLoadFailed = true; }
    });
  }

  private loadDemands() {
    this.loading = true;
    this.service.getAll(this.fromDate || undefined, this.toDate || undefined).subscribe({
      next: demands => { this.demands = demands; this.loading = false; },
      error: () => { this.loading = false; this.snack.open('Could not load customer demand.', 'OK', { duration: 3000 }); }
    });
  }

  applyDateFilter() {
    if (!!this.fromDate !== !!this.toDate) {
      this.snack.open('Choose both a start and end date, or clear the filter.', 'OK', { duration: 3000 });
      return;
    }
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.snack.open('The start date must be on or before the end date.', 'OK', { duration: 3000 });
      return;
    }
    this.loadDemands();
  }

  clearDateFilter() {
    this.fromDate = '';
    this.toDate = '';
    this.loadDemands();
  }

  deleteRestocked(demand: DemandProduct) {
    if (!window.confirm(`Remove "${demand.name}" from customer demand because it has been restocked?`)) return;
    this.deletingId = demand.id;
    this.service.delete(demand.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.snack.open(`${demand.name} removed from demand list.`, '', { duration: 2500 });
        this.loadDemands();
        this.loadSuggestions();
      },
      error: () => {
        this.deletingId = null;
        this.snack.open('Could not remove the demand item.', 'OK', { duration: 3000 });
      }
    });
  }
}
