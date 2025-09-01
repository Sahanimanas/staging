const LONDON_PREFIXES = [
  "E", "EC", "N", "NW", "SE", "SW", "W", "WC",
  "BR", "CR", "DA", "EN", "HA", "IG", "KT",
  "RM", "SM", "TW", "UB"
];

// Validate & format UK postcode
function validatePostalcode(postalCode) {
  if (!postalCode) return { valid: false, formatted: null };

  // Normalize input → uppercase + remove spaces
  const cleaned = postalCode.trim().toUpperCase().replace(/\s+/g, "");

  // UK postcode regex (general)
  const regex = /^([A-Z]{1,2}[0-9][A-Z0-9]?)([0-9][A-Z]{2})$/;
  const match = cleaned.match(regex);

  if (!match) {
    return { valid: false, formatted: null };
  }

  const outward = match[1]; // e.g. "SW1A"
  const inward = match[2];  // e.g. "1AA"

  // Check London/Greater London prefixes
  const isLondon = LONDON_PREFIXES.some(prefix => outward.startsWith(prefix));
  if (!isLondon) {
    return { valid: false, formatted: null };
  }

  // Return properly formatted postcode (with space)
  return { valid: true, formatted: `${outward} ${inward}` };
}

module.exports = validatePostalcode;
