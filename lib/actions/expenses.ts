'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createExpense(data: {
  amount: number
  category: string
  description?: string
  receiptImage?: string
}) {
  try {
    // Get active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        status: 'active',
        userId: 1
      }
    })

    const expense = await prisma.expense.create({
      data: {
        userId: 1,
        shiftId: activeShift?.id,
        amount: data.amount,
        category: data.category,
        description: data.description,
        receiptImage: data.receiptImage,
        expenseDate: new Date()
      }
    })

    // Update daily summary
    await updateDailySummary(new Date())

    revalidatePath('/perbelanjaan')
    revalidatePath('/analytics')
    
    return { success: true, expense }
  } catch (error) {
    console.error('Error creating expense:', error)
    return { error: 'Gagal menyimpan perbelanjaan' }
  }
}

export async function getExpenses(limit = 50, offset = 0) {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: 1 },
      orderBy: { expenseDate: 'desc' },
      take: limit,
      skip: offset
    })

    return expenses
  } catch (error) {
    console.error('Error getting expenses:', error)
    return []
  }
}

export async function getExpensesByDateRange(startDate: Date, endDate: Date) {
  try {
    const expenses = await prisma.expense.findMany({
      where: {
        userId: 1,
        expenseDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { expenseDate: 'desc' }
    })

    return expenses
  } catch (error) {
    console.error('Error getting expenses by date range:', error)
    return []
  }
}

export async function deleteExpense(id: number) {
  try {
    await prisma.expense.delete({
      where: { id }
    })

    // Update daily summary
    await updateDailySummary(new Date())

    revalidatePath('/perbelanjaan')
    revalidatePath('/analytics')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting expense:', error)
    return { error: 'Gagal memadam perbelanjaan' }
  }
}

export async function updateExpense(
  id: number,
  data: {
    amount?: number
    category?: string
    description?: string
    receiptImage?: string
  }
) {
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data
    })

    // Update daily summary
    await updateDailySummary(new Date())

    revalidatePath('/perbelanjaan')
    revalidatePath('/analytics')
    
    return { success: true, expense }
  } catch (error) {
    console.error('Error updating expense:', error)
    return { error: 'Gagal mengemaskini perbelanjaan' }
  }
}

export async function getExpenseCategories() {
  try {
    const categories = [
      'Bahan Mentah',
      'Gaji',
      'Sewa',
      'Utiliti',
      'Pengangkutan',
      'Penyelenggaraan',
      'Pemasaran',
      'Lain-lain'
    ]

    return categories
  } catch (error) {
    console.error('Error getting expense categories:', error)
    return []
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
