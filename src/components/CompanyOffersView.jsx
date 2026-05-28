import { ROUTES } from '../routes/paths'
import { Link } from '../routes/router'
import CompanyPanelSidebar from './CompanyPanelSidebar'

function formatCreatedAt(createdAt) {
  if (createdAt?.seconds) {
    return new Date(createdAt.seconds * 1000).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (typeof createdAt === 'string') {
    const parsedDate = new Date(createdAt)

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    }
  }

  return 'Sin fecha'
}

function formatOfferLocation(offer) {
  if (offer?.ubicacion?.ciudad || offer?.ubicacion?.pais) {
    return [offer.ubicacion.ciudad, offer.ubicacion.pais].filter(Boolean).join(', ')
  }

  return offer.location || 'Ubicación no disponible'
}

function EmptyState() {
  return (
    <div className="company-candidates-empty-state">
      <h3>Aún no tienes ofertas publicadas</h3>
      <p>Publica tu primera oferta para empezar a recibir candidaturas de estudiantes.</p>
      <Link to={ROUTES.postOffer} className="company-candidates-primary-link compact">
        Publicar mi primera oferta
      </Link>
    </div>
  )
}

function OfferRow({ offer }) {
  return (
    <article className="company-candidates-row company-offers-row">
      <div className="company-offers-primary">
        <h3>{offer.title}</h3>
        <p>{offer.category || 'Categoría sin definir'}</p>
      </div>

      <div className="company-offers-secondary">
        <strong>{formatOfferLocation(offer)}</strong>
        <span>{offer.modality || 'Modalidad no indicada'}</span>
      </div>

      <div className="company-offers-date">{formatCreatedAt(offer.createdAt)}</div>

      <div className="company-offers-secondary">
        <strong>{offer.salary || 'Salario no indicado'}</strong>
        <span>{offer.companyName || 'Empresa'}</span>
      </div>

      <div className="company-offers-action">
        <Link to={ROUTES.internshipDetail(offer.id)} className="company-candidates-ghost-button">
          Ver detalle
        </Link>
      </div>
    </article>
  )
}

export default function CompanyOffersView({ currentUser, offers, isLoading, errorMessage }) {
  return (
    <main className="company-candidates-page">
      <div className="container company-candidates-shell">
        <CompanyPanelSidebar currentUser={currentUser} activeSection="offers" />

        <section className="company-candidates-content">
          <header className="company-candidates-heading">
            <p className="company-candidates-heading-kicker">Panel de empresa</p>
            <h1>Mis ofertas</h1>
            <p>
              Revisa todas las ofertas activas que has publicado y entra en cada una para ver su
              detalle.
            </p>
          </header>

          <div className="company-candidates-toolbar">
            <Link to={ROUTES.postOffer} className="company-candidates-primary-link">
              Crear nueva oferta
            </Link>

            <div className="company-candidates-count-pill">
              {offers.length} oferta{offers.length === 1 ? '' : 's'} publicada
              {offers.length === 1 ? '' : 's'}
            </div>
          </div>

          {errorMessage ? <p className="company-candidates-feedback error">{errorMessage}</p> : null}
          {isLoading ? <p className="company-candidates-feedback">Cargando ofertas...</p> : null}

          {!isLoading ? (
            offers.length ? (
              <div className="company-candidates-table">
                <div className="company-candidates-table-head company-offers-table-head">
                  <span>Oferta</span>
                  <span>Ubicación</span>
                  <span>Publicada</span>
                  <span>Compensación</span>
                  <span>Acciones</span>
                </div>

                <div className="company-candidates-table-body">
                  {offers.map((offer) => (
                    <OfferRow key={offer.id} offer={offer} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState />
            )
          ) : null}
        </section>
      </div>
    </main>
  )
}
