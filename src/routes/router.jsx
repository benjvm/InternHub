/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

const RouterContext = createContext({
  pathname: '/',
  navigate: () => {},
})

const RouteParamsContext = createContext({})

function normalizePath(pathname) {
  if (!pathname || pathname === '/') {
    return '/'
  }

  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '')
  return cleanPath || '/'
}

function getCurrentPath() {
  if (typeof window === 'undefined') {
    return '/'
  }

  return normalizePath(window.location.pathname)
}

export function matchPath(pattern, pathname) {
  const normalizedPattern = normalizePath(pattern)
  const normalizedPathname = normalizePath(pathname)

  const patternSegments = normalizedPattern.split('/').filter(Boolean)
  const pathnameSegments = normalizedPathname.split('/').filter(Boolean)

  if (patternSegments.length !== pathnameSegments.length) {
    return null
  }

  const params = {}

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index]
    const pathnameSegment = pathnameSegments[index]

    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathnameSegment)
      continue
    }

    if (patternSegment !== pathnameSegment) {
      return null
    }
  }

  return params
}

export function RouterProvider({ children }) {
  const [pathname, setPathname] = useState(getCurrentPath)

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(getCurrentPath())
    }

    window.addEventListener('popstate', handleLocationChange)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  function navigate(to, options = {}) {
    if (!to) {
      return
    }

    const { replace = false } = options
    const targetPath = normalizePath(to)

    if (targetPath === pathname && !replace) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    window.history[replace ? 'replaceState' : 'pushState']({}, '', targetPath)
    setPathname(targetPath)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function RouteParamsProvider({ children, params }) {
  return <RouteParamsContext.Provider value={params}>{children}</RouteParamsContext.Provider>
}

export function useRouter() {
  return useContext(RouterContext)
}

export function useRouteParams() {
  return useContext(RouteParamsContext)
}

export function Link({ to, onClick, target, children, ...props }) {
  const { navigate } = useRouter()

  function handleClick(event) {
    onClick?.(event)

    if (
      event.defaultPrevented ||
      target === '_blank' ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return
    }

    if (/^(https?:|mailto:|tel:)/.test(to)) {
      return
    }

    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} onClick={handleClick} target={target} {...props}>
      {children}
    </a>
  )
}
