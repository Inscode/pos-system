export interface Session {
  id: number;
  cashierName: string;
  openingFloat: number;
  closingCash?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
  openedAt: string;
  closedAt?: string;
}

export interface CashMovement {
  id: number;
  type: string;
  amount: number;
  reason?: string;
  createdAt: string;
}
