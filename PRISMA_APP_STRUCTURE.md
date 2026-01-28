# CakapNBayar - Prisma Version Application Structure

## Complete File Structure Created

### 📁 Database & Core Files

#### `lib/prisma.ts`
- Prisma client initialization
- Global instance management for development

#### `prisma/schema.prisma`
- Complete database schema with 7 models:
  - Users
  - MenuItems
  - Shifts
  - Transactions
  - Expenses
  - DailySummaries
  - VoiceRecordings

### 📁 Server Actions (`lib/actions/`)

#### `shifts.ts`
- `openShift()` - Start new shift with opening cash
- `closeShift()` - Close shift with cash reconciliation
- `getActiveShift()` - Get current active shift
- `getShiftHistory()` - Get historical shifts
- `getShiftById()` - Get specific shift details

#### `transactions.ts`
- `createTransaction()` - Create new sale transaction
- `getTransactions()` - Get paginated transactions
- `getTransactionsByDateRange()` - Filter by date
- `deleteTransaction()` - Remove transaction
- Auto-updates daily summaries

#### `menu.ts`
- `getMenuItems()` - Get all menu items
- `getAvailableMenuItems()` - Get active items only
- `createMenuItem()` - Add new menu item
- `updateMenuItem()` - Edit menu item
- `deleteMenuItem()` - Remove menu item
- `toggleMenuItemAvailability()` - Toggle availability
- `getMenuCategories()` - Get distinct categories

#### `expenses.ts`
- `createExpense()` - Record new expense
- `getExpenses()` - Get paginated expenses
- `getExpensesByDateRange()` - Filter by date
- `deleteExpense()` - Remove expense
- `updateExpense()` - Edit expense
- `getExpenseCategories()` - Get expense categories

#### `analytics.ts`
- `getDailySummaries()` - Get daily performance data
- `getTodaySummary()` - Get today's stats
- `getMonthSummary()` - Monthly aggregations
- `getTopSellingItems()` - Best sellers
- `getPaymentMethodBreakdown()` - Payment analysis
- `getExpenseBreakdown()` - Expense analysis

#### `dailySummaries.ts`
- `getDailySummary()` - Get specific day summary
- `getDailySummaries()` - Get range of summaries
- `regenerateDailySummary()` - Recalculate summary

#### `voiceRecordings.ts`
- `saveVoiceRecording()` - Store voice order data
- `getVoiceRecordings()` - Get recording history
- `getVoiceRecordingStats()` - Voice system stats

#### `balanceSheet.ts`
- `getBalanceSheet()` - Generate balance sheet
- `getBalanceSheetComparison()` - Multi-month comparison
- `exportBalanceSheet()` - Export to PDF

### 📁 Type Definitions

#### `lib/types/balanceSheet.ts`
- `BalanceSheetData` interface
- `MonthlyBalanceSheet` interface
- Complete financial statement types

### 📁 Utilities

#### `lib/utils.ts`
- `cn()` - Tailwind class merger
- `formatCurrency()` - Format money (RM)
- `formatDate()` - Format dates (Malay locale)
- `formatDateShort()` - Short date format
- `formatTime()` - Time format

#### `lib/utils/export.ts`
- `exportToExcel()` - XLSX export
- `exportToPDF()` - Generic PDF export
- `exportBalanceSheetToPDF()` - Balance sheet PDF
- `exportTransactionsToPDF()` - Transaction report PDF
- `exportExpensesToPDF()` - Expense report PDF

### 📁 UI Components (`components/ui/`)

All Radix UI-based shadcn components:
- `button.tsx` - Button component with variants
- `card.tsx` - Card layouts
- `dialog.tsx` - Modal dialogs
- `input.tsx` - Form inputs
- `label.tsx` - Form labels
- `select.tsx` - Dropdown selects
- `switch.tsx` - Toggle switches
- `tabs.tsx` - Tab navigation

### 📁 Main Components

#### `components/Sidebar.tsx`
- Desktop navigation sidebar
- Active route highlighting
- All main navigation links

#### `components/MobileNav.tsx`
- Mobile bottom navigation
- Responsive design
- Quick access to 5 main pages

#### `components/BalanceSheet.tsx`
- Interactive balance sheet viewer
- Month/year selector
- PDF export functionality
- Complete financial breakdown

### 📁 Application Pages

