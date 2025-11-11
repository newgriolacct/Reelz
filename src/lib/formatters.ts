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
  
  if (price >= 1) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  }
  
  if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  }
  
  // For very small numbers, show more decimals
  if (price < 0.000001) {
    return `$${price.toFixed(10)}`;
  }
  
  return `$${price.toFixed(8)}`;
};

export const formatCurrency = (num: number): string => {
  return `$${formatNumber(num)}`;
};
