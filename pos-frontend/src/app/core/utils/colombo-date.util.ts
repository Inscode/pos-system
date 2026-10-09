const COLOMBO_TIME_ZONE = 'Asia/Colombo';

/**
 * Format API timestamps for Sri Lanka. Purchase needs currently return
 * timezone-less LocalDateTime values, which represent Colombo wall time.
 * Timestamps with an explicit zone are converted to Colombo time.
 */
export function formatColomboDate(value: string | null | undefined, includeTime = true): string {
  if (!value) return '';

  const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const dateValue = hasExplicitZone
    ? new Date(normalized)
    : new Date(normalized.includes('T') ? `${normalized}Z` : `${normalized}T00:00:00Z`);

  if (Number.isNaN(dateValue.getTime())) return value;

  return new Intl.DateTimeFormat('en-LK', {
    timeZone: hasExplicitZone ? COLOMBO_TIME_ZONE : 'UTC',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: 'numeric' as const, minute: '2-digit' as const } : {})
  }).format(dateValue);
}
