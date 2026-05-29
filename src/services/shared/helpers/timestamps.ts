export function createTimestamp() {
  return new Date().toISOString()
}

export function toTimestampCompat(value: unknown) {
  if (!value) {
    return value
  }

  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return value
  }

  const dateValue = typeof value === 'string' || value instanceof Date ? new Date(value) : null

  if (!dateValue || Number.isNaN(dateValue.getTime())) {
    return value
  }

  return {
    seconds: Math.floor(dateValue.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => dateValue,
  }
}

export function mapTimestampFields<T extends Record<string, unknown>>(record: T) {
  return {
    ...record,
    createdAt: toTimestampCompat(record.createdAt || record.created_at),
    updatedAt: toTimestampCompat(record.updatedAt || record.updated_at),
    lastUpdate: toTimestampCompat(record.lastUpdate || record.last_update),
  }
}
