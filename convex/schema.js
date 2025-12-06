import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Payment method breakdown object schema
const paymentMethodBreakdown = v.object({
  cash: v.object({ count: v.number(), total: v.number() }),
  debit: v.object({ count: v.number(), total: v.number() }),
  credit: v.object({ count: v.number(), total: v.number() }),
  qr: v.object({ count: v.number(), total: v.number() }),
  ewallet: v.object({ count: v.number(), total: v.number() }),
});

export default defineSchema({
  menuItems: defineTable({
    name: v.string(),
    nameMalay: v.string(),
    price: v.number(),
    category: v.string(),
    aliases: v.array(v.string()),
    image: v.optional(v.string()),
    isAvailable: v.boolean(),
    createdAt: v.number(),
  }).index("by_category", ["category"])
    .index("by_available", ["isAvailable"]),
  
  transactions: defineTable({
    shiftId: v.optional(v.id("shifts")), // Link to shift
    date: v.string(), // "2025-01-15" format
    items: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    total: v.number(),
    paymentMethod: v.string(), // "cash", "debit", "credit", "qr", "ewallet"
    completedAt: v.number(),
  }).index("by_date", ["date"])
    .index("by_shift", ["shiftId"])
    .index("by_completedAt", ["completedAt"]),
  
  shifts: defineTable({
    date: v.string(), // "2025-01-15" format
    shiftNumber: v.number(), // 1, 2, 3 (shift number for that day)
    openedAt: v.number(),
    closedAt: v.optional(v.number()),
    openingCash: v.number(),
    closingCash: v.optional(v.number()),
    totalSales: v.optional(v.number()),
    transactionCount: v.optional(v.number()),
    status: v.string(), // "open" or "closed"
    openedBy: v.optional(v.string()),
    closedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
    byPaymentMethod: v.optional(paymentMethodBreakdown),
  }).index("by_status", ["status"])
    .index("by_date", ["date"])
    .index("by_openedAt", ["openedAt"]),
  
  dailySummaries: defineTable({
    date: v.string(), // "2025-01-15" format
    totalSales: v.number(),
    transactionCount: v.number(),
    shiftCount: v.number(),
    openingCash: v.number(), // First shift opening cash
    closingCash: v.number(), // Last shift closing cash
    cashDifference: v.number(), // Expected vs actual
    byPaymentMethod: paymentMethodBreakdown,
    createdAt: v.number(),
  }).index("by_date", ["date"]),
});
