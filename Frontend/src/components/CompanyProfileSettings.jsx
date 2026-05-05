import { useEffect, useMemo, useState } from 'react'
import { deleteField } from 'firebase/firestore'
import '../assets/styles/companyProfileSettings.css'
import { logoutUser } from '../services/authService'
import { ROUTES } from '../routes/paths'
import { useRouter } from '../routes/router'
import { deleteUserAccount, updateUserProfile } from '../services/profileService'
import { useUser } from '../services/userService'

const sectorOptions = [
  'Technology & Software',
  'Finance & Banking',
  'Healthcare',
  'Education',
  'Marketing & Creative',
  'Manufacturing',
  'Consulting',
]

const sectorLabels = {
  'Technology & Software': 'Tecnología y software',
  'Finance & Banking': 'Finanzas y banca',
  Healthcare: 'Salud',
  Education: 'Educación',
  'Marketing & Creative': 'Marketing y creatividad',
  Manufacturing: 'Manufactura',
  Consulting: 'Consultoría',
}

const locationTypeOptions = [
  { value: 'Office', label: 'Oficina' },
  { value: 'Factory', label: 'Fábrica' },
  { value: 'Remote Hub', label: 'Centro remoto' },
  { value: 'Warehouse', label: 'Almacén' },
]

const locationTypeLabels = Object.fromEntries(
  locationTypeOptions.map((option) => [option.value, option.label]),
)

const emptyLocation = {
  id: '',
  nombre: '',
  ciudad: '',
  pais: '',
  latitud: '',
  longitud: '',
  tipo: locationTypeOptions[0].value,
}

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

