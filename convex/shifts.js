import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Helper function to get today's date string
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper for empty payment breakdown
function getEmptyPaymentBreakdown() {
  return {
    cash: { count: 0, total: 0 },
    debit: { count: 0, total: 0 },
    credit: { count: 0, total: 0 },
    qr: { count: 0, total: 0 },
    ewallet: { count: 0, total: 0 },
  };
}

// Open new shift
export const openShift = mutation({
  args: {
    openingCash: v.number(),
    openedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if there's already an open shift
    const existingOpenShift = await ctx.db
      .query("shifts")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .first();
    
    if (existingOpenShift) {
      throw new Error("Sudah ada shift yang dibuka. Sila tutup shift dahulu.");
    }
    
    const today = getTodayDate();
    
    // Get shift number for today
    const todayShifts = await ctx.db
      .query("shifts")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    
    const shiftNumber = todayShifts.length + 1;
    
    // Create new shift
    const shiftId = await ctx.db.insert("shifts", {
      date: today,
      shiftNumber,
      openedAt: Date.now(),
      openingCash: args.openingCash,
      status: "open",
      openedBy: args.openedBy,
    });
    
    return { shiftId, shiftNumber, date: today };
  },
});

// Close current shift and update daily summary
export const closeShift = mutation({
  args: {
    closingCash: v.number(),
    closedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find open shift
    const openShift = await ctx.db
      .query("shifts")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .first();
    
    if (!openShift) {
      throw new Error("Tiada shift dibuka.");
    }
    
    // Get transactions for this shift
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_shift", (q) => q.eq("shiftId", openShift._id))
      .collect();
    
    // Calculate shift totals
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const transactionCount = transactions.length;
    
    // Calculate payment method breakdown
    const byPaymentMethod = getEmptyPaymentBreakdown();
    
    transactions.forEach(t => {
      const method = t.paymentMethod;
      if (byPaymentMethod[method]) {
        byPaymentMethod[method].count++;
        byPaymentMethod[method].total += t.total;
      }
    });
    
    // Calculate cash difference (only cash payments affect physical cash)
    const cashPayments = byPaymentMethod.cash.total;
    const expectedCash = openShift.openingCash + cashPayments;
    const cashDifference = args.closingCash - expectedCash;
    
    const closedAt = Date.now();
    
    // Update shift
    await ctx.db.patch(openShift._id, {
      closedAt,
      closingCash: args.closingCash,
      totalSales,
      transactionCount,
      status: "closed",
      closedBy: args.closedBy,
      notes: args.notes,
      byPaymentMethod,
    });
    
    // Update daily summary
    await ctx.runMutation(api.dailySummaries.calculateAndStore, {
      date: openShift.date
    });
    
    return {
      shiftId: openShift._id,
      shiftNumber: openShift.shiftNumber,
      date: openShift.date,
      openedAt: openShift.openedAt,
      closedAt,
      openingCash: openShift.openingCash,
      closingCash: args.closingCash,
      totalSales,
      transactionCount,
      expectedCash,
      cashDifference,
      byPaymentMethod,
    };
  },
});

// Get current open shift
export const getCurrentShift = query({
  handler: async (ctx) => {
    const shift = await ctx.db
      .query("shifts")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .first();
    
    if (!shift) return null;
    
    // Calculate current stats for this shift
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_shift", (q) => q.eq("shiftId", shift._id))
      .collect();
    
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const transactionCount = transactions.length;
    
    // Calculate payment method breakdown
    const byPaymentMethod = getEmptyPaymentBreakdown();
    transactions.forEach(t => {
      const method = t.paymentMethod;
      if (byPaymentMethod[method]) {
        byPaymentMethod[method].count++;
        byPaymentMethod[method].total += t.total;
      }
    });
    
    return {
      ...shift,
      currentSales: totalSales,
      currentTransactionCount: transactionCount,
      currentByPaymentMethod: byPaymentMethod,
      expectedCash: shift.openingCash + byPaymentMethod.cash.total,
    };
  },
});

// Get shift stats (real-time for current open shift)
export const getShiftStats = query({
  handler: async (ctx) => {
    const shift = await ctx.db
      .query("shifts")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .first();
    
    if (!shift) return null;
    
    // Get all transactions for this shift
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_shift", (q) => q.eq("shiftId", shift._id))
      .collect();
    
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const transactionCount = transactions.length;
    const average = transactionCount > 0 ? totalSales / transactionCount : 0;
    
    // Calculate by payment method
    const byPaymentMethod = getEmptyPaymentBreakdown();
    transactions.forEach(t => {
      const method = t.paymentMethod;
      if (byPaymentMethod[method]) {
        byPaymentMethod[method].count++;
        byPaymentMethod[method].total += t.total;
      }
    });
    
    // Format opened time
    const formattedOpenedAt = new Date(shift.openedAt).toLocaleString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return {
      shiftId: shift._id,
      shiftNumber: shift.shiftNumber,
      date: shift.date,
      openedAt: shift.openedAt,
      formattedOpenedAt,
      openingCash: shift.openingCash,
      totalSales,
      transactionCount,
      average,
      byPaymentMethod,
      expectedCash: shift.openingCash + byPaymentMethod.cash.total,
    };
  },
});

// Get today's shifts (all)
export const getTodayShifts = query({
  handler: async (ctx) => {
    const today = getTodayDate();
    
    const shifts = await ctx.db
      .query("shifts")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    
    // Sort by shift number
    return shifts.sort((a, b) => a.shiftNumber - b.shiftNumber);
  },
});

// Get shifts by date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const shifts = await ctx.db
      .query("shifts")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    
    return shifts.sort((a, b) => a.shiftNumber - b.shiftNumber);
  },
});

// Get shift history
export const getHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;
    
    const shifts = await ctx.db
      .query("shifts")
      .filter((q) => q.eq(q.field("status"), "closed"))
      .order("desc")
      .take(limit);
    
    return shifts;
  },
});


