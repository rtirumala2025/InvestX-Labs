/**
 * Formatting utility functions
 */

/**
 * Format currency value
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - Locale code (default: en-US)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format percentage value
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {boolean} showSign - Whether to show + sign for positive values
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 2, showSign = false) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00%';
  
  const formatted = value.toFixed(decimals);
  const sign = showSign && value > 0 ? '+' : '';
  
  return `${sign}${formatted}%`;
};

/**
 * Format large numbers with suffixes (K, M, B, T)
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted number string
 */
export const formatLargeNumber = (num, decimals = 1) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1e12) {
    return `${sign}${(absNum / 1e12).toFixed(decimals)}T`;
  } else if (absNum >= 1e9) {
    return `${sign}${(absNum / 1e9).toFixed(decimals)}B`;
  } else if (absNum >= 1e6) {
    return `${sign}${(absNum / 1e6).toFixed(decimals)}M`;
  } else if (absNum >= 1e3) {
    return `${sign}${(absNum / 1e3).toFixed(decimals)}K`;
  } else {
    return `${sign}${absNum.toFixed(decimals)}`;
  }
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'iso', 'display')
 * @param {string} locale - Locale code (default: en-US)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'display', locale = 'en-US') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    iso: { year: 'numeric', month: '2-digit', day: '2-digit' },
    display: { month: 'short', day: 'numeric', year: 'numeric' }
  };
  
  return new Intl.DateTimeFormat(locale, options[format] || options.display).format(dateObj);
};

/**
 * Format time
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('12h', '24h')
 * @param {string} locale - Locale code (default: en-US)
 * @returns {string} Formatted time string
 */
export const formatTime = (date, format = '12h', locale = 'en-US') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const options = {
    '12h': { hour: 'numeric', minute: '2-digit', hour12: true },
    '24h': { hour: '2-digit', minute: '2-digit', hour12: false }
  };
  
  return new Intl.DateTimeFormat(locale, options[format] || options['12h']).format(dateObj);
};

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale code (default: en-US)
 * @returns {string} Formatted relative time string
 */
export const formatRelativeTime = (date, locale = 'en-US') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted file size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @param {string} format - Format type ('US', 'international')
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone, format = 'US') => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (format === 'US' && cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (format === 'international' && cleaned.length >= 10) {
    return `+${cleaned.slice(0, -10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
  }
  
  return phone;
};

/**
 * Format social security number
 * @param {string} ssn - SSN to format
 * @returns {string} Formatted SSN
 */
export const formatSSN = (ssn) => {
  if (!ssn) return '';
  
  const cleaned = ssn.replace(/\D/g, '');
  
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  
  return ssn;
};

/**
 * Format credit card number
 * @param {string} cardNumber - Credit card number to format
 * @returns {string} Formatted credit card number
 */
export const formatCreditCard = (cardNumber) => {
  if (!cardNumber) return '';
  
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length >= 4) {
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
  
  return cardNumber;
};

/**
 * Format stock symbol
 * @param {string} symbol - Stock symbol to format
 * @returns {string} Formatted stock symbol
 */
export const formatStockSymbol = (symbol) => {
  if (!symbol) return '';
  
  return symbol.toUpperCase().trim();
};

/**
 * Format company name
 * @param {string} name - Company name to format
 * @returns {string} Formatted company name
 */
export const formatCompanyName = (name) => {
  if (!name) return '';
  
  // Remove common suffixes and format
  const suffixes = ['Inc.', 'Corp.', 'Ltd.', 'LLC', 'Co.'];
  let formatted = name.trim();
  
  suffixes.forEach(suffix => {
    if (formatted.endsWith(suffix)) {
      formatted = formatted.slice(0, -suffix.length).trim();
    }
  });
  
  return formatted;
};

/**
 * Format price change with color class
 * @param {number} change - Price change value
 * @param {boolean} isPercentage - Whether the change is a percentage
 * @returns {Object} Formatted change with value and color class
 */
export const formatPriceChange = (change, isPercentage = false) => {
  if (change === null || change === undefined || isNaN(change)) {
    return { value: '0.00', color: 'text-gray-600' };
  }
  
  const formatted = isPercentage ? formatPercentage(change, 2, true) : formatCurrency(change, 'USD');
  const color = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
  
  return { value: formatted, color };
};

/**
 * Format risk level with color class
 * @param {string} riskLevel - Risk level
 * @returns {Object} Formatted risk level with value and color class
 */
export const formatRiskLevel = (riskLevel) => {
  const colors = {
    'Very Low': 'text-green-600 bg-green-100',
    'Low': 'text-green-600 bg-green-100',
    'Medium': 'text-yellow-600 bg-yellow-100',
    'High': 'text-orange-600 bg-orange-100',
    'Very High': 'text-red-600 bg-red-100'
  };
  
  return {
    value: riskLevel || 'Unknown',
    color: colors[riskLevel] || 'text-gray-600 bg-gray-100'
  };
};
