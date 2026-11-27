export function formatJoinPhone(
  mobile: string,
  countryCode: string,
  customCountryCode: string,
) {
  const number = mobile.trim();
  if (number.startsWith("00")) return `+${number.slice(2)}`;
  if (!number || number.startsWith("+")) return number;
  const prefix = countryCode === "other" ? customCountryCode : countryCode;
  if (!prefix) return number;
  const digits = number.replace(/\D/g, "");
  return `+${prefix}${prefix === "44" && digits.startsWith("0") ? digits.slice(1) : digits}`;
}

export function validJoinPhone(
  mobile: string,
  countryCode: string,
  customCountryCode: string,
) {
  if (!mobile.trim()) return true;
  if (
    countryCode === "other" &&
    !/^[1-9]\d{0,2}$/.test(customCountryCode) &&
    !mobile.trim().startsWith("+") &&
    !mobile.trim().startsWith("00")
  )
    return false;
  const formatted = formatJoinPhone(mobile, countryCode, customCountryCode);
  const length = formatted.replace(/\D/g, "").length;
  return length >= 8 && length <= 15 && formatted.length <= 40;
}
