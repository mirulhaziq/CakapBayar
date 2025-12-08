/**
 * Generate clear English announcement text for an order
 * Spoken slowly and clearly for better understanding
 * @param {Array} orderItems - Array of order items with name, quantity, price
 * @param {number} total - Total order amount
 * @returns {string} Announcement text in English
 */
export function generateOrderAnnouncement(orderItems, total) {
  // Build items list in clear English with pauses
  const itemsList = orderItems.map(item => {
    const quantity = item.quantity;
    const name = item.name;
    
    // Use words for small numbers for clarity
    if (quantity === 1) {
      return `one ${name}`;
    } else {
      return `${numberToWord(quantity)} ${name}`;
    }
  }).join('... '); // Add pause between items
  
  // Format price in clear English
  const priceText = formatPriceEnglish(total);
  
  // Construct full announcement with pauses for clarity
  // Using ellipsis (...) creates natural pauses in TTS
  const announcement = `Your order... ${itemsList}... Total amount... ${priceText}... Thank you!`;
  
  return announcement;
}

/**
 * Generate a shorter version of the announcement
 * @param {Array} orderItems - Array of order items
 * @param {number} total - Total order amount
 * @returns {string} Short announcement text
 */
export function generateShortAnnouncement(orderItems, total) {
  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const priceText = formatPriceEnglish(total);
  
  return `${itemCount} items... Total... ${priceText}... Thank you!`;
}

/**
 * Format price in clear English
 * @param {number} amount - Price amount
 * @returns {string} Formatted price in English
 */
export function formatPriceEnglish(amount) {
  const ringgit = Math.floor(amount);
  const sen = Math.round((amount - ringgit) * 100);
  
  if (ringgit === 0 && sen > 0) {
    return `${sen} cents`;
  }
  
  let priceText = `${ringgit} ringgit`;
  if (sen > 0) {
    priceText += ` and ${sen} cents`;
  }
  
  return priceText;
}

/**
 * Convert number to English word (for common quantities)
 * @param {number} num - Number to convert
 * @returns {string} Number as English word or digit
 */
export function numberToWord(num) {
  const englishNumbers = {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
    10: 'ten'
  };
  
  // For numbers 1-10, use English words
  // For larger numbers, use digits for clarity
  return englishNumbers[num] || num.toString();
}

/**
 * Generate announcement for payment confirmation
 * @param {number} total - Total amount paid
 * @param {string} paymentMethod - Payment method used
 * @returns {string} Payment confirmation announcement
 */
export function generatePaymentAnnouncement(total, paymentMethod) {
  const priceText = formatPriceEnglish(total);
  
  const methodEnglish = {
    cash: 'cash',
    debit: 'debit card',
    credit: 'credit card',
    qr: 'QR code',
    ewallet: 'e-wallet'
  };
  
  const method = methodEnglish[paymentMethod?.toLowerCase()] || paymentMethod;
  
  return `Payment of ${priceText}... via ${method}... received... Thank you!`;
}

// Keep old function names for backwards compatibility
export const formatPriceMalay = formatPriceEnglish;
export const numberToMalay = numberToWord;


