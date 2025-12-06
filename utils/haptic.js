// Haptic feedback utility for mobile devices

export function hapticFeedback(type = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      error: [20, 50, 20, 50, 20],
    };
    
    navigator.vibrate(patterns[type] || patterns.light);
  }
}

