/**
 * Helper functions for validation and formatting
 */

/**
 * Capitalize the first letter of each word in a string
 * @param {string} str - The string to capitalize
 * @returns {string} - The capitalized string
 */
const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Validate Portuguese NIF (Número de Identificação Fiscal)
 * NIF must be exactly 9 digits and pass the check digit validation
 * @param {string} nif - The NIF to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateNIF = (nif) => {
  if (!nif || typeof nif !== 'string') return false;

  // Remove spaces and ensure only digits
  const cleanNIF = nif.replace(/\s/g, '');

  // Must be exactly 9 digits
  if (!/^\d{9}$/.test(cleanNIF)) return false;

  // First digit must be 1, 2, 3, 5, 6, 8 or 9
  const firstDigit = cleanNIF.charAt(0);
  if (!['1', '2', '3', '5', '6', '8', '9'].includes(firstDigit)) return false;

  // Validate check digit (last digit)
  const digits = cleanNIF.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * (9 - i);
  }
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;

  return digits[8] === checkDigit;
};

/**
 * Validate Portuguese postal code (Código Postal)
 * Format: XXXX-XXX (4 digits, hyphen, 3 digits)
 * @param {string} code - The postal code to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validatePostalCode = (code) => {
  if (!code || typeof code !== 'string') return false;

  // Remove spaces
  const cleanCode = code.replace(/\s/g, '');

  // Check format XXXX-XXX
  return /^\d{4}-\d{3}$/.test(cleanCode);
};

/**
 * Format Portuguese postal code to standard format (XXXX-XXX)
 * @param {string} code - The postal code to format
 * @returns {string} - The formatted postal code or original if invalid
 */
const formatPostalCode = (code) => {
  if (!code || typeof code !== 'string') return code;

  // Remove all non-digits
  const digits = code.replace(/\D/g, '');

  // Must have exactly 7 digits
  if (digits.length !== 7) return code;

  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

/**
 * Format Portuguese license plate
 * Modern format: AA-00-AA (2 letters, 2 digits, 2 letters)
 * @param {string} plate - The license plate to format
 * @returns {string} - The formatted license plate
 */
const formatLicensePlate = (plate) => {
  if (!plate || typeof plate !== 'string') return plate;

  // Remove all non-alphanumeric characters and convert to uppercase
  const clean = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  // Must have exactly 6 characters
  if (clean.length !== 6) return plate.toUpperCase();

  // Format as XX-XX-XX
  return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 6)}`;
};

/**
 * Validate Portuguese license plate format
 * Accepts multiple formats: AA-00-AA, 00-AA-00, 00-00-AA
 * @param {string} plate - The license plate to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateLicensePlate = (plate) => {
  if (!plate || typeof plate !== 'string') return false;

  // Remove hyphens and spaces, convert to uppercase
  const clean = plate.replace(/[-\s]/g, '').toUpperCase();

  // Must have exactly 6 characters
  if (clean.length !== 6) return false;

  // Check valid patterns (modern Portuguese plates)
  const patterns = [
    /^[A-Z]{2}\d{2}[A-Z]{2}$/,  // AA-00-AA (current format)
    /^\d{2}[A-Z]{2}\d{2}$/,     // 00-AA-00
    /^\d{2}\d{2}[A-Z]{2}$/      // 00-00-AA
  ];

  return patterns.some(pattern => pattern.test(clean));
};

/**
 * Format phone number (Portuguese format)
 * @param {string} phone - The phone number to format
 * @returns {string} - The formatted phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return phone;

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Portuguese mobile: 9XX XXX XXX (9 digits starting with 9)
  if (digits.length === 9 && digits.startsWith('9')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  // Portuguese landline: 2XX XXX XXX (9 digits starting with 2)
  if (digits.length === 9 && digits.startsWith('2')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  // With country code: +351 XXX XXX XXX
  if (digits.length === 12 && digits.startsWith('351')) {
    return `+351 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }

  return phone;
};

/**
 * Validate Portuguese phone number
 * Accepts 9 digit numbers starting with 9 (mobile) or 2 (landline)
 * Also accepts numbers with +351 country code
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;

  // Remove all non-digits except leading +
  const clean = phone.replace(/[^\d+]/g, '');

  // Remove leading + if present
  const digits = clean.replace(/^\+/, '');

  // Portuguese mobile (9 digits starting with 9)
  if (digits.length === 9 && digits.startsWith('9')) {
    return true;
  }

  // Portuguese landline (9 digits starting with 2)
  if (digits.length === 9 && digits.startsWith('2')) {
    return true;
  }

  // With country code +351 (12 digits total)
  if (digits.length === 12 && digits.startsWith('351')) {
    const localPart = digits.slice(3);
    return localPart.startsWith('9') || localPart.startsWith('2');
  }

  return false;
};

module.exports = {
  capitalizeFirstLetter,
  validateNIF,
  validatePostalCode,
  formatPostalCode,
  formatLicensePlate,
  validateLicensePlate,
  formatPhoneNumber,
  validatePhone
};
