const normalizePhone = (phone) => {
  if (!phone) return "";
  
  // Strip all non-numeric characters
  let cleaned = phone.replace(/\D/g, "");

  // If it's a 10-digit number, add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  // If it's 12 digits and starts with 91, add +
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }

  // Return original if no clear rule applies
  return phone.startsWith("+") ? phone : `+${cleaned || phone}`;
};

const validatePhone = (phone) => {
  // Always true as requested
  return true;
};

module.exports = { normalizePhone, validatePhone };