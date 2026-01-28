'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function openShift(openingCash: number) {
  try {
    // Check if there's already an active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        status: 'active',
        userId: 1
      }
    })

    if (activeShift) {
      return { error: 'Ada shift yang masih aktif. Sila tutup shift tersebut dahulu.' }
    }

    const shift = await prisma.shift.create({
      data: {
        userId: 1,
        openedAt: new Date(),
        openingCash,
        status: 'active'
      }
    })

    revalidatePath('/shift')
    return { success: true, shift }
  } catch (error) {
    console.error('Error opening shift:', error)
    return { error: 'Gagal membuka shift' }
  }
}

export async function closeShift(shiftId: number, closingCash: number, notes?: string) {
  try {
    // Get shift with all transactions and expenses
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        transactions: true,
        expenses: true
      }
    })

    if (!shift) {
      return { error: 'Shift tidak dijumpai' }
    }

    // Calculate expected cash
    const cashSales = shift.transactions
      .filter(t => t.paymentMethod === 'Tunai')
      .reduce((sum, t) => sum + Number(t.total), 0)
    
    const cashExpenses = shift.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const expectedCash = Number(shift.openingCash) + cashSales - cashExpenses
    const cashDifference = closingCash - expectedCash

    // Close the shift
    const closedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        closedAt: new Date(),
        closingCash,
        expectedCash,
        cashDifference,
        status: 'closed',
        notes
      }
    })

    revalidatePath('/shift')
    return { success: true, shift: closedShift, expectedCash, cashDifference }
  } catch (error) {
    console.error('Error closing shift:', error)
    return { error: 'Gagal menutup shift' }
  }
}

export async function getActiveShift() {
  try {
    const shift = await prisma.shift.findFirst({
      where: {
        status: 'active',
        userId: 1
      },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' }
        },
        expenses: {
          orderBy: { expenseDate: 'desc' }
        }
      }
    })

    return shift
  } catch (error) {
    console.error('Error getting active shift:', error)
    return null
  }
}

export async function getShiftHistory(limit = 10) {
  try {
    const shifts = await prisma.shift.findMany({
      where: {
        userId: 1,
        status: 'closed'
      },
      include: {
        transactions: true,
        expenses: true
      },
      orderBy: {
        closedAt: 'desc'
      },
      take: limit
    })

    return shifts
  } catch (error) {
    console.error('Error getting shift history:', error)
    return []
  }
}

export async function getShiftById(shiftId: number) {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' }
        },
        expenses: {
          orderBy: { expenseDate: 'desc' }
        }
      }
    })

    return shift
  } catch (error) {
    console.error('Error getting shift:', error)
    return null
  }
}
