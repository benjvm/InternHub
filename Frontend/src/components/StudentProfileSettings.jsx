import { useEffect, useRef, useState } from 'react'
import { deleteField } from 'firebase/firestore'
import '../assets/styles/studentProfileSettings.css'
import {
  getCvDocumentUrl,
  getProfileImageUrl,
  uploadCvPdf,
  uploadProfileImage,
} from '../services/cloudinaryService'
import {
  buildStudentCvQuestions,
  createInitialCvAnswers,
  createStudentCvPdfBlob,
  generateStudentCvContent,
  getStudentCvFileName,
} from '../services/AiService'
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

function createProfileFormData(user) {
  return {
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    bio: user?.bio || '',
    universidad: user?.universidad || '',
    carrera: user?.carrera || user?.careerFocus || user?.carrerFocus || '',
  }
}

function downloadBlobFile(blob, fileName) {
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = fileName
  link.click()
  URL.revokeObjectURL(downloadUrl)
}

export default function StudentProfileSettings() {
  const { currentUser, refreshUserProfile } = useUser()
  const fileInputRef = useRef(null)
  const cvInputRef = useRef(null)
  const cvQuestions = buildStudentCvQuestions()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingCv, setIsUploadingCv] = useState(false)
  const [isGeneratingCv, setIsGeneratingCv] = useState(false)
  const [isCvModalOpen, setIsCvModalOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [cvStatusMessage, setCvStatusMessage] = useState('')
  const [cvErrorMessage, setCvErrorMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState('')
  const [selectedCvFile, setSelectedCvFile] = useState(null)
  const [formData, setFormData] = useState(createProfileFormData())
  const [aiCvAnswers, setAiCvAnswers] = useState(createInitialCvAnswers())

  useEffect(() => {
    setFormData(createProfileFormData(currentUser))
    setAiCvAnswers(createInitialCvAnswers(currentUser))
  }, [currentUser])

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview)
      }
    }
  }, [selectedImagePreview])

  useEffect(() => {
    if (!isCvModalOpen) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !isGeneratingCv) {
        setIsCvModalOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isCvModalOpen, isGeneratingCv])

  const universityOptions = Array.from(
    new Set([formData.universidad, ...universities].filter(Boolean)),
  )
  const focusOptions = Array.from(
    new Set([formData.carrera, ...careerFocusOptions].filter(Boolean)),
  )
  const displayedProfileImage = selectedImagePreview || getProfileImageUrl(currentUser)
  const currentCvUrl = getCvDocumentUrl(currentUser)
  const isBusy = isSaving || isUploadingCv || isGeneratingCv

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
    setCvStatusMessage('')
    setCvErrorMessage('')
    setSelectedImage(null)
    setSelectedImagePreview('')
    setSelectedCvFile(null)
    setAiCvAnswers(createInitialCvAnswers(currentUser))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (cvInputRef.current) {
      cvInputRef.current.value = ''
    }

    setFormData(createProfileFormData(currentUser))
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

  function handleCvButtonClick() {
    cvInputRef.current?.click()
  }

  function handleCvChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setCvStatusMessage('')
    setCvErrorMessage('')
    setSelectedCvFile(file)
  }

  function handleAiCvAnswerChange(event) {
    const { name, value } = event.target

    setAiCvAnswers((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function openAiCvModal() {
    setCvStatusMessage('')
    setCvErrorMessage('')
    setAiCvAnswers(createInitialCvAnswers(currentUser))
    setIsCvModalOpen(true)
  }

  function closeAiCvModal() {
    if (isGeneratingCv) {
      return
    }

    setIsCvModalOpen(false)
  }

  async function handleCvUpload() {
    if (!selectedCvFile) {
      setCvErrorMessage('Selecciona un archivo PDF antes de guardarlo.')
      return
    }

    setCvErrorMessage('')
    setCvStatusMessage('')
    setIsUploadingCv(true)

    try {
      const uploadResult = await uploadCvPdf(selectedCvFile, {
        publicId: `student-cv-${currentUser?.uid}-${Date.now()}`,
      })

      await updateUserProfile(currentUser?.uid, {
        cvUrl: uploadResult.url,
        cvFileName: selectedCvFile.name,
        cvPublicId: uploadResult.publicId,
        cvUpdatedAt: new Date().toISOString(),
      })

      await refreshUserProfile(currentUser?.uid)
      setSelectedCvFile(null)

      if (cvInputRef.current) {
        cvInputRef.current.value = ''
      }

      setCvStatusMessage('El CV se ha subido y guardado correctamente.')
    } catch (error) {
      setCvErrorMessage(error.message || 'No se pudo subir el CV.')
    } finally {
      setIsUploadingCv(false)
    }
  }

  async function handleGenerateAiCv(event) {
    event.preventDefault()
    setCvErrorMessage('')
    setCvStatusMessage('')
    setIsGeneratingCv(true)

    try {
      const generatedCvData = await generateStudentCvContent({
        profile: currentUser,
        answers: aiCvAnswers,
      })
      const pdfBlob = createStudentCvPdfBlob(generatedCvData)
      const generatedFileName = getStudentCvFileName(generatedCvData)
      const generatedPdfFile = new File([pdfBlob], generatedFileName, {
        type: 'application/pdf',
      })
      const uploadResult = await uploadCvPdf(generatedPdfFile, {
        publicId: `student-cv-${currentUser?.uid}-${Date.now()}`,
      })

      await updateUserProfile(currentUser?.uid, {
        cvUrl: uploadResult.url,
        cvFileName: generatedPdfFile.name,
        cvPublicId: uploadResult.publicId,
        cvUpdatedAt: new Date().toISOString(),
      })

      await refreshUserProfile(currentUser?.uid)
      downloadBlobFile(pdfBlob, generatedPdfFile.name)
      setSelectedCvFile(null)

      if (cvInputRef.current) {
        cvInputRef.current.value = ''
      }

      setCvStatusMessage('Tu CV profesional se ha generado, descargado y guardado en tu perfil.')
      setIsCvModalOpen(false)
    } catch (error) {
      setCvErrorMessage(error.message || 'No se pudo crear el CV con IA.')
    } finally {
      setIsGeneratingCv(false)
    }
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

            <section className="student-profile-cv-panel">
              <div className="student-profile-cv-copy">
                <p className="student-profile-cv-eyebrow">Curriculum Vitae</p>
                <h3>Sube tu CV o crealo con IA</h3>
                <p>
                  Guarda un PDF en tu perfil o responde unas preguntas para que la IA prepare una
                  version profesional y lista para descargar.
                </p>
              </div>

              <div className="student-profile-cv-actions">
                <button
                  type="button"
                  className="student-profile-secondary-button"
                  onClick={handleCvButtonClick}
                  disabled={isBusy}
                >
                  <Icon name="upload_file" className="student-profile-save-icon" />
                  Seleccionar PDF
                </button>

                <button
                  type="button"
                  className="student-profile-secondary-button"
                  onClick={handleCvUpload}
                  disabled={isBusy || !selectedCvFile}
                >
                  <Icon name="picture_as_pdf" className="student-profile-save-icon" />
                  {isUploadingCv ? 'Guardando CV...' : 'Guardar CV'}
                </button>

                <button
                  type="button"
                  className="student-profile-save-button"
                  onClick={openAiCvModal}
                  disabled={isBusy}
                >
                  <Icon name="auto_awesome" className="student-profile-save-icon" />
                  {isGeneratingCv ? 'Creando CV...' : 'Crea tu CV con IA'}
                </button>

                <input
                  ref={cvInputRef}
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={handleCvChange}
                />
              </div>

              {selectedCvFile ? (
                <p className="student-profile-cv-meta">
                  PDF seleccionado: <strong>{selectedCvFile.name}</strong>
                </p>
              ) : null}

              {currentCvUrl ? (
                <a
                  className="student-profile-cv-link"
                  href={currentCvUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver CV actual
                </a>
              ) : null}

              {cvStatusMessage ? <p style={{ color: '#166534' }}>{cvStatusMessage}</p> : null}
              {cvErrorMessage ? <p style={{ color: '#b91c1c' }}>{cvErrorMessage}</p> : null}
            </section>
          </div>

          <div className="student-profile-action-bar">
            <button
              type="button"
              className="student-profile-reset-button"
              onClick={handleReset}
              disabled={isBusy}
            >
              Reset Changes
            </button>
            <button
              type="submit"
              form="student-profile-form"
              className="student-profile-save-button"
              disabled={isBusy}
            >
              <Icon name="save" className="student-profile-save-icon" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          {statusMessage ? <p style={{ color: '#166534' }}>{statusMessage}</p> : null}
          {errorMessage ? <p style={{ color: '#b91c1c' }}>{errorMessage}</p> : null}
        </section>
      </div>

      {isCvModalOpen ? (
        <div className="student-profile-modal-backdrop" onClick={closeAiCvModal}>
          <div
            className="student-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-profile-ai-cv-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="student-profile-modal-header">
              <div>
                <p className="student-profile-cv-eyebrow">Asistente de CV</p>
                <h3 id="student-profile-ai-cv-title">Crea tu CV con IA</h3>
                <p>
                  Cuanta mas informacion real compartas, mejor podra estructurar la IA un CV
                  profesional y honesto.
                </p>
              </div>

              <button
                type="button"
                className="student-profile-modal-close"
                onClick={closeAiCvModal}
                disabled={isGeneratingCv}
                aria-label="Cerrar modal"
              >
                <Icon name="close" />
              </button>
            </div>

            <form className="student-profile-modal-form" onSubmit={handleGenerateAiCv}>
              <div className="student-profile-modal-grid">
                {cvQuestions.map((question) => (
                  <label
                    key={question.id}
                    className={`student-profile-field ${
                      question.type === 'textarea' ? 'student-profile-field-full' : ''
                    }`}
                  >
                    <span>{question.label}</span>
                    {question.type === 'textarea' ? (
                      <textarea
                        name={question.id}
                        rows={question.rows || 3}
                        placeholder={question.placeholder}
                        value={aiCvAnswers[question.id] || ''}
                        onChange={handleAiCvAnswerChange}
                      />
                    ) : (
                      <input
                        name={question.id}
                        type={question.type}
                        placeholder={question.placeholder}
                        value={aiCvAnswers[question.id] || ''}
                        onChange={handleAiCvAnswerChange}
                      />
                    )}
                  </label>
                ))}
              </div>

              <div className="student-profile-modal-actions">
                <button
                  type="button"
                  className="student-profile-reset-button"
                  onClick={closeAiCvModal}
                  disabled={isGeneratingCv}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="student-profile-save-button"
                  disabled={isGeneratingCv}
                >
                  <Icon name="description" className="student-profile-save-icon" />
                  {isGeneratingCv ? 'Generando PDF...' : 'Generar y guardar CV'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  )
}
