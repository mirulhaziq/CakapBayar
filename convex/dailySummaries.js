import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get today's date string in local timezone
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Default payment method breakdown
function getEmptyPaymentBreakdown() {
  return {
    cash: { count: 0, total: 0 },
    debit: { count: 0, total: 0 },
    credit: { count: 0, total: 0 },
    qr: { count: 0, total: 0 },
    ewallet: { count: 0, total: 0 },
  };
}

// Get today's summary
export const getToday = query({
  handler: async (ctx) => {
    const today = getTodayDate();
    
    const summary = await ctx.db
      .query("dailySummaries")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();
    
    // If no summary exists yet, return default
    if (!summary) {
      return {
        date: today,
        totalSales: 0,
        transactionCount: 0,
        shiftCount: 0,
        openingCash: 0,
        closingCash: 0,
        cashDifference: 0,
        byPaymentMethod: getEmptyPaymentBreakdown(),
        exists: false,
      };
    }
    
    return { ...summary, exists: true };
  },
});

// Get summary for specific date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const summary = await ctx.db
      .query("dailySummaries")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
    
    if (!summary) {
      return {
        date: args.date,
        totalSales: 0,
        transactionCount: 0,
        shiftCount: 0,
        openingCash: 0,
        closingCash: 0,
        cashDifference: 0,
        byPaymentMethod: getEmptyPaymentBreakdown(),
        exists: false,
      };
    }
    
    return { ...summary, exists: true };
  },
});

// Get recent daily summaries (last 30 days)
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;
    
    const summaries = await ctx.db
      .query("dailySummaries")
      .order("desc")
      .take(limit);
    
    return summaries;
  },
});

// Get date range summaries
export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const summaries = await ctx.db
      .query("dailySummaries")
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .order("desc")
      .collect();
    
    return summaries;
  },
});

// Calculate and store daily summary (called when shift closes)
export const calculateAndStore = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const { date } = args;
    
    // Get all shifts for this date
    const shifts = await ctx.db
      .query("shifts")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect();
    
    // Get all transactions for this date
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect();
    
    // Calculate totals
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const transactionCount = transactions.length;
    const shiftCount = shifts.length;
    
    // Get opening cash from first shift
    const sortedShifts = [...shifts].sort((a, b) => a.openedAt - b.openedAt);
    const openingCash = sortedShifts.length > 0 ? sortedShifts[0].openingCash : 0;
    
    // Get closing cash from last closed shift
    const closedShifts = sortedShifts.filter(s => s.status === "closed");
    const closingCash = closedShifts.length > 0 
      ? closedShifts[closedShifts.length - 1].closingCash || 0
      : 0;
    
    // Calculate expected cash and difference
    // Only count cash payments for cash reconciliation
    const cashPayments = transactions
      .filter(t => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.total, 0);
    const expectedCash = openingCash + cashPayments;
    const cashDifference = closingCash - expectedCash;
    
    // Calculate payment method breakdown
    const byPaymentMethod = getEmptyPaymentBreakdown();
    
    transactions.forEach(t => {
      const method = t.paymentMethod;
      if (byPaymentMethod[method]) {
        byPaymentMethod[method].count++;
        byPaymentMethod[method].total += t.total;
      }
    });
    
    // Check if summary already exists
    const existingSummary = await ctx.db
      .query("dailySummaries")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();
    
    const summaryData = {
      date,
      totalSales,
      transactionCount,
      shiftCount,
      openingCash,
      closingCash,
      cashDifference,
      byPaymentMethod,
      createdAt: Date.now(),
    };
    
    if (existingSummary) {
      // Update existing
      await ctx.db.patch(existingSummary._id, summaryData);
      return existingSummary._id;
    } else {
      // Create new
      return await ctx.db.insert("dailySummaries", summaryData);
    }
  },
});

// Get weekly stats
export const getWeeklyStats = query({
  handler: async (ctx) => {
    // Get last 7 days of summaries
    const summaries = await ctx.db
      .query("dailySummaries")
      .order("desc")
      .take(7);
    
    const totalSales = summaries.reduce((sum, s) => sum + s.totalSales, 0);
    const totalTransactions = summaries.reduce((sum, s) => sum + s.transactionCount, 0);
    const averageDaily = summaries.length > 0 ? totalSales / summaries.length : 0;
    
    return {
      totalSales,
      totalTransactions,
      averageDaily,
      daysRecorded: summaries.length,
      summaries,
    };
  },
});


