/**
 * Format a number as currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format currency parts for custom display
 * Returns object with currency symbol, integer, and fraction parts
 */
export function formatCurrencyParts(amount: number): {
  currency: string;
  integer: string;
  fraction: string;
} {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })
    .formatToParts(amount)
    .reduce(
      (acc, part) => {
        acc[part.type] = part.value;
        return acc;
      },
      {} as Record<string, string>
    );

  return {
    currency: parts.currency || '$',
    integer: parts.integer || '0',
    fraction: parts.fraction || '00',
  };
}

/**
 * Format a date to a localized string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Calculate delivery date (add days to current date)
 */
export function getDeliveryDate(daysToAdd: number = 3): string {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