function getCompanyDescription(user) {
  return user?.descripcionEmpresa || user?.description || user?.companyDescription || ''
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

function getInitialFormData(user) {
  return {
    nombreEmpresa: user?.nombreEmpresa || user?.companyName || user?.company_name || '',
    sector: user?.sector || '',
    email: user?.email || user?.hr_email || '',
    descripcionEmpresa: getCompanyDescription(user),
  }
}

function cleanLocation(location) {
  return {
    id: location.id || `location-${Date.now()}`,
    nombre: location.nombre.trim(),
    ciudad: location.ciudad.trim(),
    pais: location.pais.trim(),
    latitud: Number(location.latitud),
    longitud: Number(location.longitud),
    tipo: location.tipo,
  }
}

export default function CompanyProfileSettings() {
  const { currentUser, refreshUserProfile } = useUser()
  const { navigate } = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState(() => getInitialFormData(currentUser))
  const [locations, setLocations] = useState(() => getCompanyLocations(currentUser))
  const [locationDraft, setLocationDraft] = useState(emptyLocation)
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false)
  const [editingLocationId, setEditingLocationId] = useState('')

  useEffect(() => {
    setFormData(getInitialFormData(currentUser))
    setLocations(getCompanyLocations(currentUser))
    setLocationDraft(emptyLocation)
    setIsLocationFormOpen(false)
    setEditingLocationId('')
  }, [currentUser])

  const sectors = useMemo(
    () => Array.from(new Set([formData.sector, ...sectorOptions].filter(Boolean))),
    [formData.sector],
  )

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleLocationChange(event) {
    const { name, value } = event.target

    setLocationDraft((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleOpenLocationForm() {
    setLocationDraft({
      ...emptyLocation,
      id: `location-${Date.now()}`,
    })
    setEditingLocationId('')
    setIsLocationFormOpen(true)
    setStatusMessage('')
    setErrorMessage('')
  }

  function handleEditLocation(location) {
    setLocationDraft({
      ...location,
      latitud: String(location.latitud),
      longitud: String(location.longitud),
    })
    setEditingLocationId(location.id)
    setIsLocationFormOpen(true)
    setStatusMessage('')
    setErrorMessage('')
  }

  function handleDeleteLocation(locationId) {
    setLocations((current) => current.filter((location) => location.id !== locationId))

    if (editingLocationId === locationId) {
      setLocationDraft(emptyLocation)
      setEditingLocationId('')
      setIsLocationFormOpen(false)
    }
  }

  function handleCancelLocation() {
    setLocationDraft(emptyLocation)
    setEditingLocationId('')
    setIsLocationFormOpen(false)
  }

  function handleSaveLocation() {
    setErrorMessage('')
    setStatusMessage('')

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

    setLocations((current) => {
      if (editingLocationId) {
        return current.map((location) =>
          location.id === editingLocationId ? normalizedLocation : location,
        )
      }

      return [...current, normalizedLocation]
    })

    setLocationDraft(emptyLocation)
    setEditingLocationId('')
    setIsLocationFormOpen(false)
  }

  function handleReset() {
    setStatusMessage('')
    setErrorMessage('')
    setFormData(getInitialFormData(currentUser))
    setLocations(getCompanyLocations(currentUser))
    setLocationDraft(emptyLocation)
    setIsLocationFormOpen(false)
    setEditingLocationId('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setStatusMessage('')
    setIsSaving(true)

    try {
      await updateUserProfile(currentUser?.uid, {
        nombreEmpresa: formData.nombreEmpresa,
        sector: formData.sector,
        email: formData.email,
        descripcionEmpresa: formData.descripcionEmpresa,
        ubicaciones: locations.map(cleanLocation),
        companyName: deleteField(),
        company_name: deleteField(),
        companyDescription: deleteField(),
        description: deleteField(),
        hr_email: deleteField(),
        officeLocations: deleteField(),
        locations: deleteField(),
      })

      await refreshUserProfile(currentUser?.uid)
      setStatusMessage('Perfil de empresa guardado correctamente.')
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo guardar el perfil de empresa.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar tu cuenta? Esta acción borrará tu perfil y no se puede deshacer.',
    )

    if (!confirmed) {
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setIsDeletingAccount(true)

    try {
      await deleteUserAccount(currentUser?.uid)
      await logoutUser()
      navigate(ROUTES.home, { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo eliminar la cuenta.')
      setIsDeletingAccount(false)
    }
  }

  return (
    <main className="company-profile-page">
      <div className="container company-profile-shell">
        <header className="company-profile-header">
          <h1>Configuración del perfil de empresa</h1>
          <p>Gestiona la información pública de tu organización y la presencia de sus sedes.</p>
        </header>

        <form className="company-profile-form" id="company-profile-form" onSubmit={handleSubmit}>
          <section className="company-profile-card">
            <div className="company-profile-section-title">
              <div>
                <Icon name="business" className="company-profile-section-icon" />
                <h2>Información general</h2>
              </div>
            </div>

            <div className="company-profile-grid">
              <label className="company-profile-field" htmlFor="nombreEmpresa">
                <span>Nombre de la empresa</span>
                <input
                  id="nombreEmpresa"
                  name="nombreEmpresa"
                  type="text"
                  placeholder="InternHub Inc."
                  value={formData.nombreEmpresa}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="company-profile-field" htmlFor="sector">
                <span>Sector</span>
                <div className="company-profile-select-wrap">
                  <select
                    id="sector"
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Selecciona un sector
                    </option>
                    {sectors.map((sector) => (
                      <option key={sector} value={sector}>
                        {sectorLabels[sector] || sector}
                      </option>
                    ))}
                  </select>
                  <Icon name="expand_more" className="company-profile-select-icon" />
                </div>
              </label>

              <label className="company-profile-field company-profile-full" htmlFor="email">
                <span>Correo electrónico</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="hr@internhub.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <small>Este correo se usará para comunicarte con las personas candidatas.</small>
              </label>

              <label
                className="company-profile-field company-profile-full"
                htmlFor="descripcionEmpresa"
              >
                <span>Descripción de la empresa</span>
                <textarea
                  id="descripcionEmpresa"
                  name="descripcionEmpresa"
                  rows="5"
                  placeholder="Cuenta a los estudiantes cuál es la cultura de tu empresa, su misión y por qué deberían unirse..."
                  value={formData.descripcionEmpresa}
                  onChange={handleChange}
                  maxLength={700}
                />
                <small>{`${formData.descripcionEmpresa.length} / 700 caracteres`}</small>
              </label>
            </div>
          </section>

          <section className="company-profile-card">
            <div className="company-profile-section-title">
              <div>
                <Icon name="location_on" className="company-profile-section-icon" />
                <h2>Ubicaciones de la empresa</h2>
              </div>

              <button
                className="company-profile-add-location-button"
                type="button"
                onClick={handleOpenLocationForm}
              >
                <Icon name="add" className="company-profile-button-icon" />
                Añadir ubicación
              </button>
            </div>

            <div className="company-profile-location-list">
              {locations.length ? (
                locations.map((location) => (
                  <article className="company-profile-location-item" key={location.id}>
                    <div className="company-profile-location-main">
                      <div className="company-profile-location-icon">
                        <Icon name="apartment" />
                      </div>
                      <div>
                        <h3>{location.nombre}</h3>
                        <p>
                          {location.ciudad}, {location.pais}
                        </p>
                        <div className="company-profile-location-meta">
                          <span>Lat: {location.latitud}</span>
                          <span>Long: {location.longitud}</span>
                          <span className="company-profile-location-type">
                            {locationTypeLabels[location.tipo] || location.tipo}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="company-profile-location-actions">
                      <button
                        type="button"
                        className="company-profile-icon-button"
                        onClick={() => handleEditLocation(location)}
                        aria-label={`Editar ${location.nombre}`}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        type="button"
                        className="company-profile-icon-button danger"
                        onClick={() => handleDeleteLocation(location.id)}
                        aria-label={`Eliminar ${location.nombre}`}
                      >
                        <Icon name="delete" />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="company-profile-empty-state">
                  <Icon name="add_location_alt" />
                  <p>Añade al menos una ubicación para mostrar a los estudiantes dónde trabaja tu equipo.</p>
                </div>
              )}

              {isLocationFormOpen ? (
                <div className="company-profile-location-editor">
                  <h3>
                    <Icon name={editingLocationId ? 'edit_location_alt' : 'add_circle'} />
                    {editingLocationId ? 'Editar ubicación' : 'Nueva ubicación'}
                  </h3>

                  <div className="company-profile-location-grid">
                    <label className="company-profile-field compact" htmlFor="location-name">
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

                    <label className="company-profile-field compact" htmlFor="location-city">
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

                    <label className="company-profile-field compact" htmlFor="location-country">
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

                    <label className="company-profile-field compact" htmlFor="location-latitude">
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

                    <label className="company-profile-field compact" htmlFor="location-longitude">
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

                    <label className="company-profile-field compact" htmlFor="location-type">
                      <span>Tipo</span>
                      <div className="company-profile-select-wrap">
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
                        <Icon name="expand_more" className="company-profile-select-icon" />
                      </div>
                    </label>
                  </div>

                  <div className="company-profile-location-editor-actions">
                    <button
                      type="button"
                      className="company-profile-text-button"
                      onClick={handleCancelLocation}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="company-profile-light-button"
                      onClick={handleSaveLocation}
                    >
                      Guardar ubicación
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </form>

        <div className="company-profile-action-bar">
          <div className="company-profile-messages">
            {statusMessage ? <p className="company-profile-success">{statusMessage}</p> : null}
            {errorMessage ? (
              <p className="company-profile-error" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <div className="company-profile-action-buttons">
            <button
              type="button"
              className="company-profile-reset-button"
              onClick={handleReset}
              disabled={isSaving || isDeletingAccount}
            >
              Descartar cambios
            </button>
            <button
              type="button"
              className="company-profile-delete-button"
              onClick={handleDeleteAccount}
              disabled={isSaving || isDeletingAccount}
            >
              {isDeletingAccount ? 'Eliminando cuenta...' : 'Eliminar cuenta'}
            </button>
            <button
              type="submit"
              form="company-profile-form"
              className="company-profile-save-button"
              disabled={isSaving || isDeletingAccount}
            >
              <Icon name="save" className="company-profile-button-icon" />
              {isSaving ? 'Guardando...' : 'Guardar cambios del perfil'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
