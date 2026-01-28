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

export function exportBalanceSheetToPDF(balanceSheet: any, filename: string) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text('Lembaran Imbangan', 14, 20)
  doc.setFontSize(12)
  doc.text(`Bulan: ${balanceSheet.period.month}/${balanceSheet.period.year}`, 14, 28)
  
  let yPosition = 40
  
  // Assets Section
  doc.setFontSize(14)
  doc.text('ASET', 14, yPosition)
  yPosition += 10
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Jumlah (RM)']],
    body: [
      ['Tunai', balanceSheet.assets.current.cash.toFixed(2)],
      ['Akaun Belum Terima', balanceSheet.assets.current.accountsReceivable.toFixed(2)],
      ['Jumlah Aset Semasa', balanceSheet.assets.current.total.toFixed(2)],
      ['JUMLAH ASET', balanceSheet.assets.total.toFixed(2)]
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] }
  })
  
  yPosition = (doc as any).lastAutoTable.finalY + 15
  
  // Liabilities Section
  doc.setFontSize(14)
  doc.text('LIABILITI', 14, yPosition)
  yPosition += 10
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Jumlah (RM)']],
    body: [
      ['Akaun Belum Bayar', balanceSheet.liabilities.current.accountsPayable.toFixed(2)],
      ['Jumlah Liabiliti Semasa', balanceSheet.liabilities.current.total.toFixed(2)],
      ['JUMLAH LIABILITI', balanceSheet.liabilities.total.toFixed(2)]
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [231, 76, 60] }
  })
  
  yPosition = (doc as any).lastAutoTable.finalY + 15
  
  // Equity Section
  doc.setFontSize(14)
  doc.text('EKUITI', 14, yPosition)
  yPosition += 10
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Jumlah (RM)']],
    body: [
      ['Pendapatan Tertahan', balanceSheet.equity.retainedEarnings.toFixed(2)],
      ['JUMLAH EKUITI', balanceSheet.equity.total.toFixed(2)]
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [46, 204, 113] }
  })
  
  yPosition = (doc as any).lastAutoTable.finalY + 15
  
  // Revenue & Expenses Summary
  doc.setFontSize(14)
  doc.text('RINGKASAN', 14, yPosition)
  yPosition += 10
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Jumlah (RM)']],
    body: [
      ['Jumlah Hasil', balanceSheet.revenue.total.toFixed(2)],
      ['Jumlah Perbelanjaan', balanceSheet.expenses.total.toFixed(2)],
      ['Pendapatan Bersih', balanceSheet.netIncome.toFixed(2)]
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [155, 89, 182] }
  })
  
  doc.save(`${filename}.pdf`)
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
