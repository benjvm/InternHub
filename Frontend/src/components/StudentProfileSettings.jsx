import { useEffect, useRef, useState } from 'react'
import { deleteField } from 'firebase/firestore'
import '../assets/styles/studentProfileSettings.css'
import {
  getProfileImageUrl,
  uploadProfileImage,
} from '../services/cloudinaryService'
import { updateUserProfile } from '../services/profileService'
import { useUser } from '../services/userService'

const universities = ['Stanford University', 'MIT', 'UC Berkeley', 'Other']

const careerFocusOptions = [
  'Software Engineering',
  'Product Design',
  'Digital Marketing',
  'FinTech',
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function StudentProfileSettings() {
  const { currentUser, refreshUserProfile } = useUser()
  const fileInputRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    bio: '',
    universidad: '',
    carrera: '',
  })

  useEffect(() => {
    setFormData({
      nombre: currentUser?.nombre || '',
      apellido: currentUser?.apellido || '',
      bio: currentUser?.bio || '',
      universidad: currentUser?.universidad || '',
      carrera: currentUser?.carrera || currentUser?.careerFocus || currentUser?.carrerFocus || '',
    })
  }, [currentUser])

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview)
      }
    }
  }, [selectedImagePreview])

  const universityOptions = Array.from(
    new Set([formData.universidad, ...universities].filter(Boolean)),
  )
  const focusOptions = Array.from(
    new Set([formData.carrera, ...careerFocusOptions].filter(Boolean)),
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

    setFormData({
      nombre: currentUser?.nombre || '',
      apellido: currentUser?.apellido || '',
      bio: currentUser?.bio || '',
      universidad: currentUser?.universidad || '',
      carrera: currentUser?.carrera || currentUser?.careerFocus || currentUser?.carrerFocus || '',
    })
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
          publicId: `student-${currentUser?.uid}-${Date.now()}`,
        })

        uploadedImageUrl = uploadResult.url
      }

      await updateUserProfile(currentUser?.uid, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        bio: formData.bio,
        universidad: formData.universidad,
        carrera: formData.carrera,
        ...(uploadedImageUrl ? { photoURL: uploadedImageUrl } : {}),
        authEmail: deleteField(),
        careerFocus: deleteField(),
        carrerFocus: deleteField(),
      })

      await refreshUserProfile(currentUser?.uid)
      setSelectedImage(null)
      setSelectedImagePreview('')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setStatusMessage(
        uploadedImageUrl ? 'Profile and image saved successfully.' : 'Profile saved successfully.',
      )
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo guardar el perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="student-profile-page">
      <div className="container student-profile-shell">
        <section className="student-profile-header">
          <div className="student-profile-avatar-wrap">
            <div className="student-profile-avatar">
              <img src={displayedProfileImage} alt="Profile" />
            </div>
            <button
              type="button"
              className="student-profile-camera-button"
              onClick={handleImageButtonClick}
              aria-label="Upload profile photo"
              disabled={isSaving}
            >
              <Icon name="photo_camera" className="student-profile-camera-icon" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={handleImageChange}
            />
          </div>

          <h2>Student Profile</h2>
          <p>Update your information and keep your student profile synced with Firebase.</p>
          {selectedImage ? <p>Selected image ready to upload when you save the profile.</p> : null}
        </section>

        <section className="student-profile-card">
          <div className="student-profile-form-content">
            <form className="student-profile-form" onSubmit={handleSubmit} id="student-profile-form">
              <div className="student-profile-grid">
                <label className="student-profile-field">
                  <span>Name</span>
                  <input
                    name="nombre"
                    type="text"
                    placeholder="e.g. Alex"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="student-profile-field">
                  <span>Surname</span>
                  <input
                    name="apellido"
                    type="text"
                    placeholder="e.g. Johnson"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <label className="student-profile-field">
                <span>Bio</span>
                <textarea
                  name="bio"
                  rows="4"
                  placeholder="Tell us about your background, interests, and goals..."
                  value={formData.bio}
                  onChange={handleChange}
                  maxLength={300}
                />
                <small>{`${formData.bio.length} / 300 characters`}</small>
              </label>

              <div className="student-profile-grid">
                <label className="student-profile-field">
                  <span>University</span>
                  <div className="student-profile-select-wrap">
                    <select
                      name="universidad"
                      value={formData.universidad}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Select your institution
                      </option>
                      {universityOptions.map((university) => (
                        <option key={university} value={university}>
                          {university}
                        </option>
                      ))}
                    </select>
                    <Icon name="expand_more" className="student-profile-select-icon" />
                  </div>
                </label>

                <label className="student-profile-field">
                  <span>Carrera</span>
                  <div className="student-profile-select-wrap">
                    <select
                      name="carrera"
                      value={formData.carrera}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Selecciona tu carrera
                      </option>
                      {focusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <Icon name="expand_more" className="student-profile-select-icon" />
                  </div>
                </label>
              </div>
            </form>
          </div>

          <div className="student-profile-action-bar">
            <button
              type="button"
              className="student-profile-reset-button"
              onClick={handleReset}
              disabled={isSaving}
            >
              Reset Changes
            </button>
            <button
              type="submit"
              form="student-profile-form"
              className="student-profile-save-button"
              disabled={isSaving}
            >
              <Icon name="save" className="student-profile-save-icon" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          {statusMessage ? <p style={{ color: '#166534' }}>{statusMessage}</p> : null}
          {errorMessage ? <p style={{ color: '#b91c1c' }}>{errorMessage}</p> : null}
        </section>
      </div>
    </main>
  )
}
