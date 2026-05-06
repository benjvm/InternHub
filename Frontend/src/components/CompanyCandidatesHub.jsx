import { useEffect, useMemo, useState } from 'react'
import '../assets/styles/companyCandidates.css'
import { APPLICATION_FILTERS, matchesApplicationFilter } from '../services/applicationStatus'
import {
  acceptApplication,
  getCompanyApplications,
  updateApplicationStatus,
} from '../services/applicationsService'
import { useUser } from '../services/userService'
import CompanyCandidatesView from './CompanyCandidatesView'

export default function CompanyCandidatesHub() {
  const { currentUser } = useUser()
  const [activeFilter, setActiveFilter] = useState('all')
  const [applications, setApplications] = useState([])
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [updatingApplicationId, setUpdatingApplicationId] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadCompanyApplications() {
      if (!currentUser?.uid) {
        if (isMounted) {
          setApplications([])
          setSelectedApplicationId('')
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage('')
        const nextApplications = await getCompanyApplications(currentUser.uid)

        if (!isMounted) {
          return
        }

        setApplications(nextApplications)
        setSelectedApplicationId((currentSelectedId) =>
          nextApplications.some((application) => application.id === currentSelectedId)
            ? currentSelectedId
            : '',
        )
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'No se pudo cargar la lista de candidatos.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCompanyApplications()

    return () => {
      isMounted = false
    }
  }, [currentUser?.uid])

  const filteredApplications = useMemo(
    () =>
      applications.filter((application) =>
        matchesApplicationFilter(application.status, activeFilter),
      ),
    [activeFilter, applications],
  )

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedApplicationId) || null,
    [applications, selectedApplicationId],
  )

  async function handleStatusChange(applicationId, nextStatus) {
    try {
      setUpdatingApplicationId(applicationId)
      setErrorMessage('')

      const normalizedStatus = await updateApplicationStatus(applicationId, nextStatus)

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status: normalizedStatus,
                statusLabel:
                  normalizedStatus === 'aceptado'
                    ? 'Aceptada'
                    : normalizedStatus === 'rechazado'
                      ? 'Rechazada'
                      : 'Pendiente',
              }
            : application,
        ),
      )
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo actualizar el estado de la candidatura.')
    } finally {
      setUpdatingApplicationId('')
    }
  }

  async function handleAcceptApplication(applicationId) {
    const selectedApplicationData =
      applications.find((application) => application.id === applicationId) || null

    if (!selectedApplicationData) {
      setErrorMessage('No se ha encontrado la candidatura seleccionada.')
      return
    }

    try {
      setUpdatingApplicationId(applicationId)
      setErrorMessage('')

      const { status } = await acceptApplication(selectedApplicationData)

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status,
                statusLabel:
                  status === 'aceptado'
                    ? 'Aceptada'
                    : status === 'rechazado'
                      ? 'Rechazada'
                      : 'Pendiente',
              }
            : application,
        ),
      )
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo aceptar la candidatura.')
    } finally {
      setUpdatingApplicationId('')
    }
  }

  return (
    <CompanyCandidatesView
      currentUser={currentUser}
      applicationFilters={APPLICATION_FILTERS}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      applications={applications}
      filteredApplications={filteredApplications}
      selectedApplication={selectedApplication}
      onSelectApplication={setSelectedApplicationId}
      onCloseModal={() => setSelectedApplicationId('')}
      onAcceptApplication={handleAcceptApplication}
      onRejectApplication={(applicationId) => handleStatusChange(applicationId, 'rechazado')}
      isLoading={isLoading}
      errorMessage={errorMessage}
      updatingApplicationId={updatingApplicationId}
    />
  )
}
