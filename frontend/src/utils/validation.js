/**
 * Validation utility functions
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid and errors
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 6,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false
  } = options;
  
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate stock symbol
 * @param {string} symbol - Stock symbol to validate
 * @returns {boolean} True if valid stock symbol
 */
export const isValidStockSymbol = (symbol) => {
  if (!symbol || typeof symbol !== 'string') return false;
  
  const symbolRegex = /^[A-Z]{1,5}$/;
  return symbolRegex.test(symbol.trim().toUpperCase());
};

/**
 * Validate price
 * @param {number|string} price - Price to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid and errors
 */
export const validatePrice = (price, options = {}) => {
  const {
    min = 0.01,
    max = 1000000,
    allowZero = false
  } = options;
  
  const errors = [];
  
  if (price === null || price === undefined || price === '') {
    errors.push('Price is required');
    return { isValid: false, errors };
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    errors.push('Price must be a valid number');
    return { isValid: false, errors };
  }
  
  if (!allowZero && numPrice <= 0) {
    errors.push('Price must be greater than 0');
  }
  
  if (numPrice < min) {
    errors.push(`Price must be at least ${min}`);
  }
  
  if (numPrice > max) {
    errors.push(`Price must be no more than ${max}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate shares quantity
 * @param {number|string} shares - Shares to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid and errors
 */
export const validateShares = (shares, options = {}) => {
  const {
    min = 1,
    max = 1000000,
    allowFractional = true
  } = options;
  
  const errors = [];
  
  if (shares === null || shares === undefined || shares === '') {
    errors.push('Shares quantity is required');
    return { isValid: false, errors };
  }
  
  const numShares = typeof shares === 'string' ? parseFloat(shares) : shares;
  
  if (isNaN(numShares)) {
    errors.push('Shares must be a valid number');
    return { isValid: false, errors };
  }
  
  if (numShares <= 0) {
    errors.push('Shares must be greater than 0');
  }
  
  if (numShares < min) {
    errors.push(`Shares must be at least ${min}`);
  }
  
  if (numShares > max) {
    errors.push(`Shares must be no more than ${max}`);
  }
  
  if (!allowFractional && !Number.isInteger(numShares)) {
    errors.push('Shares must be a whole number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate date
 * @param {Date|string} date - Date to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid and errors
 */
export const validateDate = (date, options = {}) => {
  const {
    minDate = null,
    maxDate = null,
    allowFuture = true,
    allowPast = true
  } = options;
  
  const errors = [];
  
  if (!date) {
    errors.push('Date is required');
    return { isValid: false, errors };
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    errors.push('Date must be a valid date');
    return { isValid: false, errors };
  }
  
  const now = new Date();
  
  if (!allowFuture && dateObj > now) {
    errors.push('Date cannot be in the future');
  }
  
  if (!allowPast && dateObj < now) {
    errors.push('Date cannot be in the past');
  }
  
  if (minDate && dateObj < minDate) {
    errors.push(`Date must be after ${minDate.toLocaleDateString()}`);
  }
  
  if (maxDate && dateObj > maxDate) {
    errors.push(`Date must be before ${maxDate.toLocaleDateString()}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @param {string} format - Expected format ('US', 'international')
 * @returns {Object} Validation result with isValid and errors
 */
export const validatePhoneNumber = (phone, format = 'US') => {
  const errors = [];
  
  if (!phone || typeof phone !== 'string') {
    errors.push('Phone number is required');
    return { isValid: false, errors };
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (format === 'US') {
    if (cleaned.length !== 10) {
      errors.push('US phone number must be 10 digits');
    }
  } else if (format === 'international') {
    if (cleaned.length < 10 || cleaned.length > 15) {
      errors.push('International phone number must be 10-15 digits');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate form data
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result with isValid and errors
 */
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const fieldErrors = [];
    
    // Required validation
    if (rule.required && (!value || value === '')) {
      fieldErrors.push(`${rule.label || field} is required`);
    }
    
    // Type-specific validation
    if (value && value !== '') {
      switch (rule.type) {
        case 'email':
          if (!isValidEmail(value)) {
            fieldErrors.push(`${rule.label || field} must be a valid email address`);
          }
          break;
        case 'password':
          const passwordValidation = validatePassword(value, rule.options);
          if (!passwordValidation.isValid) {
            fieldErrors.push(...passwordValidation.errors);
          }
          break;
        case 'number':
          if (isNaN(parseFloat(value))) {
            fieldErrors.push(`${rule.label || field} must be a valid number`);
          }
          break;
        case 'date':
          const dateValidation = validateDate(value, rule.options);
          if (!dateValidation.isValid) {
            fieldErrors.push(...dateValidation.errors);
          }
          break;
        case 'phone':
          const phoneValidation = validatePhoneNumber(value, rule.format);
          if (!phoneValidation.isValid) {
            fieldErrors.push(...phoneValidation.errors);
          }
          break;
        case 'url':
          if (!isValidUrl(value)) {
            fieldErrors.push(`${rule.label || field} must be a valid URL`);
          }
          break;
        default:
          // Unknown validation type, skip type-specific validation
          break;
      }
      
      // Length validation
      if (rule.minLength && value.length < rule.minLength) {
        fieldErrors.push(`${rule.label || field} must be at least ${rule.minLength} characters long`);
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        fieldErrors.push(`${rule.label || field} must be no more than ${rule.maxLength} characters long`);
      }
      
      // Custom validation
      if (rule.custom && typeof rule.custom === 'function') {
        const customResult = rule.custom(value, data);
        if (customResult !== true) {
          fieldErrors.push(customResult || `${rule.label || field} is invalid`);
        }
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Validate and sanitize form input
 * @param {string} input - Input to validate and sanitize
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with sanitized value
 */
export const validateAndSanitizeInput = (input, options = {}) => {
  const {
    required = false,
    maxLength = null,
    minLength = null,
    pattern = null
  } = options;
  
  const errors = [];
  const sanitized = sanitizeInput(input);
  
  if (required && !sanitized) {
    errors.push('This field is required');
  }
  
  if (minLength && sanitized.length < minLength) {
    errors.push(`Must be at least ${minLength} characters long`);
  }
  
  if (maxLength && sanitized.length > maxLength) {
    errors.push(`Must be no more than ${maxLength} characters long`);
  }
  
  if (pattern && !pattern.test(sanitized)) {
    errors.push('Invalid format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};
