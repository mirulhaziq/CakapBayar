export interface BalanceSheetData {
  period: {
    year: number
    month: number
    startDate: Date
    endDate: Date
  }
  assets: {
    current: {
      cash: number
      accountsReceivable: number
      total: number
    }
    total: number
  }
  liabilities: {
    current: {
      accountsPayable: number
      total: number
    }
    total: number
  }
  equity: {
    retainedEarnings: number
    total: number
  }
  revenue: {
    sales: {
      cash: number
      card: number
      ewallet: number
      qr: number
      total: number
    }
    total: number
  }
  expenses: {
    byCategory: Record<string, number>
    total: number
  }
  netIncome: number
  transactionCount: number
}

export interface MonthlyBalanceSheet {
  year: number
  month: number
  date: Date
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
}
