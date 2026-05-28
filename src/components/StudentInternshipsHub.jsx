import { useEffect, useMemo, useState } from 'react'
import '../assets/styles/studentInternships.css'
import { getInternshipsByStudentId } from '../services/internshipService'
import {
  createInternshipDailyLog,
  getInternshipDailyLogs,
} from '../services/studentInternshipLogsService'
import { useUser } from '../services/userService'
import StudentInternshipsView from './StudentInternshipsView'

function getPreferredInternshipId(internships, currentSelectedId) {
  if (!internships.length) {
    return ''
  }

  if (internships.some((internship) => internship.id === currentSelectedId)) {
    return currentSelectedId
  }

  const activeInternship =
    internships.find((internship) => internship.status === 'activo') || internships[0]

  return activeInternship?.id || ''
}

function getTodayIsoDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function clampDateToRange(dateValue, startDate, endDate) {
  if (!startDate || !endDate) {
    return dateValue || getTodayIsoDate()
  }

  if (!dateValue) {
    const today = getTodayIsoDate()

    if (today >= startDate && today <= endDate) {
      return today
    }

    return startDate
  }

  if (dateValue < startDate) {
    return startDate
  }

  if (dateValue > endDate) {
    return endDate
  }

  return dateValue
}

export default function StudentInternshipsHub() {
  const { currentUser } = useUser()
  const [internships, setInternships] = useState([])
  const [selectedInternshipId, setSelectedInternshipId] = useState('')
  const [dailyLogs, setDailyLogs] = useState([])
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadStudentInternships() {
      if (!currentUser?.uid) {
        if (isMounted) {
          setInternships([])
          setSelectedInternshipId('')
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage('')
        const nextInternships = await getInternshipsByStudentId(currentUser.uid)

        if (!isMounted) {
          return
        }

        setInternships(nextInternships)
        setSelectedInternshipId((currentSelectedId) =>
          getPreferredInternshipId(nextInternships, currentSelectedId),
        )
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'No se pudieron cargar tus prácticas.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadStudentInternships()

    return () => {
      isMounted = false
    }
  }, [currentUser?.uid])

  const selectedInternship = useMemo(
    () => internships.find((internship) => internship.id === selectedInternshipId) || null,
    [internships, selectedInternshipId],
  )

  useEffect(() => {
    let isMounted = true

    async function loadInternshipDailyLogs() {
      if (!selectedInternshipId) {
        if (isMounted) {
          setDailyLogs([])
        }
        return
      }

      try {
        setErrorMessage('')
        const logs = await getInternshipDailyLogs(selectedInternshipId)

        if (!isMounted) {
          return
        }

        setDailyLogs(logs)
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'No se pudieron cargar los registros diarios.')
        }
      }
    }

    loadInternshipDailyLogs()

    return () => {
      isMounted = false
    }
  }, [selectedInternshipId])

  useEffect(() => {
    if (!selectedInternship) {
      return
    }

    setSelectedDate((currentSelectedDate) =>
      clampDateToRange(
        currentSelectedDate,
        selectedInternship.startDate,
        selectedInternship.endDate,
      ),
    )
    setSuccessMessage('')
  }, [selectedInternship])

  async function handleSaveDailyLog(formData) {
    if (!selectedInternship) {
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      const savedDailyLog = await createInternshipDailyLog(selectedInternship.id, {
        ...formData,
        date: selectedDate,
      })

      setDailyLogs((currentLogs) =>
        [...currentLogs, savedDailyLog].sort((left, right) => left.date.localeCompare(right.date)),
      )
      setInternships((currentInternships) =>
        currentInternships.map((internship) =>
          internship.id === selectedInternship.id
            ? {
                ...internship,
                completedHours: Number(internship.completedHours || 0) + savedDailyLog.hoursWorked,
              }
            : internship,
        ),
      )
      setSuccessMessage('Registro diario guardado correctamente.')
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo guardar el registro diario.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <StudentInternshipsView
      currentUser={currentUser}
      internships={internships}
      selectedInternshipId={selectedInternshipId}
      onSelectInternship={setSelectedInternshipId}
      selectedInternship={selectedInternship}
      dailyLogs={dailyLogs}
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
      onSaveDailyLog={handleSaveDailyLog}
      isLoading={isLoading}
      isSaving={isSaving}
      errorMessage={errorMessage}
      successMessage={successMessage}
    />
  )
}
