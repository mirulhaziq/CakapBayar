import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

// Create new transaction
export const create = mutation({
  args: {
    items: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    total: v.number(),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const date = getTodayDate();
    
    // Get current open shift (if any)
    const currentShift = await ctx.db
      .query("shifts")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .first();
    
    // Create transaction
    const transactionId = await ctx.db.insert("transactions", {
      shiftId: currentShift?._id,
      date,
      items: args.items,
      total: args.total,
      paymentMethod: args.paymentMethod,
      completedAt: now,
    });
    
    return transactionId;
  },
});

// Get today's transactions
export const getToday = query({
  handler: async (ctx) => {
    const today = getTodayDate();
    
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date", (q) => q.eq("date", today))
      .order("desc")
      .collect();
    
    return transactions.map(t => ({
      ...t,
      formattedTime: new Date(t.completedAt).toLocaleTimeString('ms-MY', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  },
});

// Get today's stats (real-time)
export const getTodayStats = query({
  handler: async (ctx) => {
    const today = getTodayDate();
    
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    
    const total = transactions.reduce((sum, t) => sum + t.total, 0);
    const count = transactions.length;
    const average = count > 0 ? total / count : 0;
    
    // Payment method breakdown
    const byPaymentMethod = getEmptyPaymentBreakdown();
    
    transactions.forEach(t => {
      const method = t.paymentMethod.toLowerCase();
      if (byPaymentMethod[method]) {
        byPaymentMethod[method].count++;
        byPaymentMethod[method].total += t.total;
      }
    });
    
    return { total, count, average, byPaymentMethod, date: today };
  },
});

// Get transactions by date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .order("desc")
      .collect();
    
    return transactions.map(t => ({
      ...t,
      formattedTime: new Date(t.completedAt).toLocaleTimeString('ms-MY', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  },
});

// Get transactions by shift
export const getByShift = query({
  args: { shiftId: v.id("shifts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_shift", (q) => q.eq("shiftId", args.shiftId))
      .order("desc")
      .collect();
  },
});

// Get recent transactions (last 20)
export const getRecent = query({
  handler: async (ctx) => {
    const transactions = await ctx.db
      .query("transactions")
      .order("desc")
      .take(20);
    
    return transactions.map(t => ({
      ...t,
      formattedTime: new Date(t.completedAt).toLocaleTimeString('ms-MY', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      formattedDate: new Date(t.completedAt).toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    }));
  },
});

// Get date range transactions
export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.startDate > args.endDate) {
      throw new Error("startDate must be before endDate");
    }
    
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .order("desc")
      .collect();
    
    return transactions;
  },
});
