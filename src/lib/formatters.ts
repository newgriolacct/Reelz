export const formatNumber = (num: number): string => {
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  } else if (absNum >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  } else if (absNum >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`;
  }
  
  return num.toFixed(2);
};

export const formatPrice = (price: number): string => {
  if (price === 0) return '$0.00';
  
  if (price < 0.01) {
    // For very small prices, show more decimals
    return `$${price.toFixed(8)}`;
  } else if (price < 1) {
    return `$${price.toFixed(6)}`;
  } else if (price < 100) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(2)}`;
  }
};

export const formatCurrency = (num: number): string => {
  return `$${formatNumber(num)}`;
};
