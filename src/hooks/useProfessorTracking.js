import { useEffect, useMemo, useState } from 'react'
import {
  acceptProfessorResponsibility,
  filterProfessorInternships,
  getProfessorAssignedInternships,
  getProfessorAvailableInternships,
  getProfessorTrackingDailyLogs,
  sortInternshipsByNewest,
} from '../services/professorTrackingService'

export default function useProfessorTracking(currentUser) {
  const [assignedInternships, setAssignedInternships] = useState([])
  const [availableInternships, setAvailableInternships] = useState([])
  const [selectedInternshipId, setSelectedInternshipId] = useState('')
  const [dailyLogs, setDailyLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadProfessorTracking() {
      if (!currentUser?.uid) {
        if (isMounted) {
          setAssignedInternships([])
          setAvailableInternships([])
          setSelectedInternshipId('')
          setDailyLogs([])
          setSearchTerm('')
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage('')
        const [nextAssignedInternships, nextAvailableInternships] = await Promise.all([
          getProfessorAssignedInternships(currentUser.uid),
          getProfessorAvailableInternships(),
        ])

        if (!isMounted) {
          return
        }

        setAssignedInternships(nextAssignedInternships)
        setAvailableInternships(nextAvailableInternships)
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'No se pudo cargar el seguimiento del profesor.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfessorTracking()

    return () => {
      isMounted = false
    }
  }, [currentUser?.uid])

  const hasAssignedInternships = assignedInternships.length > 0

  const filteredAssignedInternships = useMemo(
    () => filterProfessorInternships(assignedInternships, searchTerm),
    [assignedInternships, searchTerm],
  )

  const filteredAvailableInternships = useMemo(
    () => filterProfessorInternships(availableInternships, searchTerm),
    [availableInternships, searchTerm],
  )

  const combinedSearchInternships = useMemo(() => {
    if (!searchTerm) {
      return []
    }

    const internshipsMap = new Map()

    filteredAssignedInternships.forEach((internship) => {
      internshipsMap.set(internship.id, internship)
    })
    filteredAvailableInternships.forEach((internship) => {
      internshipsMap.set(internship.id, internship)
    })

    return sortInternshipsByNewest(Array.from(internshipsMap.values()))
  }, [filteredAssignedInternships, filteredAvailableInternships, searchTerm])

  useEffect(() => {
    const currentSource = searchTerm
      ? combinedSearchInternships
      : hasAssignedInternships
        ? filteredAssignedInternships
        : []

    if (!currentSource.length) {
      setSelectedInternshipId('')
      return
    }

    if (!currentSource.some((internship) => internship.id === selectedInternshipId)) {
      setSelectedInternshipId(currentSource[0].id)
    }
  }, [
    combinedSearchInternships,
    filteredAssignedInternships,
    hasAssignedInternships,
    searchTerm,
    selectedInternshipId,
  ])

  const selectedInternship = useMemo(() => {
    return (
      assignedInternships.find((internship) => internship.id === selectedInternshipId) ||
      availableInternships.find((internship) => internship.id === selectedInternshipId) ||
      null
    )
  }, [assignedInternships, availableInternships, selectedInternshipId])

  useEffect(() => {
    let isMounted = true

    async function loadDailyLogs() {
      if (!hasAssignedInternships || !selectedInternshipId) {
        if (isMounted) {
          setDailyLogs([])
          setIsLoadingLogs(false)
        }
        return
      }

      try {
        setIsLoadingLogs(true)
        setErrorMessage('')
        const nextDailyLogs = await getProfessorTrackingDailyLogs(selectedInternshipId)

        if (!isMounted) {
          return
        }

        setDailyLogs(nextDailyLogs)
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'No se pudieron cargar las actividades del alumno.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingLogs(false)
        }
      }
    }

    loadDailyLogs()

    return () => {
      isMounted = false
    }
  }, [hasAssignedInternships, selectedInternshipId])

  async function handleAcceptResponsibility() {
    if (!currentUser?.uid || !selectedInternshipId) {
      return
    }

    try {
      setIsAssigning(true)
      setErrorMessage('')
      setSuccessMessage('')

      const assignedInternship = await acceptProfessorResponsibility(
        selectedInternshipId,
        currentUser.uid,
      )

      setAssignedInternships((currentInternships) =>
        sortInternshipsByNewest([
          assignedInternship,
          ...currentInternships.filter((internship) => internship.id !== assignedInternship.id),
        ]),
      )
      setAvailableInternships((currentInternships) =>
        currentInternships.filter((internship) => internship.id !== selectedInternshipId),
      )
      setSelectedInternshipId(assignedInternship.id)
      setSuccessMessage('Ahora eres responsable del seguimiento de esta practica.')
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo asignar la responsabilidad del seguimiento.')
    } finally {
      setIsAssigning(false)
    }
  }

  return {
    searchTerm,
    setSearchTerm,
    selectedInternshipId,
    setSelectedInternshipId,
    selectedInternship,
    assignedInternships,
    availableInternships,
    filteredAssignedInternships,
    filteredAvailableInternships,
    combinedSearchInternships,
    hasAssignedInternships,
    dailyLogs,
    isLoading,
    isLoadingLogs,
    isAssigning,
    errorMessage,
    successMessage,
    onAcceptResponsibility: handleAcceptResponsibility,
  }
}
