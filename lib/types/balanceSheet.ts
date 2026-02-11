/** Snapshot of balance sheet totals for comparison (e.g. previous month) */
export interface BalanceSheetPeriodSnapshot {
  assets: {
    current: { cash: number; accountsReceivable: number; inventory: number; total: number }
    nonCurrent: { equipment: number; property: number; total: number }
    total: number
  }
  liabilities: {
    current: { accountsPayable: number; shortTermLoans: number; total: number }
    nonCurrent: { longTermLoans: number; total: number }
    total: number
  }
  equity: { openingCapital: number; retainedEarnings: number; total: number }
  incomeStatement: {
    revenue: { total: number; byPaymentMethod: Record<string, number> }
    expenses: { total: number; byCategory: Record<string, number> }
    netIncome: number
  }
}

export interface BalanceSheetData {
  period: {
    year: number
    month: number
    startDate: string
    endDate: string
    asOfDate: string
  }
  businessName?: string
  assets: {
    current: {
      cash: number
      accountsReceivable: number
      inventory: number
      total: number
    }
    nonCurrent: {
      equipment: number
      property: number
      total: number
    }
    total: number
  }
  liabilities: {
    current: {
      accountsPayable: number
      shortTermLoans: number
      total: number
    }
    nonCurrent: {
      longTermLoans: number
      total: number
    }
    total: number
  }
  equity: {
    openingCapital: number
    retainedEarnings: number
    total: number
  }
  balances: boolean
  difference: number
  incomeStatement: {
    revenue: {
      total: number
      byPaymentMethod: Record<string, number>
    }
    expenses: {
      total: number
      byCategory: Record<string, number>
    }
    netIncome: number
  }
  transactionCount: number
  shiftCount: number
  /** Previous month data for comparison (current vs previous, change) */
  previousPeriod?: BalanceSheetPeriodSnapshot
}

export interface MonthlyBalanceSheet {
  year: number
  month: number
  date: string
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  balances: boolean
}
