'use server'

import prisma from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import type { BalanceSheetData, MonthlyBalanceSheet } from '@/lib/types/balanceSheet'

export async function getBalanceSheet(year: number, month: number): Promise<BalanceSheetData | null> {
  try {
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))

    // Get transactions for the month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: 1,
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Get expenses for the month
    const expenses = await prisma.expense.findMany({
      where: {
        userId: 1,
        expenseDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate revenue
    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total), 0)
    const cashRevenue = transactions
      .filter(t => t.paymentMethod === 'Tunai')
      .reduce((sum, t) => sum + Number(t.total), 0)
    const cardRevenue = transactions
      .filter(t => t.paymentMethod === 'Kad')
      .reduce((sum, t) => sum + Number(t.total), 0)
    const ewalletRevenue = transactions
      .filter(t => t.paymentMethod === 'E-Wallet')
      .reduce((sum, t) => sum + Number(t.total), 0)
    const qrRevenue = transactions
      .filter(t => t.paymentMethod === 'QR Pay')
      .reduce((sum, t) => sum + Number(t.total), 0)

    // Calculate expenses by category
    const expensesByCategory: Record<string, number> = {}
    expenses.forEach(e => {
      if (!expensesByCategory[e.category]) {
        expensesByCategory[e.category] = 0
      }
      expensesByCategory[e.category] += Number(e.amount)
    })

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

    // Calculate assets (simplified - cash and receivables)
    const cashAssets = cashRevenue - (expensesByCategory['Tunai'] || 0)
    const receivables = 0 // Placeholder for future accounts receivable
    const currentAssets = cashAssets + receivables

    // Calculate liabilities (simplified - payables)
    const accountsPayable = 0 // Placeholder for future accounts payable
    const currentLiabilities = accountsPayable

    // Calculate equity
    const netIncome = totalRevenue - totalExpenses
    const retainedEarnings = netIncome
    const totalEquity = retainedEarnings

    return {
      period: {
        year,
        month,
        startDate,
        endDate
      },
      assets: {
        current: {
          cash: cashAssets,
          accountsReceivable: receivables,
          total: currentAssets
        },
        total: currentAssets
      },
      liabilities: {
        current: {
          accountsPayable,
          total: currentLiabilities
        },
        total: currentLiabilities
      },
      equity: {
        retainedEarnings,
        total: totalEquity
      },
      revenue: {
        sales: {
          cash: cashRevenue,
          card: cardRevenue,
          ewallet: ewalletRevenue,
          qr: qrRevenue,
          total: totalRevenue
        },
        total: totalRevenue
      },
      expenses: {
        byCategory: expensesByCategory,
        total: totalExpenses
      },
      netIncome,
      transactionCount: transactions.length
    }
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
          date: new Date(year, month - 1),
          totalRevenue: balanceSheet.revenue.total,
          totalExpenses: balanceSheet.expenses.total,
          netIncome: balanceSheet.netIncome,
          totalAssets: balanceSheet.assets.total,
          totalLiabilities: balanceSheet.liabilities.total,
          totalEquity: balanceSheet.equity.total
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
