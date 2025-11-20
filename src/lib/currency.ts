export function formatCurrency(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyCompact(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE')}`;
}
