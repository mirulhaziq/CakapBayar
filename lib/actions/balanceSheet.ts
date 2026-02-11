'use server'

import prisma from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { getActiveShift } from './shifts'
import type { BalanceSheetData, MonthlyBalanceSheet, BalanceSheetPeriodSnapshot } from '@/lib/types/balanceSheet'

function toPeriodSnapshot(data: BalanceSheetData): BalanceSheetPeriodSnapshot {
  return {
    assets: { ...data.assets },
    liabilities: { ...data.liabilities },
    equity: { ...data.equity },
    incomeStatement: { ...data.incomeStatement }
  }
}

export async function getBalanceSheet(
  year: number,
  month: number,
  options?: { includePreviousPeriod?: boolean }
): Promise<BalanceSheetData | null> {
  const includePreviousPeriod = options?.includePreviousPeriod !== false
  try {
    const user = await prisma.user.findUnique({ where: { id: 1 } })
    const businessName = user?.businessName || 'CakapBayar'

    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))

    // 1. GET CASH (from shifts - actual cash balance)
    const latestClosedShift = await prisma.shift.findFirst({
      where: { 
        userId: 1, 
        status: 'closed' 
      },
      orderBy: { closedAt: 'desc' }
    })
    
    const activeShift = await getActiveShift()
    
    // Cash = latest closed shift's closingCash, OR active shift's expectedCash
    const cash = latestClosedShift?.closingCash 
      ? Number(latestClosedShift.closingCash)
      : activeShift?.expectedCash 
        ? Number(activeShift.expectedCash)
        : 0

    // 2. GET OPENING CAPITAL (first shift's openingCash)
    const firstShift = await prisma.shift.findFirst({
      where: { userId: 1 },
      orderBy: { openedAt: 'asc' }
    })
    const openingCapital = firstShift ? Number(firstShift.openingCash) : 0

    // 3. GET ALL-TIME SALES & EXPENSES (for cumulative retained earnings)
    const allTransactions = await prisma.transaction.findMany({
      where: { userId: 1 }
    })
    const allExpenses = await prisma.expense.findMany({
      where: { userId: 1 }
    })
    
    const allTimeSales = allTransactions.reduce((sum, t) => sum + Number(t.total), 0)
    const allTimeExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const retainedEarnings = allTimeSales - allTimeExpenses

    // 4. GET PERIOD-SPECIFIC DATA (for Income Statement)
    const periodTransactions = await prisma.transaction.findMany({
      where: {
        userId: 1,
        transactionDate: { gte: startDate, lte: endDate }
      }
    })
    const periodExpenses = await prisma.expense.findMany({
      where: {
        userId: 1,
        expenseDate: { gte: startDate, lte: endDate }
      }
    })

    // Calculate period revenue by payment method
    const revenueByMethod: Record<string, number> = { 
      'Tunai': 0, 
      'Kad': 0, 
      'E-Wallet': 0, 
      'QR Pay': 0 
    }
    periodTransactions.forEach(t => {
      const method = t.paymentMethod as keyof typeof revenueByMethod
      if (revenueByMethod[method] !== undefined) {
        revenueByMethod[method] += Number(t.total)
      }
    })

    const periodRevenue = periodTransactions.reduce((sum, t) => sum + Number(t.total), 0)
    const periodExpensesTotal = periodExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const periodNetIncome = periodRevenue - periodExpensesTotal

    // Expenses by category
    const expensesByCategory: Record<string, number> = {}
    periodExpenses.forEach(e => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount)
    })

    // 5. CALCULATE BALANCE SHEET
    const currentAssets = cash + 0 + 0  // cash + A/R + inventory
    const totalAssets = currentAssets

    const currentLiabilities = 0  // No payables/loans tracked
    const totalLiabilities = currentLiabilities

    const totalEquity = openingCapital + retainedEarnings

    // 6. VERIFY BALANCE
    const balances = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    const difference = totalAssets - (totalLiabilities + totalEquity)

    // Count shifts
    const shiftCount = await prisma.shift.count({
      where: { userId: 1 }
    })

    // Previous month for comparison (only when requested, to avoid recursion)
    let previousData: BalanceSheetData | null = null
    if (includePreviousPeriod) {
      const prevMonth = month === 1 ? 12 : month - 1
      const prevYear = month === 1 ? year - 1 : year
      previousData = await getBalanceSheet(prevYear, prevMonth, { includePreviousPeriod: false })
    }

    const result: BalanceSheetData = {
      businessName,
      period: {
        year,
        month,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        asOfDate: endDate.toISOString()
      },
      assets: {
        current: {
          cash,
          accountsReceivable: 0,
          inventory: 0,
          total: currentAssets
        },
        nonCurrent: {
          equipment: 0,
          property: 0,
          total: 0
        },
        total: totalAssets
      },
      liabilities: {
        current: {
          accountsPayable: 0,
          shortTermLoans: 0,
          total: currentLiabilities
        },
        nonCurrent: {
          longTermLoans: 0,
          total: 0
        },
        total: totalLiabilities
      },
      equity: {
        openingCapital,
        retainedEarnings,
        total: totalEquity
      },
      balances,
      difference,
      incomeStatement: {
        revenue: {
          total: periodRevenue,
          byPaymentMethod: revenueByMethod
        },
        expenses: {
          total: periodExpensesTotal,
          byCategory: expensesByCategory
        },
        netIncome: periodNetIncome
      },
      transactionCount: periodTransactions.length,
      shiftCount,
      ...(previousData ? { previousPeriod: toPeriodSnapshot(previousData) } : {})
    }
    return result
  } catch (error) {
    console.error('Error getting balance sheet:', error)
    return null
  }
}

export async function getBalanceSheetComparison(months = 6): Promise<MonthlyBalanceSheet[]> {
  try {
    const result: MonthlyBalanceSheet[] = []
    const today = new Date()

    for (let i = 0; i < months; i++) {
      const date = subMonths(today, i)
      const year = date.getFullYear()
      const month = date.getMonth() + 1

      const balanceSheet = await getBalanceSheet(year, month)
      if (balanceSheet) {
        result.push({
          year,
          month,
          date: new Date(year, month - 1).toISOString(),
          totalRevenue: balanceSheet.incomeStatement.revenue.total,
          totalExpenses: balanceSheet.incomeStatement.expenses.total,
          netIncome: balanceSheet.incomeStatement.netIncome,
          totalAssets: balanceSheet.assets.total,
          totalLiabilities: balanceSheet.liabilities.total,
          totalEquity: balanceSheet.equity.total,
          balances: balanceSheet.balances
        })
      }
    }

    return result.reverse()
  } catch (error) {
    console.error('Error getting balance sheet comparison:', error)
    return []
  }
}

export async function exportBalanceSheet(year: number, month: number) {
  try {
    const balanceSheet = await getBalanceSheet(year, month)
    if (!balanceSheet) {
      return { error: 'Lembaran imbangan tidak dijumpai' }
    }

    return { success: true, data: balanceSheet }
  } catch (error) {
    console.error('Error exporting balance sheet:', error)
    return { error: 'Gagal mengeksport lembaran imbangan' }
  }
}
