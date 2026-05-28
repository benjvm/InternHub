import { useEffect, useMemo, useState } from 'react'
import '../assets/styles/companyCandidates.css'
import {
  getInternshipStatusLabel,
  getInternshipsByCompanyId,
  INTERNSHIP_FILTERS,
  matchesInternshipFilter,
  updateInternshipDetails,
  updateInternshipStatus,
} from '../services/internshipService'
import { useUser } from '../services/userService'
import CompanyInternshipsView from './CompanyInternshipsView'

export default function CompanyInternshipsHub() {
  const { currentUser } = useUser()
  const [activeFilter, setActiveFilter] = useState('all')
  const [internships, setInternships] = useState([])
  const [selectedInternshipId, setSelectedInternshipId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [updatingInternshipId, setUpdatingInternshipId] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadCompanyInternships() {
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
        const nextInternships = await getInternshipsByCompanyId(currentUser.uid)

        if (!isMounted) {
          return
        }

        setInternships(nextInternships)
        setSelectedInternshipId((currentSelectedId) =>
          nextInternships.some((internship) => internship.id === currentSelectedId)
            ? currentSelectedId
            : '',
        )
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'No se pudo cargar la lista de prácticas.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCompanyInternships()

    return () => {
      isMounted = false
    }
  }, [currentUser?.uid])

  const filteredInternships = useMemo(
    () =>
      internships.filter((internship) =>
        matchesInternshipFilter(internship.status, activeFilter),
      ),
    [activeFilter, internships],
  )

  const selectedInternship = useMemo(
    () => internships.find((internship) => internship.id === selectedInternshipId) || null,
    [internships, selectedInternshipId],
  )

  async function handleSaveDetails(internshipId, data) {
    try {
      setUpdatingInternshipId(internshipId)
      setErrorMessage('')

      const updatedInternship = await updateInternshipDetails(internshipId, data)

      setInternships((current) =>
        current.map((internship) =>
          internship.id === internshipId
            ? {
                ...internship,
                ...updatedInternship,
                statusLabel: getInternshipStatusLabel(updatedInternship.status),
              }
            : internship,
        ),
      )
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo activar la práctica.')
    } finally {
      setUpdatingInternshipId('')
    }
  }

  async function handleStatusChange(internshipId, nextStatus) {
    try {
      setUpdatingInternshipId(internshipId)
      setErrorMessage('')

      const normalizedStatus = await updateInternshipStatus(internshipId, nextStatus)

      setInternships((current) =>
        current.map((internship) =>
          internship.id === internshipId
            ? {
                ...internship,
                status: normalizedStatus,
                statusLabel: getInternshipStatusLabel(normalizedStatus),
              }
            : internship,
        ),
      )
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo actualizar el estado de la práctica.')
    } finally {
      setUpdatingInternshipId('')
    }
  }

  return (
    <CompanyInternshipsView
      currentUser={currentUser}
      internshipFilters={INTERNSHIP_FILTERS}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      internships={internships}
      filteredInternships={filteredInternships}
      selectedInternship={selectedInternship}
      onSelectInternship={setSelectedInternshipId}
      onCloseModal={() => setSelectedInternshipId('')}
      onSaveDetails={handleSaveDetails}
      onMarkCompleted={(internshipId) => handleStatusChange(internshipId, 'completado')}
      onCancelInternship={(internshipId) => handleStatusChange(internshipId, 'cancelado')}
      isLoading={isLoading}
      errorMessage={errorMessage}
      updatingInternshipId={updatingInternshipId}
    />
  )
}
