import { NextResponse } from 'next/server';

// Using nodemailer with SMTP credentials
export async function POST(request) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_FROM,
    EMAIL_TO,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM || !EMAIL_TO) {
    return NextResponse.json(
      { error: 'Email credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const { summary } = await request.json();
    if (!summary) {
      return NextResponse.json({ error: 'Missing summary payload' }, { status: 400 });
    }

    const {
      date = '',
      totalSales = 0,
      transactionCount = 0,
      shiftCount = 0,
      openingCash = 0,
      closingCash = 0,
      cashDifference = 0,
      byPaymentMethod = {},
    } = summary;

    const avgOrder = transactionCount > 0 ? totalSales / transactionCount : 0;
    const pm = byPaymentMethod || {};
    const line = (label, obj) =>
      `${label}: RM${(obj?.total || 0).toFixed(2)} (${obj?.count || 0})`;

    const text = [
      `Ringkasan Harian (${date || 'Hari ini'})`,
      `Jumlah jualan: RM${totalSales.toFixed(2)}`,
      `Transaksi: ${transactionCount}`,
      `Purata pesanan: RM${avgOrder.toFixed(2)}`,
      `Bil. shift: ${shiftCount}`,
      `Tunai awal: RM${openingCash.toFixed(2)}`,
      `Tunai akhir: RM${closingCash.toFixed(2)}`,
      `Beza tunai: RM${cashDifference.toFixed(2)}`,
      `Bayaran:`,
      `- Tunai: ${line('Tunai', pm.cash)}`,
      `- Kad/Debit: ${line('Kad', pm.debit || pm.card)}`,
      `- Kredit: ${line('Kredit', pm.credit)}`,
      `- QR: ${line('QR', pm.qr)}`,
      `- E-Wallet: ${line('E-Wallet', pm.ewallet)}`,
    ].join('\n');

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for others
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: `Ringkasan Jualan Harian - ${date || 'Hari ini'}`,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Email notify error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


