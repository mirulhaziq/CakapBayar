import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all menu items (for management)
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("menuItems")
      .order("desc")
      .collect();
  },
});

// Get only available items (for ordering)
export const getAvailable = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("menuItems")
      .filter((q) => q.eq(q.field("isAvailable"), true))
      .collect();
  },
});

// Create new item
export const create = mutation({
  args: {
    name: v.string(),
    nameMalay: v.string(),
    price: v.number(),
    category: v.string(),
    aliases: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const itemId = await ctx.db.insert("menuItems", {
      ...args,
      isAvailable: true,
      createdAt: Date.now(),
    });
    return itemId;
  },
});

// Update item
export const update = mutation({
  args: {
    id: v.id("menuItems"),
    name: v.optional(v.string()),
    nameMalay: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    aliases: v.optional(v.array(v.string())),
    image: v.optional(v.string()),
    isAvailable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete item
export const remove = mutation({
  args: { id: v.id("menuItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Toggle availability
export const toggleAvailability = mutation({
  args: { id: v.id("menuItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (item) {
      await ctx.db.patch(args.id, {
        isAvailable: !item.isAvailable,
      });
    }
  },
});

// Initial seed (run once)
export const seed = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("menuItems").collect();
    if (existing.length > 0) return { message: "Already seeded" };
    
    const items = [
      {
        name: "Teh Tarik",
        nameMalay: "Teh Tarik",
        price: 2.50,
        category: "Minuman",
        aliases: ["teh", "tea", "tarik"],
        isAvailable: true,
        createdAt: Date.now(),
      },
      {
        name: "Kopi O",
        nameMalay: "Kopi O",
        price: 2.00,
        category: "Minuman",
        aliases: ["kopi", "coffee"],
        isAvailable: true,
        createdAt: Date.now(),
      },
      {
        name: "Roti Canai",
        nameMalay: "Roti Canai",
        price: 1.50,
        category: "Makanan",
        aliases: ["roti", "canai"],
        isAvailable: true,
        createdAt: Date.now(),
      },
    ];
    
    for (const item of items) {
      await ctx.db.insert("menuItems", item);
    }
    
    return { message: "Seeded", count: items.length };
  },
});
