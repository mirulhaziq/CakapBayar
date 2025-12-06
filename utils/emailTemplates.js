export function generateShiftClosureEmail(shiftData, transactions = []) {
  const {
    shiftNumber,
    date,
    openedAt,
    closedAt,
    openingCash = 0,
    closingCash = 0,
    totalSales = 0,
    transactionCount = 0,
    byPaymentMethod = {},
    openedBy = '',
    closedBy = '',
    notes = ''
  } = shiftData;

  const durationMs = (closedAt || 0) - (openedAt || 0);
  const hours = Math.max(0, Math.floor(durationMs / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60)));

  const dateStr = date
    ? new Date(date).toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });

  const openTime = openedAt
    ? new Date(openedAt).toLocaleString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '-';

  const closeTime = closedAt
    ? new Date(closedAt).toLocaleString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '-';

  const safePM = {
    cash: { count: 0, total: 0 },
    debit: { count: 0, total: 0 },
    credit: { count: 0, total: 0 },
    qr: { count: 0, total: 0 },
    ewallet: { count: 0, total: 0 },
    ...(byPaymentMethod || {})
  };

  const transactionRows = transactions
    .map((t, idx) => {
      const time = new Date(t.completedAt).toLocaleTimeString('ms-MY', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const items = t.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
      return `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:12px 8px;font-size:14px;">${idx + 1}</td>
          <td style="padding:12px 8px;font-size:14px;">${time}</td>
          <td style="padding:12px 8px;font-size:14px;">${items}</td>
          <td style="padding:12px 8px;font-size:14px;text-align:right;">RM ${t.total.toFixed(2)}</td>
          <td style="padding:12px 8px;font-size:14px;text-transform:capitalize;">${t.paymentMethod}</td>
        </tr>
      `;
    })
    .join('');

  const expectedCash = openingCash + (safePM.cash?.total || 0);
  const cashDifference = closingCash - expectedCash;

  const paymentRows = Object.entries(safePM)
    .filter(([, data]) => data.count > 0 || data.total > 0)
    .map(([method, data]) => {
      const methodNames = {
        cash: '💵 Tunai',
        debit: '💳 Kad Debit',
        credit: '💳 Kad Kredit',
        qr: '📱 QR Pay',
        ewallet: '💰 E-Wallet'
      };
      return `
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:12px 0;font-size:14px;">${methodNames[method] || method}</td>
          <td style="padding:12px 0;text-align:right;color:#6B7280;font-size:14px;">${data.count} transaksi</td>
          <td style="padding:12px 0;text-align:right;font-weight:600;font-size:14px;">RM ${data.total.toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Shift - ${dateStr}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:40px 20px;">
        <table role="presentation" style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#003049 0%,#F77F00 100%);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:bold;">📊 Laporan Shift</h1>
              <p style="margin:10px 0 0;color:#EAE2B7;font-size:16px;">${dateStr}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <h2 style="margin:0 0 20px;color:#003049;font-size:20px;">Shift ${shiftNumber ?? '-'}</h2>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tr><td style="padding:8px 0;color:#6B7280;">Dibuka</td><td style="padding:8px 0;text-align:right;font-weight:600;">${openTime} ${openedBy ? `oleh ${openedBy}` : ''}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280;">Ditutup</td><td style="padding:8px 0;text-align:right;font-weight:600;">${closeTime} ${closedBy ? `oleh ${closedBy}` : ''}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280;">Tempoh</td><td style="padding:8px 0;text-align:right;font-weight:600;">${hours} jam ${minutes} minit</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 30px 30px 30px;">
              <div style="background:#F77F00;padding:20px;border-radius:8px;text-align:center;">
                <p style="margin:0;color:#fff;font-size:14px;opacity:0.9;">Jumlah Jualan</p>
                <h3 style="margin:10px 0 0;color:#fff;font-size:36px;font-weight:bold;">RM ${Number(totalSales || 0).toFixed(2)}</h3>
              </div>
              <table style="width:100%;margin-top:20px;">
                <tr>
                  <td style="text-align:center;padding:15px;">
                    <p style="margin:0;color:#6B7280;font-size:14px;">Transaksi</p>
                    <p style="margin:5px 0 0;color:#003049;font-size:24px;font-weight:bold;">${transactionCount ?? 0}</p>
                  </td>
                  <td style="text-align:center;padding:15px;border-left:1px solid #E5E7EB;">
                    <p style="margin:0;color:#6B7280;font-size:14px;">Purata</p>
                    <p style="margin:5px 0 0;color:#003049;font-size:24px;font-weight:bold;">RM ${
                      transactionCount ? (totalSales / transactionCount).toFixed(2) : '0.00'
                    }</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 30px 30px 30px;">
              <h3 style="margin:0 0 15px;color:#003049;font-size:18px;">Pecahan Bayaran</h3>
              <table style="width:100%;border-collapse:collapse;">
                ${paymentRows || '<tr><td style="padding:8px 0;color:#6B7280;">Tiada data bayaran</td></tr>'}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 30px 30px 30px;">
              <h3 style="margin:0 0 15px;color:#003049;font-size:18px;">Penyesuaian Tunai</h3>
              <table style="width:100%;border-collapse:collapse;background:#F9FAFB;padding:15px;border-radius:8px;">
                <tr><td style="padding:8px 0;color:#6B7280;">Tunai Awal</td><td style="padding:8px 0;text-align:right;font-weight:600;">RM ${openingCash.toFixed(2)}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280;">Jualan Tunai</td><td style="padding:8px 0;text-align:right;font-weight:600;">+ RM ${(safePM.cash.total || 0).toFixed(2)}</td></tr>
                <tr style="border-top:2px solid #E5E7EB;"><td style="padding:8px 0;color:#6B7280;font-weight:600;">Jangkaan</td><td style="padding:8px 0;text-align:right;font-weight:600;">RM ${expectedCash.toFixed(2)}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280;font-weight:600;">Sebenar</td><td style="padding:8px 0;text-align:right;font-weight:600;">RM ${closingCash.toFixed(2)}</td></tr>
                <tr style="border-top:2px solid #E5E7EB;">
                  <td style="padding:8px 0;font-weight:bold;color:${cashDifference === 0 ? '#10B981' : cashDifference > 0 ? '#F59E0B' : '#EF4444'};">Beza</td>
                  <td style="padding:8px 0;text-align:right;font-weight:bold;font-size:18px;color:${cashDifference === 0 ? '#10B981' : cashDifference > 0 ? '#F59E0B' : '#EF4444'};">
                    ${cashDifference >= 0 ? '+' : ''}RM ${cashDifference.toFixed(2)} ${cashDifference === 0 ? '✅' : cashDifference > 0 ? '⚠️' : '❌'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 30px 30px 30px;">
              <h3 style="margin:0 0 15px;color:#003049;font-size:18px;">Senarai Transaksi</h3>
              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <thead>
                    <tr style="background:#F3F4F6;border-bottom:2px solid #E5E7EB;">
                      <th style="padding:12px 8px;text-align:left;font-weight:600;color:#374151;">#</th>
                      <th style="padding:12px 8px;text-align:left;font-weight:600;color:#374151;">Masa</th>
                      <th style="padding:12px 8px;text-align:left;font-weight:600;color:#374151;">Item</th>
                      <th style="padding:12px 8px;text-align:right;font-weight:600;color:#374151;">Jumlah</th>
                      <th style="padding:12px 8px;text-align:left;font-weight:600;color:#374151;">Bayaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${transactionRows || '<tr><td colspan="5" style="padding:12px 8px;text-align:center;color:#6B7280;">Tiada transaksi</td></tr>'}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
          ${notes
            ? `<tr><td style="padding:0 30px 30px 30px;"><h3 style="margin:0 0 15px;color:#003049;font-size:18px;">Catatan</h3><div style="background:#FEF3C7;padding:15px;border-radius:8px;border-left:4px solid #F59E0B;"><p style="margin:0;color:#92400E;font-size:14px;">${notes}</p></div></td></tr>`
            : ''}
          <tr>
            <td style="padding:20px 30px;background:#F9FAFB;border-radius:0 0 8px 8px;text-align:center;">
              <p style="margin:0;color:#6B7280;font-size:12px;">
                Laporan dijana secara automatik oleh CakapBayar POS<br>${new Date().toLocaleString('ms-MY')}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

