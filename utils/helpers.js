/**
 * FUNÇÕES AUXILIARES (Helpers)
 * * Biblioteca central de validações e formatações para o mercado português.
 * * Usado por Controllers e Middlewares para garantir consistência nos dados.
 * * @module utils/helpers
 */

/**
 * CAPITALIZAR NOMES
 * * Transforma "joão silva" em "João Silva".
 * * Útil para normalizar nomes de clientes e cidades.
 * * @param str - A string original
 * * @returns A string formatada
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
 * VALIDAR NIF PORTUGUÊS
 * * Verifica se o Número de Contribuinte é válido usando o algoritmo do dígito de controlo (Módulo 11).
 * * Aceita apenas NIFs de 9 dígitos começados por 1, 2, 3, 5, 6, 8 ou 9.
 * * @param nif - O número a validar
 * * @returns True se for válido
 */
const validateNIF = (nif) => {
  if (!nif || typeof nif !== 'string') return false;

  // Remove espaços
  const cleanNIF = nif.replace(/\s/g, '');

  // Deve ter exatamente 9 dígitos
  if (!/^\d{9}$/.test(cleanNIF)) return false;

  // O primeiro dígito define o tipo de entidade (Pessoa, Empresa, etc.)
  const firstDigit = cleanNIF.charAt(0);
  if (!['1', '2', '3', '5', '6', '8', '9'].includes(firstDigit)) return false;

  // Cálculo do dígito de controlo
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
 * VALIDAR CÓDIGO POSTAL
 * * Verifica o formato XXXX-XXX.
 * * @param code - Código postal (ex: "3500-123")
 */
const validatePostalCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  const cleanCode = code.replace(/\s/g, '');
  return /^\d{4}-\d{3}$/.test(cleanCode);
};

/**
 * FORMATAR CÓDIGO POSTAL
 * * Converte "3500123" para "3500-123".
 * * @param code - String bruta
 */
const formatPostalCode = (code) => {
  if (!code || typeof code !== 'string') return code;
  const digits = code.replace(/\D/g, '');
  if (digits.length !== 7) return code;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

/**
 * FORMATAR MATRÍCULA
 * * Converte "aa00aa" para "AA-00-AA".
 * * @param plate - String bruta
 */
const formatLicensePlate = (plate) => {
  if (!plate || typeof plate !== 'string') return plate;
  const clean = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length !== 6) return plate.toUpperCase();
  return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 6)}`;
};

/**
 * VALIDAR MATRÍCULA
 * * Verifica se segue um dos padrões oficiais portugueses:
 * * AA-00-AA (Atual), 00-AA-00 (1992-2005) ou 00-00-AA (2005-2020).
 * * @param plate - Matrícula para validar
 */
const validateLicensePlate = (plate) => {
  if (!plate || typeof plate !== 'string') return false;
  const clean = plate.replace(/[-\s]/g, '').toUpperCase();
  if (clean.length !== 6) return false;

  const patterns = [
    /^[A-Z]{2}\d{2}[A-Z]{2}$/, // AA-00-AA
    /^\d{2}[A-Z]{2}\d{2}$/,     // 00-AA-00
    /^\d{2}\d{2}[A-Z]{2}$/      // 00-00-AA
  ];

  return patterns.some(pattern => pattern.test(clean));
};

/**
 * FORMATAR TELEFONE
 * * Adiciona espaços para leitura fácil (ex: 912 345 678).
 * * Suporta formatos móveis, fixos e internacionais (+351).
 */
const formatPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return phone;
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 9 && (digits.startsWith('9') || digits.startsWith('2'))) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  if (digits.length === 12 && digits.startsWith('351')) {
    return `+351 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }

  return phone;
};

/**
 * VALIDAR TELEFONE
 * * Aceita números móveis (9...), fixos (2...) e internacionais (+351...).
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const clean = phone.replace(/[^\d+]/g, '');
  const digits = clean.replace(/^\+/, '');

  // Nacional (9 dígitos)
  if (digits.length === 9 && (digits.startsWith('9') || digits.startsWith('2'))) {
    return true;
  }

  // Internacional (+351...)
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