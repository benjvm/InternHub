import { useEffect, useMemo, useRef, useState } from 'react'
import { deleteField } from 'firebase/firestore'
import '../assets/styles/teacherProfileSettings.css'
import {
  getProfileImageUrl,
  uploadProfileImage,
} from '../services/cloudinaryService'
import { updateUserProfile } from '../services/profileService'
import { useUser } from '../services/userService'

const educationalAreas = [
  'Facultad de Bellas Artes',
  'Departamento de Informática',
  'Empresa y Economía',
  'Facultad de Humanidades',
  'Ciencias de la Salud',
  'Ingeniería',
]

const educationalAreaLabels = {
  'Faculty of Fine Arts': 'Facultad de Bellas Artes',
  'Department of Computer Science': 'Departamento de Informática',
  'Business & Economics': 'Empresa y Economía',
  'School of Humanities': 'Facultad de Humanidades',
  'Health Sciences': 'Ciencias de la Salud',
  Engineering: 'Ingeniería',
}

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

function getInitialFormData(user) {
  return {
    nombreCompleto: user?.nombreCompleto || user?.full_name || user?.fullName || '',
    correo: user?.correo || user?.email || '',
    telefono: user?.telefono || user?.phone || '',
    areaEducativa: user?.areaEducativa || user?.edu_area || user?.educationalArea || '',
  }
}

export default function TeacherProfileSettings() {
  const { currentUser, refreshUserProfile } = useUser()
  const fileInputRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState('')
  const [formData, setFormData] = useState(() => getInitialFormData(currentUser))

  useEffect(() => {
    setFormData(getInitialFormData(currentUser))
  }, [currentUser])

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview)
      }
    }
  }, [selectedImagePreview])

  const areaOptions = useMemo(
    () => Array.from(new Set([formData.areaEducativa, ...educationalAreas].filter(Boolean))),
    [formData.areaEducativa],
  )
  const displayedProfileImage = selectedImagePreview || getProfileImageUrl(currentUser)

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleReset() {
    setStatusMessage('')
    setErrorMessage('')
    setSelectedImage(null)
    setSelectedImagePreview('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setFormData(getInitialFormData(currentUser))
  }

  function handleImageButtonClick() {
    fileInputRef.current?.click()
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setStatusMessage('')
    setErrorMessage('')
    setSelectedImage(file)
    setSelectedImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setStatusMessage('')
    setIsSaving(true)

    try {
      let uploadedImageUrl = null

      if (selectedImage) {
        const uploadResult = await uploadProfileImage(selectedImage, {
          publicId: `teacher-${currentUser?.uid}-${Date.now()}`,
        })

        uploadedImageUrl = uploadResult.url
      }

      await updateUserProfile(currentUser?.uid, {
        nombreCompleto: formData.nombreCompleto,
        correo: formData.correo,
        telefono: formData.telefono,
        areaEducativa: formData.areaEducativa,
        ...(uploadedImageUrl ? { photoURL: uploadedImageUrl } : {}),
        full_name: deleteField(),
        fullName: deleteField(),
        email: deleteField(),
        phone: deleteField(),
        edu_area: deleteField(),
        educationalArea: deleteField(),
        authEmail: deleteField(),
      })

      await refreshUserProfile(currentUser?.uid)
      setSelectedImage(null)
      setSelectedImagePreview('')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setStatusMessage(
        uploadedImageUrl
          ? 'Perfil de profesor e imagen guardados correctamente.'
          : 'Perfil de profesor guardado correctamente.',
      )
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo guardar el perfil de profesor.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="teacher-profile-page">
      <section className="container teacher-profile-hero">
        <div className="teacher-profile-avatar-wrap">
          <div className="teacher-profile-avatar">
            <img src={displayedProfileImage} alt="Perfil" />
          </div>
          <button
            type="button"
            className="teacher-profile-edit-photo-button"
            aria-label="Editar foto"
            onClick={handleImageButtonClick}
            disabled={isSaving}
          >
            <Icon name="edit" className="teacher-profile-edit-photo-icon" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleImageChange}
          />
        </div>

        <h1>Perfil del profesor</h1>
        <p>
          Gestiona tus credenciales académicas y tu información de contacto para acompañar
          mejor a tu grupo de estudiantes.
        </p>
        {selectedImage ? <p>La imagen seleccionada se subirá cuando guardes el perfil.</p> : null}
      </section>

      <section className="container teacher-profile-shell">
        <article className="teacher-profile-card">
          <form
            className="teacher-profile-form"
            id="teacher-profile-form"
            onSubmit={handleSubmit}
          >
            <label className="teacher-profile-field" htmlFor="nombreCompleto">
              <span>Nombre completo</span>
              <input
                id="nombreCompleto"
                name="nombreCompleto"
                type="text"
                placeholder="Dr. Alexander Sterling"
                value={formData.nombreCompleto}
                onChange={handleChange}
                required
              />
            </label>

            <label className="teacher-profile-field" htmlFor="correo">
              <span>Correo electrónico</span>
              <input
                id="correo"
                name="correo"
                type="email"
                placeholder="a.sterling@academic-atelier.edu"
                value={formData.correo}
                onChange={handleChange}
                required
              />
            </label>

            <label className="teacher-profile-field" htmlFor="telefono">
              <span>Teléfono</span>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="+34 600 000 000"
                value={formData.telefono}
                onChange={handleChange}
                required
              />
            </label>

            <label className="teacher-profile-field" htmlFor="areaEducativa">
              <span>Área educativa</span>
              <div className="teacher-profile-select-wrap">
                <select
                  id="areaEducativa"
                  name="areaEducativa"
                  value={formData.areaEducativa}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Selecciona departamento o facultad
                  </option>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>
                      {educationalAreaLabels[area] || area}
                    </option>
                  ))}
                </select>
                <Icon name="expand_more" className="teacher-profile-select-icon" />
              </div>
            </label>
          </form>

          <div className="teacher-profile-action-bar">
            <button
              type="submit"
              form="teacher-profile-form"
              className="teacher-profile-save-button"
              disabled={isSaving}
            >
              <Icon name="save" className="teacher-profile-save-icon" />
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              className="teacher-profile-reset-button"
              onClick={handleReset}
              disabled={isSaving}
            >
              Descartar
            </button>
          </div>

          {statusMessage ? <p className="teacher-profile-success">{statusMessage}</p> : null}
          {errorMessage ? (
            <p className="teacher-profile-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </article>
      </section>
    </main>
  )
}
