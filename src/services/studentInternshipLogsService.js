import {
  createDailyLogRecord,
  getDailyLogRecords,
} from './supabase/repositories/internshipsRepository'

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeHours(value) {
  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error('Las horas del dia deben ser un numero mayor que cero.')
  }

  return parsedValue
}

function normalizeLogType(value) {
  const normalizedValue = normalizeText(value).toLowerCase()

  if (normalizedValue === 'presencial' || normalizedValue === 'onsite') {
    return 'presencial'
  }

  if (normalizedValue === 'remoto' || normalizedValue === 'remote') {
    return 'remoto'
  }

  throw new Error('Selecciona un tipo de jornada valido.')
}

function normalizeDateId(dateValue) {
  const normalizedValue = normalizeText(dateValue)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    throw new Error('La fecha del registro no es valida.')
  }

  return normalizedValue
}

export function getInternshipDailyLogs(internshipId) {
  return getDailyLogRecords(normalizeText(internshipId))
}

export async function createInternshipDailyLog(internshipId, dailyLog) {
  const sanitizedInternshipId = normalizeText(internshipId)
  const dateId = normalizeDateId(dailyLog?.date)
  const description = normalizeText(dailyLog?.description)
  const hoursWorked = normalizeHours(dailyLog?.hoursWorked)
  const type = normalizeLogType(dailyLog?.type)

  if (!sanitizedInternshipId) {
    throw new Error('No se ha encontrado la practica seleccionada.')
  }

  if (!description) {
    throw new Error('La descripcion de tareas es obligatoria.')
  }

  await createDailyLogRecord(sanitizedInternshipId, {
    date: dateId,
    description,
    hoursWorked,
    type,
  })

  return {
    id: dateId,
    date: dateId,
    description,
    hoursWorked,
    type,
  }
}
