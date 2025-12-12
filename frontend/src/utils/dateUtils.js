/**
 * Date utility functions
 */

/**
 * Get start of day
 * @param {Date} date - Date to get start of day for
 * @returns {Date} Start of day date
 */
export const getStartOfDay = (date = new Date()) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Get end of day
 * @param {Date} date - Date to get end of day for
 * @returns {Date} End of day date
 */
export const getEndOfDay = (date = new Date()) => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Get start of week
 * @param {Date} date - Date to get start of week for
 * @param {number} firstDayOfWeek - First day of week (0 = Sunday, 1 = Monday)
 * @returns {Date} Start of week date
 */
export const getStartOfWeek = (date = new Date(), firstDayOfWeek = 0) => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = day - firstDayOfWeek;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  return getStartOfDay(startOfWeek);
};

/**
 * Get end of week
 * @param {Date} date - Date to get end of week for
 * @param {number} firstDayOfWeek - First day of week (0 = Sunday, 1 = Monday)
 * @returns {Date} End of week date
 */
export const getEndOfWeek = (date = new Date(), firstDayOfWeek = 0) => {
  const endOfWeek = new Date(date);
  const day = endOfWeek.getDay();
  const diff = day - firstDayOfWeek;
  endOfWeek.setDate(endOfWeek.getDate() + (6 - diff));
  return getEndOfDay(endOfWeek);
};

/**
 * Get start of month
 * @param {Date} date - Date to get start of month for
 * @returns {Date} Start of month date
 */
export const getStartOfMonth = (date = new Date()) => {
  const startOfMonth = new Date(date);
  startOfMonth.setDate(1);
  return getStartOfDay(startOfMonth);
};

/**
 * Get end of month
 * @param {Date} date - Date to get end of month for
 * @returns {Date} End of month date
 */
export const getEndOfMonth = (date = new Date()) => {
  const endOfMonth = new Date(date);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
  return getEndOfDay(endOfMonth);
};

/**
 * Get start of year
 * @param {Date} date - Date to get start of year for
 * @returns {Date} Start of year date
 */
export const getStartOfYear = (date = new Date()) => {
  const startOfYear = new Date(date);
  startOfYear.setMonth(0, 1);
  return getStartOfDay(startOfYear);
};

/**
 * Get end of year
 * @param {Date} date - Date to get end of year for
 * @returns {Date} End of year date
 */
export const getEndOfYear = (date = new Date()) => {
  const endOfYear = new Date(date);
  endOfYear.setMonth(11, 31);
  return getEndOfDay(endOfYear);
};

/**
 * Add days to date
 * @param {Date} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export const addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

/**
 * Add months to date
 * @param {Date} date - Base date
 * @param {number} months - Number of months to add
 * @returns {Date} New date with months added
 */
export const addMonths = (date, months) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

/**
 * Add years to date
 * @param {Date} date - Base date
 * @param {number} years - Number of years to add
 * @returns {Date} New date with years added
 */
export const addYears = (date, years) => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
};

/**
 * Get difference between dates in days
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Difference in days
 */
export const getDaysDifference = (date1, date2) => {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Get difference between dates in months
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Difference in months
 */
export const getMonthsDifference = (date1, date2) => {
  const yearDiff = date2.getFullYear() - date1.getFullYear();
  const monthDiff = date2.getMonth() - date1.getMonth();
  return yearDiff * 12 + monthDiff;
};

/**
 * Get difference between dates in years
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Difference in years
 */
export const getYearsDifference = (date1, date2) => {
  return date2.getFullYear() - date1.getFullYear();
};

/**
 * Check if date is today
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Check if date is yesterday
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is yesterday
 */
export const isYesterday = (date) => {
  const yesterday = addDays(new Date(), -1);
  return date.toDateString() === yesterday.toDateString();
};

/**
 * Check if date is tomorrow
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is tomorrow
 */
export const isTomorrow = (date) => {
  const tomorrow = addDays(new Date(), 1);
  return date.toDateString() === tomorrow.toDateString();
};

/**
 * Check if date is in the past
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPast = (date) => {
  return date < new Date();
};

/**
 * Check if date is in the future
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export const isFuture = (date) => {
  return date > new Date();
};

/**
 * Check if date is weekend
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is weekend
 */
export const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

/**
 * Check if date is weekday
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is weekday
 */
export const isWeekday = (date) => {
  return !isWeekend(date);
};

/**
 * Get business days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of business days
 */
export const getBusinessDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWeekday(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

/**
 * Get next business day
 * @param {Date} date - Base date
 * @returns {Date} Next business day
 */
export const getNextBusinessDay = (date) => {
  let nextDay = addDays(date, 1);
  while (isWeekend(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
};

/**
 * Get previous business day
 * @param {Date} date - Base date
 * @returns {Date} Previous business day
 */
export const getPreviousBusinessDay = (date) => {
  let prevDay = addDays(date, -1);
  while (isWeekend(prevDay)) {
    prevDay = addDays(prevDay, -1);
  }
  return prevDay;
};

/**
 * Format date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} format - Format type
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate, format = 'short') => {
  if (!startDate || !endDate) return '';
  
  const start = startDate.toLocaleDateString('en-US', {
    month: format === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const end = endDate.toLocaleDateString('en-US', {
    month: format === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  return `${start} - ${end}`;
};

/**
 * Get age from birth date
 * @param {Date} birthDate - Birth date
 * @returns {number} Age in years
 */
export const getAge = (birthDate) => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Get quarter from date
 * @param {Date} date - Date to get quarter for
 * @returns {number} Quarter number (1-4)
 */
export const getQuarter = (date) => {
  return Math.floor(date.getMonth() / 3) + 1;
};

/**
 * Get fiscal year from date
 * @param {Date} date - Date to get fiscal year for
 * @param {number} fiscalYearStart - Month when fiscal year starts (0-11)
 * @returns {number} Fiscal year
 */
export const getFiscalYear = (date, fiscalYearStart = 0) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  if (month >= fiscalYearStart) {
    return year;
  } else {
    return year - 1;
  }
};

/**
 * Parse date string with multiple formats
 * @param {string} dateString - Date string to parse
 * @param {Array} formats - Array of date formats to try
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseDate = (dateString, formats = []) => {
  if (!dateString) return null;
  
  // Try default parsing first
  const defaultDate = new Date(dateString);
  if (!isNaN(defaultDate.getTime())) {
    return defaultDate;
  }
  
  // Try custom formats
  // Note: Currently using simple Date parsing, format parameter reserved for future use
  // eslint-disable-next-line no-unused-vars
  for (const _format of formats) {
    try {
      // This is a simplified implementation
      // In production, you might want to use a library like date-fns or moment.js
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
};

/**
 * Get timezone offset in minutes
 * @param {Date} date - Date to get timezone offset for
 * @returns {number} Timezone offset in minutes
 */
export const getTimezoneOffset = (date = new Date()) => {
  return date.getTimezoneOffset();
};

/**
 * Convert date to UTC
 * @param {Date} date - Date to convert
 * @returns {Date} UTC date
 */
export const toUTC = (date) => {
  return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
};

/**
 * Convert UTC date to local time
 * @param {Date} utcDate - UTC date to convert
 * @returns {Date} Local date
 */
export const fromUTC = (utcDate) => {
  return new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
};
