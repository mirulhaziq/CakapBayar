'use server'

import prisma from '@/lib/prisma'
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns'

export async function getDailySummaries(days = 30) {
  try {
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    const summaries = await prisma.dailySummary.findMany({
      where: {
        userId: 1,
        summaryDate: {
          gte: startDateStr,
          lte: endDateStr
        }
      },
      orderBy: { summaryDate: 'asc' }
    })

    return summaries
  } catch (error) {
    console.error('Error getting daily summaries:', error)
    return []
  }
}

export async function getTodaySummary() {
  try {
    const today = new Date().toISOString().split('T')[0]

    let summary = await prisma.dailySummary.findUnique({
      where: { summaryDate: today }
    })

    // If no summary exists, create one
    if (!summary) {
      const startDate = startOfDay(new Date())
      const endDate = endOfDay(new Date())

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: 1,
          transactionDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      const expenses = await prisma.expense.findMany({
        where: {
          userId: 1,
          expenseDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      const totalSales = transactions.reduce((sum, t) => sum + Number(t.total), 0)
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

      summary = await prisma.dailySummary.create({
        data: {
          userId: 1,
          summaryDate: today,
          totalSales,
          totalExpenses,
          netProfit: totalSales - totalExpenses,
          transactionCount: transactions.length,
          cashPayments: transactions
            .filter(t => t.paymentMethod === 'Tunai')
            .reduce((sum, t) => sum + Number(t.total), 0),
          cardPayments: transactions
            .filter(t => t.paymentMethod === 'Kad')
            .reduce((sum, t) => sum + Number(t.total), 0),
          ewalletPayments: transactions
            .filter(t => t.paymentMethod === 'E-Wallet')
            .reduce((sum, t) => sum + Number(t.total), 0),
          qrPayments: transactions
            .filter(t => t.paymentMethod === 'QR Pay')
            .reduce((sum, t) => sum + Number(t.total), 0)
        }
      })
    }

    return summary
  } catch (error) {
    console.error('Error getting today summary:', error)
    return null
  }
}

export async function getMonthSummary(year: number, month: number) {
  try {
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    const summaries = await prisma.dailySummary.findMany({
      where: {
        userId: 1,
        summaryDate: {
          gte: startDateStr,
          lte: endDateStr
        }
      }
    })

    const totalSales = summaries.reduce((sum, s) => sum + Number(s.totalSales), 0)
    const totalExpenses = summaries.reduce((sum, s) => sum + Number(s.totalExpenses), 0)
    const netProfit = totalSales - totalExpenses
    const transactionCount = summaries.reduce((sum, s) => sum + s.transactionCount, 0)

    return {
      totalSales,
      totalExpenses,
      netProfit,
      transactionCount,
      days: summaries.length
    }
  } catch (error) {
    console.error('Error getting month summary:', error)
    return null
  }
}

export async function getTopSellingItems(days = 7) {
  try {
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: 1,
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const itemCounts: Record<string, { name: string; quantity: number; revenue: number }> = {}

    transactions.forEach(t => {
      const items = t.items as Array<{ name: string; price: number; quantity: number }>
      items.forEach(item => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { name: item.name, quantity: 0, revenue: 0 }
        }
        itemCounts[item.name].quantity += item.quantity
        itemCounts[item.name].revenue += item.price * item.quantity
      })
    })

    return Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  } catch (error) {
    console.error('Error getting top selling items:', error)
    return []
  }
}

export async function getPaymentMethodBreakdown(days = 7) {
  try {
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: 1,
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const breakdown = {
      Tunai: 0,
      Kad: 0,
      'E-Wallet': 0,
      'QR Pay': 0
    }

    transactions.forEach(t => {
      const method = t.paymentMethod as keyof typeof breakdown
      if (breakdown[method] !== undefined) {
        breakdown[method] += Number(t.total)
      }
    })

    return breakdown
  } catch (error) {
    console.error('Error getting payment method breakdown:', error)
    return { Tunai: 0, Kad: 0, 'E-Wallet': 0, 'QR Pay': 0 }
  }
}

export async function getExpenseBreakdown(days = 30) {
  try {
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    const expenses = await prisma.expense.findMany({
      where: {
        userId: 1,
        expenseDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const breakdown: Record<string, number> = {}

    expenses.forEach(e => {
      if (!breakdown[e.category]) {
        breakdown[e.category] = 0
      }
      breakdown[e.category] += Number(e.amount)
    })

    return breakdown
  } catch (error) {
    console.error('Error getting expense breakdown:', error)
    return {}
  }
}
