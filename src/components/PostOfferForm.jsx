import { useMemo, useState } from 'react'
import '../assets/styles/postOffer.css'
import { ROUTES } from '../routes/paths'
import { Link, useRouter } from '../routes/router'
import { createOffer } from '../services/offerService'
import { useUser } from '../services/userService'

const categoryOptions = [
  { value: 'Engineering', label: 'Ingeniería' },
  { value: 'Design', label: 'Diseño' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Ventas' },
  { value: 'Data Science', label: 'Ciencia de datos' },
  { value: 'Finance', label: 'Finanzas' },
]

const modalities = [
  { id: 'Remote', label: 'Remoto' },
  { id: 'On-site', label: 'Presencial' },
  { id: 'Hybrid', label: 'Híbrido' },
]

const toolbarActions = ['format_bold', 'format_italic', 'format_list_bulleted', 'link']

const locationTypeOptions = [
  { value: 'Office', label: 'Oficina' },
  { value: 'Factory', label: 'Fábrica' },
  { value: 'Remote Hub', label: 'Centro remoto' },
  { value: 'Warehouse', label: 'Almacén' },
]

const emptyLocation = {
  id: '',
  nombre: '',
  ciudad: '',
  pais: '',
  latitud: '',
  longitud: '',
  tipo: locationTypeOptions[0].value,
}

const maxResponsibilities = 5

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

function getCompanyLocations(user) {
  const locations = user?.ubicaciones || user?.officeLocations || user?.locations || []

  if (!Array.isArray(locations)) {
    return []
  }

  return locations.map((location, index) => ({
    id: location.id || `location-${index}`,
    nombre: location.nombre || location.name || '',
    ciudad: location.ciudad || location.city || '',
    pais: location.pais || location.country || '',
    latitud: location.latitud ?? location.latitude ?? '',
    longitud: location.longitud ?? location.longitude ?? '',
    tipo: location.tipo || location.label || location.type || locationTypeOptions[0].value,
  }))
}

function cleanLocation(location) {
  return {
    id: location.id || `offer-location-${Date.now()}`,
    nombre: location.nombre.trim(),
    ciudad: location.ciudad.trim(),
    pais: location.pais.trim(),
    latitud: Number(location.latitud),
    longitud: Number(location.longitud),
    tipo: location.tipo,
  }
}

function formatLocationLabel(location) {
  if (!location) {
    return ''
  }

  return [location.nombre, location.ciudad, location.pais].filter(Boolean).join(' - ')
}

export default function PostOfferForm() {
  const { currentUser } = useUser()
  const { navigate } = useRouter()
  const companyLocations = useMemo(() => getCompanyLocations(currentUser), [currentUser])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [locationDraft, setLocationDraft] = useState(emptyLocation)
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    locationId: '',
    offerLocation: null,
    salary: '',
    modality: modalities[0].id,
    responsibilities: [''],
  })

  const locationOptions = useMemo(() => {
    if (
      formData.offerLocation &&
      !companyLocations.some((location) => location.id === formData.offerLocation.id)
    ) {
      return [...companyLocations, formData.offerLocation]
    }

    return companyLocations
  }, [companyLocations, formData.offerLocation])

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleLocationSelect(event) {
    const selectedLocation =
      locationOptions.find((location) => location.id === event.target.value) ?? null

    setFormData((current) => ({
      ...current,
      locationId: selectedLocation?.id ?? '',
      location: formatLocationLabel(selectedLocation),
      offerLocation: selectedLocation,
    }))
  }

  function handleLocationChange(event) {
    const { name, value } = event.target

    setLocationDraft((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleResponsibilityChange(index, value) {
    setFormData((current) => ({
      ...current,
      responsibilities: current.responsibilities.map((responsibility, responsibilityIndex) =>
        responsibilityIndex === index ? value : responsibility,
      ),
    }))
  }

  function handleAddResponsibility() {
    setFormData((current) => {
      if (current.responsibilities.length >= maxResponsibilities) {
        return current
      }

      return {
        ...current,
        responsibilities: [...current.responsibilities, ''],
      }
    })
  }

  function handleRemoveResponsibility(index) {
    setFormData((current) => {
      if (current.responsibilities.length === 1) {
        return {
          ...current,
          responsibilities: [''],
        }
      }

      return {
        ...current,
        responsibilities: current.responsibilities.filter(
          (_, responsibilityIndex) => responsibilityIndex !== index,
        ),
      }
    })
  }

  function handleOpenLocationForm() {
    setLocationDraft({
      ...emptyLocation,
      id: `offer-location-${Date.now()}`,
    })
    setIsLocationFormOpen(true)
    setErrorMessage('')
  }

  function handleCancelLocation() {
    setLocationDraft(emptyLocation)
    setIsLocationFormOpen(false)
  }

  function handleSaveLocation() {
    setErrorMessage('')

    if (
      !locationDraft.nombre.trim() ||
      !locationDraft.ciudad.trim() ||
      !locationDraft.pais.trim() ||
      locationDraft.latitud === '' ||
      locationDraft.longitud === ''
    ) {
      setErrorMessage('Completa todos los datos de la sede antes de guardarla.')
      return
    }

    const latitude = Number(locationDraft.latitud)
    const longitude = Number(locationDraft.longitud)

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setErrorMessage('La latitud y longitud deben ser valores numéricos.')
      return
    }

    const normalizedLocation = cleanLocation(locationDraft)

    setFormData((current) => ({
      ...current,
      locationId: normalizedLocation.id,
      location: formatLocationLabel(normalizedLocation),
      offerLocation: normalizedLocation,
    }))
    setLocationDraft(emptyLocation)
    setIsLocationFormOpen(false)
  }

  async function submitOffer(status) {
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const selectedLocation =
        formData.offerLocation ||
        locationOptions.find((location) => location.id === formData.locationId)

      if (!selectedLocation) {
        throw new Error('Selecciona una ubicación o añade una ubicación específica para la oferta.')
      }

      const normalizedResponsibilities = formData.responsibilities
        .map((responsibility) => responsibility.trim())
        .filter(Boolean)

      if (!normalizedResponsibilities.length) {
        throw new Error('Añade al menos una responsabilidad para la oferta.')
      }

      const offerFormData = { ...formData }
      delete offerFormData.offerLocation

      const createdOffer = await createOffer({
        ...offerFormData,
        responsibilities: normalizedResponsibilities,
        location: formatLocationLabel(selectedLocation),
        locationId: selectedLocation.id,
        ubicacion: selectedLocation,
        status,
        companyId: currentUser?.uid,
        companyName: currentUser?.nombreEmpresa || currentUser?.email,
      })

      navigate(ROUTES.internshipDetail(createdOffer.id), { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo guardar la oferta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await submitOffer('published')
  }

  return (
    <main className="post-offer-page">
      <div className="container post-offer-shell">
        <div className="post-offer-header">
          <h1>Publicar oferta</h1>
          <p>Encuentra a tu próximo talento joven completando los detalles a continuación.</p>
        </div>

        <section className="post-offer-card">
          <form className="post-offer-form" onSubmit={handleSubmit}>
            <label className="post-offer-field" htmlFor="title">
              <span>Título de la oferta</span>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Ej. Becario/a de Ingeniería de Software"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className="post-offer-field" htmlFor="category">
              <span>Categoría</span>
              <div className="post-offer-select-wrap">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Selecciona una categoría
                  </option>
                  {categoryOptions.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <Icon name="expand_more" className="post-offer-select-icon" />
              </div>
            </label>

            <div className="post-offer-field">
              <span>Descripción</span>
              <div className="post-offer-editor">
                <div className="post-offer-toolbar">
                  {toolbarActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      className="post-offer-toolbar-button"
                      aria-label={action}
                    >
                      <Icon name={action} className="post-offer-toolbar-icon" />
                    </button>
                  ))}
                </div>
                <textarea
                  id="description"
                  name="description"
                  rows="8"
                  placeholder="Describe las responsabilidades, requisitos y beneficios..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="post-offer-field">
              <div className="post-offer-responsibility-header">
                <span>Responsabilidades</span>
                <button
                  type="button"
                  className="post-offer-add-location-button"
                  onClick={handleAddResponsibility}
                  disabled={formData.responsibilities.length >= maxResponsibilities}
                >
                  <Icon name="add" className="post-offer-button-icon" />
                  Añadir responsabilidad
                </button>
              </div>

              <div className="post-offer-responsibility-list">
                {formData.responsibilities.map((responsibility, index) => (
                  <div key={`responsibility-${index}`} className="post-offer-responsibility-item">
                    <div className="post-offer-input-icon-wrap">
                      <Icon name="task_alt" className="post-offer-input-icon" />
                      <input
                        type="text"
                        placeholder={`Responsabilidad ${index + 1}`}
                        value={responsibility}
                        onChange={(event) => handleResponsibilityChange(index, event.target.value)}
                        required={index === 0}
                      />
                    </div>

                    <button
                      type="button"
                      className="post-offer-text-button"
                      onClick={() => handleRemoveResponsibility(index)}
                      disabled={formData.responsibilities.length === 1}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              <small className="post-offer-responsibility-help">
                Añade entre 1 y 5 responsabilidades para mostrarlas en el detalle de la oferta.
              </small>
            </div>

            <div className="post-offer-two-column">
              <div className="post-offer-field">
                <div className="post-offer-location-header">
                  <span>Ubicación</span>
                  <button
                    className="post-offer-add-location-button"
                    type="button"
                    onClick={handleOpenLocationForm}
                  >
                    <Icon name="add" className="post-offer-button-icon" />
                    Añadir ubicación
                  </button>
                </div>
                <div className="post-offer-select-wrap">
                  <select
                    id="locationId"
                    name="locationId"
                    value={formData.locationId}
                    onChange={handleLocationSelect}
                    disabled={!locationOptions.length}
                  >
                    <option value="" disabled>
                      {locationOptions.length
                        ? 'Selecciona una ubicación guardada'
                        : 'No hay ubicaciones guardadas'}
                    </option>
                    {locationOptions.map((location) => (
                      <option key={location.id} value={location.id}>
                        {formatLocationLabel(location)}
                      </option>
                    ))}
                  </select>
                  <Icon name="expand_more" className="post-offer-select-icon" />
                </div>
              </div>

              <label className="post-offer-field" htmlFor="salary">
                <span>Salario</span>
                <div className="post-offer-input-icon-wrap">
                  <Icon name="payments" className="post-offer-input-icon" />
                  <input
                    id="salary"
                    name="salary"
                    type="text"
                    placeholder="Ej. 900 EUR / mes"
                    value={formData.salary}
                    onChange={handleChange}
                    required
                  />
                </div>
              </label>
            </div>

            {isLocationFormOpen ? (
              <div className="post-offer-location-editor">
                <h3>
                  <Icon name="add_circle" />
                  Detalles de la nueva ubicación
                </h3>

                <div className="post-offer-location-grid">
                  <label className="post-offer-field compact" htmlFor="location-name">
                    <span>Nombre</span>
                    <input
                      id="location-name"
                      name="nombre"
                      type="text"
                      placeholder="Ej. Hub de Ingeniería"
                      value={locationDraft.nombre}
                      onChange={handleLocationChange}
                    />
                  </label>

                  <label className="post-offer-field compact" htmlFor="location-city">
                    <span>Ciudad</span>
                    <input
                      id="location-city"
                      name="ciudad"
                      type="text"
                      placeholder="Madrid"
                      value={locationDraft.ciudad}
                      onChange={handleLocationChange}
                    />
                  </label>

                  <label className="post-offer-field compact" htmlFor="location-country">
                    <span>País</span>
                    <input
                      id="location-country"
                      name="pais"
                      type="text"
                      placeholder="España"
                      value={locationDraft.pais}
                      onChange={handleLocationChange}
                    />
                  </label>

                  <label className="post-offer-field compact" htmlFor="location-latitude">
                    <span>Latitud</span>
                    <input
                      id="location-latitude"
                      name="latitud"
                      type="number"
                      step="any"
                      placeholder="51.5074"
                      value={locationDraft.latitud}
                      onChange={handleLocationChange}
                    />
                  </label>

                  <label className="post-offer-field compact" htmlFor="location-longitude">
                    <span>Longitud</span>
                    <input
                      id="location-longitude"
                      name="longitud"
                      type="number"
                      step="any"
                      placeholder="-0.1278"
                      value={locationDraft.longitud}
                      onChange={handleLocationChange}
                    />
                  </label>

                  <label className="post-offer-field compact" htmlFor="location-type">
                    <span>Tipo</span>
                    <div className="post-offer-select-wrap">
                      <select
                        id="location-type"
                        name="tipo"
                        value={locationDraft.tipo}
                        onChange={handleLocationChange}
                      >
                        {locationTypeOptions.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <Icon name="expand_more" className="post-offer-select-icon" />
                    </div>
                  </label>
                </div>

                <p className="post-offer-coordinate-help">
                  <span>¿No encuentras las coordenadas?</span>{' '}
                  <a
                    href="https://www.coordenadas-gps.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    https://www.coordenadas-gps.com/
                  </a>
                </p>

                <div className="post-offer-location-editor-actions">
                  <button
                    type="button"
                    className="post-offer-text-button"
                    onClick={handleCancelLocation}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="post-offer-light-button"
                    onClick={handleSaveLocation}
                  >
                    Guardar ubicación
                  </button>
                </div>
              </div>
            ) : null}

            <fieldset className="post-offer-modality-group">
              <legend>Modalidad</legend>
              <div className="post-offer-pills">
                {modalities.map((modality) => (
                  <div key={modality.id} className="post-offer-pill-item">
                    <input
                      id={modality.id}
                      checked={formData.modality === modality.id}
                      type="radio"
                      name="modality"
                      value={modality.id}
                      onChange={handleChange}
                    />
                    <label htmlFor={modality.id}>{modality.label}</label>
                  </div>
                ))}
              </div>
            </fieldset>

            {errorMessage ? (
              <p role="alert" style={{ color: '#b91c1c', margin: 0 }}>
                {errorMessage}
              </p>
            ) : null}

            <div className="post-offer-actions">
              <button
                type="button"
                className="post-offer-secondary-button"
                onClick={() => submitOffer('draft')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar como borrador'}
              </button>
              <button type="submit" className="post-offer-primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Publicando...' : 'Publicar oferta'}
              </button>
            </div>
          </form>
        </section>

        <p className="post-offer-help">
          ¿Necesitas ayuda? Siempre puedes volver a la <Link to={ROUTES.home}>página de inicio</Link>.
        </p>
      </div>
    </main>
  )
}
