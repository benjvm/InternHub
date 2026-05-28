import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const INTERNSHIPS_COLLECTION = 'internships'
const DAILY_LOGS_COLLECTION = 'dailyLogs'

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeHours(value) {
  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error('Las horas del día deben ser un número mayor que cero.')
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

  throw new Error('Selecciona un tipo de jornada válido.')
}

function normalizeDateId(dateValue) {
  const normalizedValue = normalizeText(dateValue)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    throw new Error('La fecha del registro no es válida.')
  }

  return normalizedValue
}

function mapDailyLogDocument(snapshot) {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    ...data,
    date: data.date || snapshot.id,
  }
}

export async function getInternshipDailyLogs(internshipId) {
  const sanitizedInternshipId = normalizeText(internshipId)

  if (!sanitizedInternshipId) {
    return []
  }

  const dailyLogsQuery = query(
    collection(db, INTERNSHIPS_COLLECTION, sanitizedInternshipId, DAILY_LOGS_COLLECTION),
  )

  const snapshot = await getDocs(dailyLogsQuery)

  return snapshot.docs
    .map(mapDailyLogDocument)
    .sort((left, right) => left.date.localeCompare(right.date))
}

export async function createInternshipDailyLog(internshipId, dailyLog) {
  const sanitizedInternshipId = normalizeText(internshipId)
  const dateId = normalizeDateId(dailyLog?.date)
  const description = normalizeText(dailyLog?.description)
  const hoursWorked = normalizeHours(dailyLog?.hoursWorked)
  const type = normalizeLogType(dailyLog?.type)

  if (!sanitizedInternshipId) {
    throw new Error('No se ha encontrado la práctica seleccionada.')
  }

  if (!description) {
    throw new Error('La descripción de tareas es obligatoria.')
  }

  const internshipRef = doc(db, INTERNSHIPS_COLLECTION, sanitizedInternshipId)
  const dailyLogRef = doc(internshipRef, DAILY_LOGS_COLLECTION, dateId)

  await runTransaction(db, async (transaction) => {
    const internshipSnapshot = await transaction.get(internshipRef)

    if (!internshipSnapshot.exists()) {
      throw new Error('La práctica ya no está disponible.')
    }

    const dailyLogSnapshot = await transaction.get(dailyLogRef)

    if (dailyLogSnapshot.exists()) {
      throw new Error('Ese día ya está registrado. No es posible guardarlo dos veces.')
    }

    transaction.set(dailyLogRef, {
      date: dateId,
      description,
      hoursWorked,
      type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    transaction.update(internshipRef, {
      completedHours: increment(hoursWorked),
      updatedAt: serverTimestamp(),
      lastUpdate: serverTimestamp(),
    })
  })

  return {
    id: dateId,
    date: dateId,
    description,
    hoursWorked,
    type,
  }
}
