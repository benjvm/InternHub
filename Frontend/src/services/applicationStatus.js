export const APPLICATION_STATUSES = {
  pending: 'pendiente',
  accepted: 'aceptado',
}

export const APPLICATION_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: APPLICATION_STATUSES.pending, label: 'Pendientes' },
  { id: APPLICATION_STATUSES.accepted, label: 'Aceptadas' },
]

const LEGACY_APPLICATION_STATUS_MAP = {
  submitted: APPLICATION_STATUSES.pending,
  pending: APPLICATION_STATUSES.pending,
  pendiente: APPLICATION_STATUSES.pending,
  accepted: APPLICATION_STATUSES.accepted,
  aceptado: APPLICATION_STATUSES.accepted,
}

export function normalizeApplicationStatus(status) {
  const normalizedStatus = status?.trim().toLowerCase() ?? ''
  return LEGACY_APPLICATION_STATUS_MAP[normalizedStatus] || APPLICATION_STATUSES.pending
}

export function matchesApplicationFilter(status, filterId) {
  if (!filterId || filterId === 'all') {
    return true
  }

  return normalizeApplicationStatus(status) === filterId
}

export function getApplicationStatusLabel(status) {
  switch (normalizeApplicationStatus(status)) {
    case APPLICATION_STATUSES.accepted:
      return 'Aceptada'
    case APPLICATION_STATUSES.pending:
    default:
      return 'Pendiente'
  }
}
