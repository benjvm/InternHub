import { useEffect, useMemo, useState } from 'react'
import '../assets/styles/companyCandidates.css'
import { getOffersByCompanyId } from '../services/offerService'
import { useUser } from '../services/userService'
import CompanyOffersView from './CompanyOffersView'

export default function CompanyOffersHub() {
  const { currentUser } = useUser()
  const [offers, setOffers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadCompanyOffers() {
      if (!currentUser?.uid) {
        if (isMounted) {
          setOffers([])
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage('')
        const nextOffers = await getOffersByCompanyId(currentUser.uid)

        if (!isMounted) {
          return
        }

        setOffers(nextOffers)
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'No se pudieron cargar tus ofertas.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCompanyOffers()

    return () => {
      isMounted = false
    }
  }, [currentUser?.uid])

  const publishedOffers = useMemo(
    () => offers.filter((offer) => offer.status !== 'draft'),
    [offers],
  )

  return (
    <CompanyOffersView
      currentUser={currentUser}
      offers={publishedOffers}
      isLoading={isLoading}
      errorMessage={errorMessage}
    />
  )
}
