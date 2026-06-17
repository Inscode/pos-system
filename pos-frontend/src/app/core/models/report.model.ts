export interface DailyReport {
  date: string;
  totalSales: number;
  totalAmount: number;
  retailAmount: number;
  wholesaleAmount: number;
  totalProfit: number;
  margin: number;
  salespersonBreakdown: SalespersonBreakdown[];
  cashSummary: CashSummary;
  paymentBreakdown: PaymentBreakdown;
}

export interface SalespersonBreakdown {
  name: string;
  salesCount: number;
  totalAmount: number;
  profit: number;
}

export interface CashSummary {
  openingFloat: number;
  totalCashSales: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  cashOutByReason: Record<string, number>;
}

export interface PaymentBreakdown {
  cash: number;
  card: number;
  credit: number;
}