#### `app/layout.tsx`
- Main layout wrapper
- Includes Sidebar (desktop)
- Includes MobileNav (mobile)
- Toast notifications (Sonner)
- PWA metadata

#### `app/page.tsx` (Dashboard)
- Today's summary stats
- Active shift indicator
- Top selling items
- Payment method breakdown
- Quick action cards

#### `app/pesanan/page.tsx` (Orders)
- Voice ordering button
- Manual order entry
- Menu item grid by category
- Live order cart
- Payment methods
- Change calculation

#### `app/sejarah/page.tsx` (History)
- Transaction list
- Date/time display
- Item breakdown per transaction
- Delete functionality
- Export to PDF

#### `app/menu/page.tsx` (Menu Management)
- Menu item CRUD operations
- Category grouping
- Availability toggle
- Price editing
- Dialog forms

#### `app/perbelanjaan/page.tsx` (Expenses)
- Expense recording
- Category selection
- Description field
- Total expenses display
- Delete functionality
- Export capability

#### `app/analytics/page.tsx` (Analytics)
- Four tabs: Overview, Sales, Expenses, Balance Sheet
- Interactive charts (Recharts):
  - Line charts for trends
  - Bar charts for comparisons
  - Pie charts for distributions
- Period selector (7/14/30/90 days)
- KPI cards
- Balance sheet integration

#### `app/shift/page.tsx` (Shift Management)
- Open/close shift dialogs
- Cash reconciliation
- Expected vs actual cash
- Shift history
- Transaction/expense summaries
- Cash difference tracking

#### `app/settings/page.tsx` (Settings)
- Business information
- Notification preferences
- System settings
- Data export/backup
- App information

## Key Features

### 🎤 Voice Ordering
- Integration ready for voice-to-text
- Groq/Claude API endpoints
- Voice recording storage
- Confidence scoring

### 💰 Shift Management
- Opening/closing cash tracking
- Cash reconciliation
- Shift-based transaction grouping
- Automatic expected cash calculation

### 📊 Financial Reporting
- Daily summaries with auto-generation
- Balance sheets (assets, liabilities, equity)
- Revenue breakdown by payment method
- Expense analysis by category
- Profit/loss tracking

### 📈 Analytics
- Real-time dashboard
- Historical trends
- Top sellers analysis
- Payment method preferences
- Expense tracking

### 📱 Responsive Design
- Desktop sidebar navigation
- Mobile bottom navigation
- Touch-friendly interfaces
- Progressive Web App (PWA) ready

### 🔄 Data Management
- Automatic daily summary updates
- Transaction history
- Expense tracking
- Menu management
- Export to PDF/Excel

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **UI Library**: Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Validation**: Zod
- **Notifications**: Sonner (Toast)
- **Date Handling**: date-fns
- **Export**: XLSX, jsPDF

## Database Models

1. **User** - Business owner info
2. **MenuItem** - Menu items with prices, categories, availability
3. **Shift** - Work shifts with cash tracking
4. **Transaction** - Sales records with items and payment
5. **Expense** - Business expenses by category
6. **DailySummary** - Aggregated daily statistics
7. **VoiceRecording** - Voice order history

## API Routes (Already Existing)

- `/api/transcribe` - Voice to text
- `/api/parse-order` - Parse order from text
- `/api/text-to-speech` - TTS for confirmations
- `/api/notify-email` - Email notifications
- `/api/notify-whatsapp` - WhatsApp notifications
- `/api/email/send-shift-report` - Shift reports

## Payment Methods Supported

- Tunai (Cash)
- Kad (Card)
- E-Wallet
- QR Pay

## Expense Categories

- Bahan Mentah (Raw materials)
- Gaji (Salary)
- Sewa (Rent)
- Utiliti (Utilities)
- Pengangkutan (Transportation)
- Penyelenggaraan (Maintenance)
- Pemasaran (Marketing)
- Lain-lain (Others)

## Status: ✅ COMPLETE

All files have been successfully created and the application structure is complete. The app is ready for:
1. Running `npm install` to install dependencies
2. Setting up `.env` with DATABASE_URL and DIRECT_URL
3. Running `npx prisma generate` and `npx prisma db push`
4. Starting development with `npm run dev`

## Next Steps

1. Configure environment variables
2. Push database schema to Supabase
3. Seed initial data (optional)
4. Test all features
5. Deploy to production
