import { useEffect } from 'react'
import { useUser } from '../services/userService'
import { appRoutes } from './routeConfig'
import { getDefaultRouteForRole, ROUTES } from './paths'
import { Link, matchPath, RouteParamsProvider, useRouter } from './router'

function RouteRedirect({ to, replace = false }) {
  const { navigate } = useRouter()

  useEffect(() => {
    navigate(to, { replace })
  }, [navigate, replace, to])

  return (
    <main style={routeStateStyle}>
      <p>Redirigiendo...</p>
    </main>
  )
}

function RouteState({ title, description, actionLabel, actionTo }) {
  return (
    <main style={routeStateStyle}>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
        {actionLabel && actionTo ? (
          <Link to={actionTo} style={routeActionStyle}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </main>
  )
}

function resolveRoute(pathname) {
  for (const route of appRoutes) {
    const params = matchPath(route.path, pathname)

    if (params) {
      return { ...route, params }
    }
  }

  return null
}

const routeStateStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: '2rem',
  textAlign: 'center',
}

const routeActionStyle = {
  display: 'inline-flex',
  marginTop: '1rem',
  padding: '0.85rem 1.25rem',
  borderRadius: '999px',
  background: '#0f172a',
  color: '#ffffff',
}

export default function AppRouter() {
  const { pathname } = useRouter()
  const { currentUser, loadingUser } = useUser()
  const activeRoute = resolveRoute(pathname)

  if (!activeRoute) {
    return (
      <RouteState
        title="Página no encontrada"
        description="No hemos podido encontrar la página que buscas."
        actionLabel="Volver al inicio"
        actionTo={ROUTES.home}
      />
    )
  }

  if (loadingUser && (activeRoute.protected || activeRoute.publicOnly)) {
    return <RouteState title="Cargando" description="Preparando tu sesión..." />
  }

  if (activeRoute.publicOnly && currentUser) {
    return <RouteRedirect to={getDefaultRouteForRole(currentUser.rol)} replace />
  }

  if (activeRoute.protected && !currentUser) {
    return <RouteRedirect to={ROUTES.login} replace />
  }

  if (
    activeRoute.roles &&
    currentUser &&
    !activeRoute.roles.includes(Number(currentUser.rol))
  ) {
    return (
      <RouteState
        title="Acceso restringido"
        description="Esta sección solo está disponible para el tipo de cuenta adecuado."
        actionLabel="Volver al inicio"
        actionTo={ROUTES.home}
      />
    )
  }

  const PageComponent = activeRoute.component

  return (
    <RouteParamsProvider params={activeRoute.params}>
      <PageComponent />
    </RouteParamsProvider>
  )
}
