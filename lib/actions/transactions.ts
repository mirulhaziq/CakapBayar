'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createTransaction(data: {
  items: Array<{ item_id?: number; name: string; price: number; quantity: number }>
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  paymentReceived?: number
  changeGiven?: number
  notes?: string
}) {
  try {
    // Get active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        status: 'active',
        userId: 1
      }
    })

    const transaction = await prisma.transaction.create({
      data: {
        userId: 1,
        shiftId: activeShift?.id,
        items: data.items,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        paymentMethod: data.paymentMethod,
        paymentReceived: data.paymentReceived,
        changeGiven: data.changeGiven,
        notes: data.notes,
        transactionDate: new Date()
      }
    })

    // Update daily summary
    await updateDailySummary(new Date())

    revalidatePath('/pesanan')
    revalidatePath('/sejarah')
    revalidatePath('/analytics')
    
    return { success: true, transaction }
  } catch (error) {
    console.error('Error creating transaction:', error)
    return { error: 'Gagal menyimpan transaksi' }
  }
}

export async function getTransactions(limit = 50, offset = 0) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: 1 },
      orderBy: { transactionDate: 'desc' },
      take: limit,
      skip: offset
    })

    return transactions
  } catch (error) {
    console.error('Error getting transactions:', error)
    return []
  }
}

export async function getTransactionsByDateRange(startDate: Date, endDate: Date) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: 1,
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { transactionDate: 'desc' }
    })

    return transactions
  } catch (error) {
    console.error('Error getting transactions by date range:', error)
    return []
  }
}

export async function deleteTransaction(id: number) {
  try {
    await prisma.transaction.delete({
      where: { id }
    })

    // Update daily summary for the transaction date
    await updateDailySummary(new Date())

    revalidatePath('/sejarah')
    revalidatePath('/analytics')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return { error: 'Gagal memadam transaksi' }
  }
}

async function updateDailySummary(date: Date) {
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
    await prisma.dailySummary.upsert({
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
  } catch (error) {
    console.error('Error updating daily summary:', error)
  }
}
