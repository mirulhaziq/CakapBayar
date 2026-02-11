import { z } from 'zod'

// ==================== SHIFT SCHEMAS ====================

export const OpenShiftSchema = z.object({
  openingCash: z.number()
    .min(0, 'Opening cash cannot be negative')
    .max(1000000, 'Opening cash exceeds maximum limit')
    .finite('Opening cash must be a valid number')
})

export const CloseShiftSchema = z.object({
  shiftId: z.number().int().positive('Invalid shift ID'),
  closingCash: z.number()
    .min(0, 'Closing cash cannot be negative')
    .max(1000000, 'Closing cash exceeds maximum limit')
    .finite('Closing cash must be a valid number'),
  notes: z.string().max(500, 'Notes too long').optional()
})

// ==================== TRANSACTION SCHEMAS ====================

export const TransactionItemSchema = z.object({
  item_id: z.number().int().positive().optional(),
  name: z.string().min(1, 'Item name is required').max(200),
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(10000, 'Price exceeds maximum')
    .finite('Price must be a valid number'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(1000, 'Quantity exceeds maximum')
})

export const CreateTransactionSchema = z.object({
  items: z.array(TransactionItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number()
    .min(0, 'Subtotal cannot be negative')
    .max(1000000, 'Subtotal exceeds maximum')
    .finite('Subtotal must be a valid number'),
  tax: z.number()
    .min(0, 'Tax cannot be negative')
    .max(100000, 'Tax exceeds maximum')
    .finite('Tax must be a valid number'),
  total: z.number()
    .min(0, 'Total cannot be negative')
    .max(1000000, 'Total exceeds maximum')
    .finite('Total must be a valid number'),
  paymentMethod: z.enum(['Tunai', 'Kad', 'E-Wallet', 'QR Pay'], {
    errorMap: () => ({ message: 'Invalid payment method' })
  }),
  paymentReceived: z.number()
    .min(0)
    .max(1000000)
    .finite()
    .optional(),
  changeGiven: z.number()
    .min(0)
    .max(1000000)
    .finite()
    .optional(),
  notes: z.string().max(500).optional()
})

// ==================== MENU ITEM SCHEMAS ====================

export const CreateMenuItemSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name too long'),
  nameMalay: z.string()
    .min(1, 'Malay name is required')
    .max(200, 'Malay name too long'),
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(10000, 'Price exceeds maximum')
    .finite('Price must be a valid number'),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category too long'),
  aliases: z.array(z.string().max(200)).optional().default([]),
  imageUrl: z.string().url('Invalid image URL').optional()
})

export const UpdateMenuItemSchema = z.object({
  id: z.number().int().positive('Invalid menu item ID'),
  name: z.string().min(1).max(200).optional(),
  nameMalay: z.string().min(1).max(200).optional(),
  price: z.number().min(0).max(10000).finite().optional(),
  category: z.string().min(1).max(100).optional(),
  aliases: z.array(z.string().max(200)).optional(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().optional()
})

export const DeleteMenuItemSchema = z.object({
  id: z.number().int().positive('Invalid menu item ID')
})

// ==================== EXPENSE SCHEMAS ====================

export const CreateExpenseSchema = z.object({
  amount: z.number()
    .min(0.01, 'Amount must be greater than 0')
    .max(1000000, 'Amount exceeds maximum')
    .finite('Amount must be a valid number'),
  category: z.enum([
    'Bahan Mentah',
    'Gaji',
    'Sewa',
    'Utiliti',
    'Pengangkutan',
    'Lain-lain'
  ], {
    errorMap: () => ({ message: 'Invalid expense category' })
  }),
  description: z.string().max(500, 'Description too long').optional(),
  receiptImage: z.string().url('Invalid receipt image URL').optional()
})

export const UpdateExpenseSchema = z.object({
  id: z.number().int().positive('Invalid expense ID'),
  amount: z.number().min(0.01).max(1000000).finite().optional(),
  category: z.enum([
    'Bahan Mentah',
    'Gaji',
    'Sewa',
    'Utiliti',
    'Pengangkutan',
    'Lain-lain'
  ]).optional(),
  description: z.string().max(500).optional(),
  receiptImage: z.string().url().optional()
})

export const DeleteExpenseSchema = z.object({
  id: z.number().int().positive('Invalid expense ID')
})

// ==================== ANALYTICS SCHEMAS ====================

export const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date()
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: 'End date must be after or equal to start date' }
)

export const BalanceSheetQuerySchema = z.object({
  year: z.number()
    .int()
    .min(2020, 'Year too old')
    .max(2100, 'Year too far in future'),
  month: z.number()
    .int()
    .min(1, 'Month must be between 1-12')
    .max(12, 'Month must be between 1-12')
})

// ==================== VOICE RECORDING SCHEMA ====================

export const CreateVoiceRecordingSchema = z.object({
  transcription: z.string().min(1).max(5000),
  parsedOrder: z.record(z.any()),
  confidenceScore: z.number().min(0).max(1).finite(),
  processingTimeMs: z.number().int().min(0).max(60000),
  audioUrl: z.string().url().optional()
})

// ==================== API REQUEST SCHEMAS ====================

export const TranscribeRequestSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB max
    'Audio file too large (max 10MB)'
  ).refine(
    (file) => ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg'].includes(file.type),
    'Invalid audio format (must be webm, wav, or mp3)'
  )
})

export const ParseOrderRequestSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required').max(1000),
  menuItems: z.array(z.object({
    name: z.string(),
    price: z.number(),
    aliases: z.array(z.string())
  })).min(1, 'Menu items are required'),
  currentOrderItems: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    price: z.number()
  })).optional().default([])
})

export const TextToSpeechRequestSchema = z.object({
  text: z.string()
    .min(1, 'Text is required')
    .max(5000, 'Text too long (max 5000 characters)')
})

export const SendEmailRequestSchema = z.object({
  shiftData: z.record(z.any()),
  transactions: z.array(z.record(z.any())).optional().default([]),
  recipientEmail: z.string().email('Invalid email address').optional()
})

// ==================== TYPE EXPORTS ====================

export type OpenShiftInput = z.infer<typeof OpenShiftSchema>
export type CloseShiftInput = z.infer<typeof CloseShiftSchema>
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>
export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>
export type BalanceSheetQuery = z.infer<typeof BalanceSheetQuerySchema>
