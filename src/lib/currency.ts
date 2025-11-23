export function formatCurrency(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000000) {
    return `KSh ${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `KSh ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `KSh ${(amount / 1000).toFixed(1)}K`;
  }
  return `KSh ${amount.toLocaleString('en-KE')}`;
}
