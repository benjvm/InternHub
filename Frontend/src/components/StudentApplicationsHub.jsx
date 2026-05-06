import { useEffect, useMemo, useState } from 'react'
import '../assets/styles/studentApplications.css'
import { APPLICATION_FILTERS, matchesApplicationFilter } from '../services/applicationStatus'
import {
  getStudentApplications,
  getStudentSavedOffers,
} from '../services/studentActivityService'
import { useUser } from '../services/userService'
import StudentApplicationsView from './StudentApplicationsView'

export default function StudentApplicationsHub() {
  const { currentUser } = useUser()
  const [activeSection, setActiveSection] = useState('applications')
  const [activeFilter, setActiveFilter] = useState('all')
  const [applications, setApplications] = useState([])
  const [savedOffers, setSavedOffers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const savedOfferIds = useMemo(
    () => (Array.isArray(currentUser?.savedOfferIds) ? currentUser.savedOfferIds : []),
    [currentUser?.savedOfferIds],
  )
  const savedOfferIdsSignature = savedOfferIds.join('|')

  useEffect(() => {
    let isMounted = true

    async function loadStudentActivity() {
      if (!currentUser?.uid) {
        if (isMounted) {
          setApplications([])
          setSavedOffers([])
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage('')

        const [applicationsResult, savedOffersResult] = await Promise.all([
          getStudentApplications(currentUser.uid),
          getStudentSavedOffers(savedOfferIds),
        ])

        if (!isMounted) {
          return
        }

        setApplications(applicationsResult)
        setSavedOffers(savedOffersResult)
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'No se pudo cargar tu actividad en este momento.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadStudentActivity()

    return () => {
      isMounted = false
    }
  }, [currentUser?.uid, savedOfferIds, savedOfferIdsSignature])

  const filteredApplications = useMemo(
    () =>
      applications.filter((application) =>
        matchesApplicationFilter(application.status, activeFilter),
      ),
    [activeFilter, applications],
  )

  return (
    <StudentApplicationsView
      currentUser={currentUser}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      applicationFilters={APPLICATION_FILTERS}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      applications={applications}
      filteredApplications={filteredApplications}
      savedOffers={savedOffers}
      isLoading={isLoading}
      errorMessage={errorMessage}
    />
  )
}
