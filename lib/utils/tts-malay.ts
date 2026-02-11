/**
 * Convert numbers and symbols to Malay words for clearer ElevenLabs TTS.
 * Avoids "RM", decimals, and digits being read incorrectly (gibberish).
 */

const MALAY_NUMBERS: Record<number, string> = {
  0: 'sifar',
  1: 'satu',
  2: 'dua',
  3: 'tiga',
  4: 'empat',
  5: 'lima',
  6: 'enam',
  7: 'tujuh',
  8: 'lapan',
  9: 'sembilan',
  10: 'sepuluh',
  11: 'sebelas',
  12: 'dua belas',
  13: 'tiga belas',
  14: 'empat belas',
  15: 'lima belas',
  16: 'enam belas',
  17: 'tujuh belas',
  18: 'lapan belas',
  19: 'sembilan belas',
  20: 'dua puluh',
}

function numberToMalay(n: number): string {
  if (Number.isInteger(n) && n >= 0 && n <= 20) {
    return MALAY_NUMBERS[n] ?? String(n)
  }
  if (Number.isInteger(n) && n > 20 && n < 100) {
    const tens = Math.floor(n / 10)
    const ones = n % 10
    if (ones === 0) return `${MALAY_NUMBERS[tens] ?? tens} puluh`
    return `${MALAY_NUMBERS[tens] ?? tens} puluh ${MALAY_NUMBERS[ones]}`
  }
  return String(n)
}

/**
 * Build TTS-friendly Malay phrase for order summary.
 * Ultra-short phrases so the voice is clear: "[Item]. [Item]. [Total] ringgit."
 * User confirmed "Nasi Ayam" and "Sembilan ringgit" are understandable.
 */
export function toTtsMalayOrderSummary(
  items: Array<{ name: string; quantity: number }>,
  totalRinggit: number
): string {
  if (items.length === 0) return 'Pesanan dikemaskini.'
  const totalStr = Number.isInteger(totalRinggit) && totalRinggit >= 0 && totalRinggit <= 99
    ? numberToMalay(totalRinggit)
    : String(Math.round(totalRinggit))
  const itemPhrases = items.map(
    (i) => `${i.name}. ${numberToMalay(i.quantity)}.`
  )
  return `${itemPhrases.join(' ')} ${totalStr} ringgit.`
}

/**
 * Simple TTS-friendly confirmation. Short and clear.
 */
export function toTtsMalayConfirmOrderSaved(): string {
  return 'Pesanan disimpan. Terima kasih.'
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  'Tunai': 'tunai',
  'Kad': 'kad',
  'E-Wallet': 'e-wallet',
  'QR Pay': 'QR pay',
}

/**
 * After payment: "[Item] [qty], [total] ringgit, dibayar dengan [payment]."
 * e.g. "Satu nasi ayam, sembilan ringgit, dibayar dengan tunai."
 */
export function toTtsMalayPaymentConfirmation(
  items: Array<{ name: string; quantity: number }>,
  totalRinggit: number,
  paymentMethod: string
): string {
  if (items.length === 0) return toTtsMalayConfirmOrderSaved()
  const totalStr = Number.isInteger(totalRinggit) && totalRinggit >= 0 && totalRinggit <= 99
    ? numberToMalay(totalRinggit)
    : String(Math.round(totalRinggit))
  const paymentLabel = PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod.toLowerCase()
  const itemPhrases = items.map(
    (i) => `${i.name}. ${numberToMalay(i.quantity)}.`
  )
  return `${itemPhrases.join(' ')} ${totalStr} ringgit. Dibayar dengan ${paymentLabel}. Terima kasih.`
}
