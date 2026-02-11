import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportToExcel(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportToPDF(
  title: string,
  headers: string[],
  data: any[][],
  filename: string
) {
  const doc = new jsPDF()
  
  doc.setFontSize(16)
  doc.text(title, 14, 20)
  
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 30,
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    }
  })
  
  doc.save(`${filename}.pdf`)
}

const GREEN_HEADER = [46, 204, 113] as [number, number, number]
const GRAY_TOTAL = [240, 240, 240] as [number, number, number]
const RED_NEGATIVE = [231, 76, 60] as [number, number, number]

function fmt(v: number): string {
  return Number(v).toFixed(2)
}
function change(current: number, prev: number | undefined): number {
  return current - (prev ?? 0)
}

export function exportBalanceSheetToPDF(balanceSheet: any, filename: string) {
  const doc = new jsPDF()
  const prev = balanceSheet.previousPeriod
  const businessName = balanceSheet.businessName || 'CakapBayar'
  const asOfDate = new Date(balanceSheet.period.asOfDate)
  const dateStr = asOfDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const currentLabel = `${asOfDate.toLocaleDateString('ms-MY', { month: 'short' })} ${balanceSheet.period.year}`
  const prevLabel = prev
    ? `${new Date(balanceSheet.period.year, (balanceSheet.period.month === 1 ? 12 : balanceSheet.period.month - 1) - 1).toLocaleDateString('ms-MY', { month: 'short' })} ${balanceSheet.period.month === 1 ? balanceSheet.period.year - 1 : balanceSheet.period.year}`
    : '-'

  // Header: title left (green), company right
  doc.setFontSize(18)
  doc.setTextColor(GREEN_HEADER[0], GREEN_HEADER[1], GREEN_HEADER[2])
  doc.setFont('helvetica', 'bold')
  doc.text('Lembaran Imbangan', 14, 18)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.text(businessName, doc.internal.pageSize.getWidth() - 14, 18, { align: 'right' })
  doc.setFontSize(9)
  doc.text('As of ' + dateStr, 14, 26)

  // Column positions: ensure proper spacing to prevent overlap
  const colDesc = 14
  const colDescWidth = 50  // Max width for description column
  const colCur = 70        // Current period column start
  const colCurWidth = 30   // Width for current period column
  const colPrev = 105      // Previous period column start
  const colPrevWidth = 30  // Width for previous period column
  const colChg = 140       // Change column start
  const colChgWidth = 30   // Width for change column
  
  let y = 38

  const drawRow = (
    label: string,
    cur: number,
    p: number | undefined,
    isTotal: boolean,
    isDoubleTotal: boolean
  ) => {
    const ch = change(cur, p)
    
    // Draw gray background for totals
    if (isTotal) {
      doc.setFillColor(GRAY_TOTAL[0], GRAY_TOTAL[1], GRAY_TOTAL[2])
      doc.rect(colDesc, y - 4, colChg + colChgWidth - colDesc, 7, 'F')
    }
    
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal')
    doc.setTextColor(0, 0, 0)
    
    // Description column: left-aligned with max width to prevent overflow
    doc.text(label, colDesc, y, { maxWidth: colDescWidth })
    
    // Current period column: right-aligned within its column
    const curText = 'RM ' + fmt(cur)
    doc.text(curText, colCur + colCurWidth, y, { align: 'right' })
    
    // Previous period column: right-aligned within its column
    const prevText = prev ? 'RM ' + fmt(p ?? 0) : '-'
    doc.text(prevText, colPrev + colPrevWidth, y, { align: 'right' })
    
    // Change column: right-aligned within its column
    if (prev) {
      doc.setTextColor(ch < 0 ? RED_NEGATIVE[0] : 0, ch < 0 ? RED_NEGATIVE[1] : 0, ch < 0 ? RED_NEGATIVE[2] : 0)
      const chgText = 'RM ' + fmt(ch)
      doc.text(chgText, colChg + colChgWidth, y, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    } else {
      doc.text('-', colChg + colChgWidth, y, { align: 'right' })
    }
    
    // Draw underline for totals
    if (isTotal) {
      doc.setLineWidth(0.5)
      doc.line(colCur, y + 1, colCur + colCurWidth, y + 1)
      doc.line(colPrev, y + 1, colPrev + colPrevWidth, y + 1)
      doc.line(colChg, y + 1, colChg + colChgWidth, y + 1)
    }
    
    // Draw double underline for main totals
    if (isDoubleTotal) {
      doc.setLineWidth(0.5)
      doc.line(colCur, y + 1.5, colCur + colCurWidth, y + 1.5)
      doc.line(colCur, y + 2, colCur + colCurWidth, y + 2)
      doc.line(colPrev, y + 1.5, colPrev + colPrevWidth, y + 1.5)
      doc.line(colPrev, y + 2, colPrev + colPrevWidth, y + 2)
      doc.line(colChg, y + 1.5, colChg + colChgWidth, y + 1.5)
      doc.line(colChg, y + 2, colChg + colChgWidth, y + 2)
    }
    
    y += 6
    if (isDoubleTotal) y += 2
  }

  const sectionHeader = (title: string) => {
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(GREEN_HEADER[0], GREEN_HEADER[1], GREEN_HEADER[2])
    doc.text(title, colDesc, y)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    y += 8
  }

  // Column headers
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Item', colDesc, y)
  doc.text(currentLabel, colCur + colCurWidth, y, { align: 'right' })
  doc.text(prevLabel, colPrev + colPrevWidth, y, { align: 'right' })
  doc.text('Change', colChg + colChgWidth, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  y += 8

  // ASSETS
  sectionHeader('ASET')
  doc.setFontSize(10)
  doc.text('Aset Semasa', colDesc, y)
  y += 6
  drawRow('Tunai', balanceSheet.assets.current.cash, prev?.assets?.current?.cash, false, false)
  drawRow('Akaun Belum Terima', balanceSheet.assets.current.accountsReceivable, prev?.assets?.current?.accountsReceivable, false, false)
  drawRow('Inventori', balanceSheet.assets.current.inventory, prev?.assets?.current?.inventory, false, false)
  drawRow('Jumlah Aset Semasa', balanceSheet.assets.current.total, prev?.assets?.current?.total, true, false)
  if (balanceSheet.assets.nonCurrent.total > 0 || (prev?.assets?.nonCurrent?.total ?? 0) > 0) {
    y += 2
    drawRow('Peralatan', balanceSheet.assets.nonCurrent.equipment, prev?.assets?.nonCurrent?.equipment, false, false)
    drawRow('Harta', balanceSheet.assets.nonCurrent.property, prev?.assets?.nonCurrent?.property, false, false)
    drawRow('Jumlah Aset Bukan Semasa', balanceSheet.assets.nonCurrent.total, prev?.assets?.nonCurrent?.total, true, false)
  }
  drawRow('JUMLAH ASET', balanceSheet.assets.total, prev?.assets?.total, true, true)

  // LIABILITIES
  sectionHeader('LIABILITI')
  doc.setFontSize(10)
  doc.text('Liabiliti Semasa', colDesc, y)
  y += 6
  drawRow('Akaun Belum Bayar', balanceSheet.liabilities.current.accountsPayable, prev?.liabilities?.current?.accountsPayable, false, false)
  drawRow('Pinjaman Jangka Pendek', balanceSheet.liabilities.current.shortTermLoans, prev?.liabilities?.current?.shortTermLoans, false, false)
  drawRow('Jumlah Liabiliti Semasa', balanceSheet.liabilities.current.total, prev?.liabilities?.current?.total, true, false)
  if (balanceSheet.liabilities.nonCurrent.total > 0 || (prev?.liabilities?.nonCurrent?.total ?? 0) > 0) {
    y += 2
    drawRow('Pinjaman Jangka Panjang', balanceSheet.liabilities.nonCurrent.longTermLoans, prev?.liabilities?.nonCurrent?.longTermLoans, false, false)
    drawRow('Jumlah Liabiliti Bukan Semasa', balanceSheet.liabilities.nonCurrent.total, prev?.liabilities?.nonCurrent?.total, true, false)
  }
  drawRow('JUMLAH LIABILITI', balanceSheet.liabilities.total, prev?.liabilities?.total, true, true)

  // EQUITY
  sectionHeader('EKUITI')
  drawRow('Modal Permulaan', balanceSheet.equity.openingCapital, prev?.equity?.openingCapital, false, false)
  drawRow('Pendapatan Tertahan', balanceSheet.equity.retainedEarnings, prev?.equity?.retainedEarnings, false, false)
  drawRow('JUMLAH EKUITI', balanceSheet.equity.total, prev?.equity?.total, true, true)

  y += 6
  doc.setFontSize(10)
  if (balanceSheet.balances) {
    doc.setTextColor(GREEN_HEADER[0], GREEN_HEADER[1], GREEN_HEADER[2])
    doc.text('Lembaran Imbangan Seimbang', colDesc, y)
  } else {
    doc.setTextColor(RED_NEGATIVE[0], RED_NEGATIVE[1], RED_NEGATIVE[2])
    doc.text(`Tidak Seimbang (Perbezaan: RM ${Math.abs(balanceSheet.difference).toFixed(2)})`, colDesc, y)
  }
  doc.setTextColor(0, 0, 0)
  y += 12

  // Income Statement
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(GREEN_HEADER[0], GREEN_HEADER[1], GREEN_HEADER[2])
  doc.text('PENDAPATAN & PERBELANJAAN', colDesc, y)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`(Bulan ${balanceSheet.period.month}/${balanceSheet.period.year})`, colDesc, y + 5)
  y += 12
  doc.setFontSize(10)
  drawRow('Jumlah Hasil', balanceSheet.incomeStatement.revenue.total, prev?.incomeStatement?.revenue?.total, false, false)
  drawRow('Jumlah Perbelanjaan', balanceSheet.incomeStatement.expenses.total, prev?.incomeStatement?.expenses?.total, false, false)
  drawRow('Pendapatan Bersih', balanceSheet.incomeStatement.netIncome, prev?.incomeStatement?.netIncome, true, false)

  doc.save(`${filename}.pdf`)
}

export function exportBalanceSheetToExcel(balanceSheet: any, filename: string) {
  const prev = balanceSheet.previousPeriod
  const businessName = balanceSheet.businessName || 'CakapBayar'
  const asOfDate = new Date(balanceSheet.period.asOfDate)
  const dateStr = asOfDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const currentLabel = `${asOfDate.toLocaleDateString('ms-MY', { month: 'short' })} ${balanceSheet.period.year}`
  const prevLabel = prev
    ? `${new Date(balanceSheet.period.year, (balanceSheet.period.month === 1 ? 12 : balanceSheet.period.month - 1) - 1).toLocaleDateString('ms-MY', { month: 'short' })} ${balanceSheet.period.month === 1 ? balanceSheet.period.year - 1 : balanceSheet.period.year}`
    : 'Previous'

  const fmt = (v: number) => Number(v).toFixed(2)
  const ch = (cur: number, p: number | undefined) => cur - (p ?? 0)

  const rows: (string | number)[][] = []
  rows.push([businessName, '', '', ''])
  rows.push(['Lembaran Imbangan', '', '', ''])
  rows.push(['As of ' + dateStr, '', '', ''])
  rows.push([])
  rows.push(['Item', currentLabel, prevLabel, 'Change'])

  const pushRow = (label: string, cur: number, p: number | undefined, isTotal: boolean) => {
    const changeVal = prev ? ch(cur, p) : ''
    const prevVal = prev !== undefined && prev !== null ? p ?? 0 : ''
    rows.push([
      label,
      isTotal ? Number(cur.toFixed(2)) : cur,
      typeof prevVal === 'number' ? (isTotal ? Number((p ?? 0).toFixed(2)) : (p ?? 0)) : prevVal,
      typeof changeVal === 'number' ? (isTotal ? Number(changeVal.toFixed(2)) : changeVal) : changeVal
    ])
  }

  rows.push([])
  rows.push(['ASET'])
  rows.push(['Aset Semasa'])
  pushRow('Tunai', balanceSheet.assets.current.cash, prev?.assets?.current?.cash, false)
  pushRow('Akaun Belum Terima', balanceSheet.assets.current.accountsReceivable, prev?.assets?.current?.accountsReceivable, false)
  pushRow('Inventori', balanceSheet.assets.current.inventory, prev?.assets?.current?.inventory, false)
  pushRow('Jumlah Aset Semasa', balanceSheet.assets.current.total, prev?.assets?.current?.total, true)
  if (balanceSheet.assets.nonCurrent.total > 0 || (prev?.assets?.nonCurrent?.total ?? 0) > 0) {
    pushRow('Peralatan', balanceSheet.assets.nonCurrent.equipment, prev?.assets?.nonCurrent?.equipment, false)
    pushRow('Harta', balanceSheet.assets.nonCurrent.property, prev?.assets?.nonCurrent?.property, false)
    pushRow('Jumlah Aset Bukan Semasa', balanceSheet.assets.nonCurrent.total, prev?.assets?.nonCurrent?.total, true)
  }
  pushRow('JUMLAH ASET', balanceSheet.assets.total, prev?.assets?.total, true)

  rows.push([])
  rows.push(['LIABILITI'])
  rows.push(['Liabiliti Semasa'])
  pushRow('Akaun Belum Bayar', balanceSheet.liabilities.current.accountsPayable, prev?.liabilities?.current?.accountsPayable, false)
  pushRow('Pinjaman Jangka Pendek', balanceSheet.liabilities.current.shortTermLoans, prev?.liabilities?.current?.shortTermLoans, false)
  pushRow('Jumlah Liabiliti Semasa', balanceSheet.liabilities.current.total, prev?.liabilities?.current?.total, true)
  if (balanceSheet.liabilities.nonCurrent.total > 0 || (prev?.liabilities?.nonCurrent?.total ?? 0) > 0) {
    pushRow('Pinjaman Jangka Panjang', balanceSheet.liabilities.nonCurrent.longTermLoans, prev?.liabilities?.nonCurrent?.longTermLoans, false)
    pushRow('Jumlah Liabiliti Bukan Semasa', balanceSheet.liabilities.nonCurrent.total, prev?.liabilities?.nonCurrent?.total, true)
  }
  pushRow('JUMLAH LIABILITI', balanceSheet.liabilities.total, prev?.liabilities?.total, true)

  rows.push([])
  rows.push(['EKUITI'])
  pushRow('Modal Permulaan', balanceSheet.equity.openingCapital, prev?.equity?.openingCapital, false)
  pushRow('Pendapatan Tertahan', balanceSheet.equity.retainedEarnings, prev?.equity?.retainedEarnings, false)
  pushRow('JUMLAH EKUITI', balanceSheet.equity.total, prev?.equity?.total, true)

  rows.push([])
  rows.push(['PENDAPATAN & PERBELANJAAN', '', '', ''])
  rows.push([`(Bulan ${balanceSheet.period.month}/${balanceSheet.period.year})`, '', '', ''])
  pushRow('Jumlah Hasil', balanceSheet.incomeStatement.revenue.total, prev?.incomeStatement?.revenue?.total, false)
  pushRow('Jumlah Perbelanjaan', balanceSheet.incomeStatement.expenses.total, prev?.incomeStatement?.expenses?.total, false)
  pushRow('Pendapatan Bersih', balanceSheet.incomeStatement.netIncome, prev?.incomeStatement?.netIncome, true)

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  const wb = XLSX.utils.book_new()
  const sheetName = 'Lembaran Imbangan'
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportTransactionsToPDF(transactions: any[], filename: string) {
  const doc = new jsPDF()
  
  doc.setFontSize(16)
  doc.text('Laporan Transaksi', 14, 20)
  
  const data = transactions.map(t => [
    new Date(t.transactionDate).toLocaleDateString('ms-MY'),
    t.paymentMethod,
    `RM ${Number(t.total).toFixed(2)}`,
    t.notes || '-'
  ])
  
  autoTable(doc, {
    head: [['Tarikh', 'Kaedah Bayaran', 'Jumlah', 'Nota']],
    body: data,
    startY: 30,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] }
  })
  
  doc.save(`${filename}.pdf`)
}

export function exportExpensesToPDF(expenses: any[], filename: string) {
  const doc = new jsPDF()
  
  doc.setFontSize(16)
  doc.text('Laporan Perbelanjaan', 14, 20)
  
  const data = expenses.map(e => [
    new Date(e.expenseDate).toLocaleDateString('ms-MY'),
    e.category,
    e.description || '-',
    `RM ${Number(e.amount).toFixed(2)}`
  ])
  
  autoTable(doc, {
    head: [['Tarikh', 'Kategori', 'Penerangan', 'Jumlah']],
    body: data,
    startY: 30,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [231, 76, 60] }
  })
  
  doc.save(`${filename}.pdf`)
}
