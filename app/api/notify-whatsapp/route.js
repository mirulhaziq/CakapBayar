import { NextResponse } from 'next/server';

const WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
const OWNER_WHATSAPP_NUMBER = process.env.META_WHATSAPP_OWNER_NUMBER; // e.g. "60123456789" or "+60123456789"

export async function POST(request) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !OWNER_WHATSAPP_NUMBER) {
    return NextResponse.json(
      { error: 'WhatsApp credentials not configured' },
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

    const avgOrder = transactionCount > 0 ? (totalSales / transactionCount) : 0;
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

    const payload = {
      messaging_product: 'whatsapp',
      to: OWNER_WHATSAPP_NUMBER.startsWith('+')
        ? OWNER_WHATSAPP_NUMBER
        : `+${OWNER_WHATSAPP_NUMBER}`,
      type: 'text',
      text: { body: text },
    };

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Meta API error: ${errText}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('WhatsApp notify error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

