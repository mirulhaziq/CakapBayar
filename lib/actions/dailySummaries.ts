'use server'

import prisma from '@/lib/prisma'

export async function getDailySummary(date: Date) {
  try {
    const dateStr = date.toISOString().split('T')[0]

    const summary = await prisma.dailySummary.findUnique({
      where: { summaryDate: dateStr }
    })

    return summary
  } catch (error) {
    console.error('Error getting daily summary:', error)
    return null
  }
}

export async function getDailySummaries(startDate: Date, endDate: Date) {
  try {
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

export async function regenerateDailySummary(date: Date) {
  try {
    const dateStr = date.toISOString().split('T')[0]
    
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Get all transactions for the day
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: 1,
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    // Get all expenses for the day
    const expenses = await prisma.expense.findMany({
      where: {
        userId: 1,
        expenseDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    // Calculate totals
    const totalSales = transactions.reduce((sum, t) => sum + Number(t.total), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const netProfit = totalSales - totalExpenses

    // Payment method breakdown
    const cashPayments = transactions
      .filter(t => t.paymentMethod === 'Tunai')
      .reduce((sum, t) => sum + Number(t.total), 0)
    
    const cardPayments = transactions
      .filter(t => t.paymentMethod === 'Kad')
      .reduce((sum, t) => sum + Number(t.total), 0)
    
    const ewalletPayments = transactions
      .filter(t => t.paymentMethod === 'E-Wallet')
      .reduce((sum, t) => sum + Number(t.total), 0)
    
    const qrPayments = transactions
      .filter(t => t.paymentMethod === 'QR Pay')
      .reduce((sum, t) => sum + Number(t.total), 0)

    // Calculate top selling items
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

    const topSellingItems = Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // Upsert daily summary
    const summary = await prisma.dailySummary.upsert({
      where: { summaryDate: dateStr },
      update: {
        totalSales,
        totalExpenses,
        netProfit,
        transactionCount: transactions.length,
        cashPayments,
        cardPayments,
        ewalletPayments,
        qrPayments,
        topSellingItems
      },
      create: {
        userId: 1,
        summaryDate: dateStr,
        totalSales,
        totalExpenses,
        netProfit,
        transactionCount: transactions.length,
        cashPayments,
        cardPayments,
        ewalletPayments,
        qrPayments,
        topSellingItems
      }
    })

    return { success: true, summary }
  } catch (error) {
    console.error('Error regenerating daily summary:', error)
    return { error: 'Gagal menjana semula ringkasan harian' }
  }
}
