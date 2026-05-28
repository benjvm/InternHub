import {
  assignProfessorToInternship,
  getInternshipsByProfessorId,
  getInternshipsWithoutProfessor,
} from './internshipService'
import { getInternshipDailyLogs } from './studentInternshipLogsService'

function normalizeSearchValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function buildSearchableText(internship) {
  return [
    internship?.studentName,
    internship?.companyName,
    internship?.offerTitle,
    internship?.student?.universidad,
    internship?.student?.carrera,
  ]
    .filter(Boolean)
    .join(' ')
}

export function getInternshipRequiredHours(internship) {
  const requiredHours = Number(internship?.requiredHours ?? internship?.totalHours ?? 0)
  return Number.isFinite(requiredHours) ? requiredHours : 0
}

export function getInternshipProgressPercentage(internship) {
  const requiredHours = getInternshipRequiredHours(internship)
  const completedHours = Number(internship?.completedHours || 0)

  if (!requiredHours) {
    return 0
  }

  return Math.min(100, Math.round((completedHours / requiredHours) * 100))
}

export function filterProfessorInternships(internships, searchTerm) {
  const normalizedSearchTerm = normalizeSearchValue(searchTerm)

  if (!normalizedSearchTerm) {
    return internships
  }

  return internships.filter((internship) =>
    normalizeSearchValue(buildSearchableText(internship)).includes(normalizedSearchTerm),
  )
}

export function sortInternshipsByNewest(internships) {
  return [...internships].sort((left, right) => {
    const leftTimestamp = left?.createdAt?.seconds ? left.createdAt.seconds : 0
    const rightTimestamp = right?.createdAt?.seconds ? right.createdAt.seconds : 0
    return rightTimestamp - leftTimestamp
  })
}

export async function getProfessorAssignedInternships(professorId) {
  return getInternshipsByProfessorId(professorId)
}

export async function getProfessorAvailableInternships() {
  return getInternshipsWithoutProfessor()
}

export async function acceptProfessorResponsibility(internshipId, professorId) {
  return assignProfessorToInternship(internshipId, professorId)
}

export async function getProfessorTrackingDailyLogs(internshipId) {
  return getInternshipDailyLogs(internshipId)
}
