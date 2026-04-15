import { useState } from 'react'
import '../assets/styles/postOffer.css'
import { ROUTES } from '../routes/paths'
import { Link, useRouter } from '../routes/router'
import { createOffer } from '../services/offerService'
import { useUser } from '../services/userService'

const categoryOptions = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Data Science',
  'Finance',
]

const modalities = [
  { id: 'Remote', label: 'Remote' },
  { id: 'On-site', label: 'On-site' },
  { id: 'Hybrid', label: 'Hybrid' },
]

const toolbarActions = ['format_bold', 'format_italic', 'format_list_bulleted', 'link']

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function PostOfferForm() {
  const { currentUser } = useUser()
  const { navigate } = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    salary: '',
    modality: modalities[0].id,
  })

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function submitOffer(status) {
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const createdOffer = await createOffer({
        ...formData,
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
          <h1>Post Offer</h1>
          <p>Find your next star intern by providing the details below.</p>
        </div>

        <section className="post-offer-card">
          <form className="post-offer-form" onSubmit={handleSubmit}>
            <label className="post-offer-field" htmlFor="title">
              <span>Offer Title</span>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Software Engineering Intern"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className="post-offer-field" htmlFor="category">
              <span>Category</span>
              <div className="post-offer-select-wrap">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <Icon name="expand_more" className="post-offer-select-icon" />
              </div>
            </label>

            <div className="post-offer-field">
              <span>Description</span>
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
                  placeholder="Describe the responsibilities, requirements, and benefits..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="post-offer-two-column">
              <label className="post-offer-field" htmlFor="location">
                <span>Location</span>
                <div className="post-offer-input-icon-wrap">
                  <Icon name="location_on" className="post-offer-input-icon" />
                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g. Madrid, Spain"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </label>

              <label className="post-offer-field" htmlFor="salary">
                <span>Salary</span>
                <div className="post-offer-input-icon-wrap">
                  <Icon name="payments" className="post-offer-input-icon" />
                  <input
                    id="salary"
                    name="salary"
                    type="text"
                    placeholder="e.g. EUR 900 / month"
                    value={formData.salary}
                    onChange={handleChange}
                    required
                  />
                </div>
              </label>
            </div>

            <fieldset className="post-offer-modality-group">
              <legend>Modality</legend>
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
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </button>
              <button type="submit" className="post-offer-primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Publishing...' : 'Publish Offer'}
              </button>
            </div>
          </form>
        </section>

        <p className="post-offer-help">
          Need help? You can always return to the <Link to={ROUTES.home}>home page</Link>.
        </p>
      </div>
    </main>
  )
}
