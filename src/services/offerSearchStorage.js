const OFFER_SEARCH_STORAGE_KEY = 'internhub:offer-search'

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function readOfferSearch() {
  if (!canUseSessionStorage()) {
    return { term: '', city: '' }
  }

  try {
    const rawValue = window.sessionStorage.getItem(OFFER_SEARCH_STORAGE_KEY)

    if (!rawValue) {
      return { term: '', city: '' }
    }

    const parsedValue = JSON.parse(rawValue)

    return {
      term: typeof parsedValue.term === 'string' ? parsedValue.term : '',
      city: typeof parsedValue.city === 'string' ? parsedValue.city : '',
    }
  } catch {
    return { term: '', city: '' }
  }
}

export function saveOfferSearch(search) {
  if (!canUseSessionStorage()) {
    return
  }

  window.sessionStorage.setItem(
    OFFER_SEARCH_STORAGE_KEY,
    JSON.stringify({
      term: search?.term?.trim() ?? '',
      city: search?.city?.trim() ?? '',
    }),
  )
}
