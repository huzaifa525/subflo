const SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", AED: "د.إ",
  CAD: "C$", AUD: "A$", KRW: "₩", CNY: "¥", RUB: "₽", BRL: "R$",
  THB: "฿", SGD: "S$", MYR: "RM", IDR: "Rp", PHP: "₱", VND: "₫",
};

export function sym(code: string): string {
  return SYMBOLS[code.toUpperCase()] || code;
}

export function fmt(amount: number, currency: string): string {
  return `${sym(currency)}${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
