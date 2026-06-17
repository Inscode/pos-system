export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  totalPurchases?: number;
  totalSpent?: number;
  createdAt?: string;
}
