import { jsPDF } from 'jspdf'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-5.2'
const OPENROUTER_SITE_URL =
  import.meta.env.VITE_OPENROUTER_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : undefined)
const OPENROUTER_APP_NAME = import.meta.env.VITE_OPENROUTER_APP_NAME || 'InternHub'

const STUDENT_CV_QUESTIONNAIRE = [
  {
    id: 'targetRole',
    label: 'Puesto o area objetivo',
    placeholder: 'Ej. Frontend Developer Intern, Data Analyst Intern...',
    type: 'text',
  },
  {
    id: 'email',
    label: 'Email de contacto',
    placeholder: 'tuemail@ejemplo.com',
    type: 'email',
  },
  {
    id: 'phone',
    label: 'Telefono',
    placeholder: '+34 600 000 000',
    type: 'tel',
  },
  {
    id: 'location',
    label: 'Ciudad y pais',
    placeholder: 'Madrid, Espana',
    type: 'text',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'https://www.linkedin.com/in/tu-perfil',
    type: 'url',
  },
  {
    id: 'portfolio',
    label: 'Portfolio o GitHub',
    placeholder: 'https://github.com/tuusuario',
    type: 'url',
  },
  {
    id: 'skills',
    label: 'Habilidades y herramientas',
    placeholder: 'JavaScript, React, Figma, SQL, Excel, trabajo en equipo...',
    type: 'textarea',
    rows: 3,
  },
  {
    id: 'projects',
    label: 'Proyectos destacados',
    placeholder: 'Describe proyectos academicos, personales o freelance.',
    type: 'textarea',
    rows: 4,
  },
  {
    id: 'experience',
    label: 'Experiencia, practicas o voluntariado',
    placeholder: 'Incluye responsabilidades, logros y fechas si las conoces.',
    type: 'textarea',
    rows: 4,
  },
  {
    id: 'languages',
    label: 'Idiomas',
    placeholder: 'Espanol nativo, Ingles B2, Frances A2...',
    type: 'textarea',
    rows: 2,
  },
  {
    id: 'certifications',
    label: 'Certificaciones o cursos',
    placeholder: 'Nombre, entidad y ano si aplica.',
    type: 'textarea',
    rows: 3,
  },
]

function ensureOpenRouterConfig() {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      'OpenRouter is not configured. Add VITE_OPENROUTER_API_KEY to your environment variables.',
    )
  }
}

function parseJsonBlock(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('The AI response did not include any resume content.')
  }

  const trimmedContent = content.trim()

  try {
    return JSON.parse(trimmedContent)
  } catch {
    const fencedMatch = trimmedContent.match(/```json\s*([\s\S]*?)```/i)

    if (fencedMatch?.[1]) {
      return JSON.parse(fencedMatch[1].trim())
    }

    const firstBraceIndex = trimmedContent.indexOf('{')
    const lastBraceIndex = trimmedContent.lastIndexOf('}')

    if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
      return JSON.parse(trimmedContent.slice(firstBraceIndex, lastBraceIndex + 1))
    }

    throw new Error('The AI response could not be parsed as JSON.')
  }
}

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function toCleanList(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
}

function normalizeEntryList(values, fields) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const normalizedItem = fields.reduce((accumulator, field) => {
        if (field === 'bullets' || field === 'highlights' || field === 'items') {
          accumulator[field] = toCleanList(item[field])
          return accumulator
        }

        accumulator[field] = toTrimmedString(item[field])
        return accumulator
      }, {})

      const hasVisibleContent = Object.values(normalizedItem).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value),
      )

      return hasVisibleContent ? normalizedItem : null
    })
    .filter(Boolean)
}

function normalizeCvData(rawCvData, sourceData) {
  const fullName =
    toTrimmedString(rawCvData?.fullName) ||
    [sourceData.nombre, sourceData.apellido].filter(Boolean).join(' ').trim() ||
    'Student Candidate'

  return {
    fullName,
    targetRole: toTrimmedString(rawCvData?.targetRole) || toTrimmedString(sourceData.targetRole),
    email: toTrimmedString(rawCvData?.email) || toTrimmedString(sourceData.email),
    phone: toTrimmedString(rawCvData?.phone) || toTrimmedString(sourceData.phone),
    location: toTrimmedString(rawCvData?.location) || toTrimmedString(sourceData.location),
    linkedin: toTrimmedString(rawCvData?.linkedin) || toTrimmedString(sourceData.linkedin),
    portfolio: toTrimmedString(rawCvData?.portfolio) || toTrimmedString(sourceData.portfolio),
    summary:
      toTrimmedString(rawCvData?.summary) ||
      toTrimmedString(sourceData.bio) ||
      'Student profile focused on continuous learning and early career growth.',
    education: normalizeEntryList(rawCvData?.education, [
      'institution',
      'degree',
      'startDate',
      'endDate',
      'location',
      'highlights',
    ]),
    experience: normalizeEntryList(rawCvData?.experience, [
      'title',
      'company',
      'startDate',
      'endDate',
      'location',
      'bullets',
    ]),
    projects: normalizeEntryList(rawCvData?.projects, ['name', 'subtitle', 'bullets']),
    skills: normalizeEntryList(rawCvData?.skills, ['category', 'items']),
    languages: normalizeEntryList(rawCvData?.languages, ['name', 'level']),
    certifications: normalizeEntryList(rawCvData?.certifications, ['name', 'issuer', 'year']),
  }
}

function buildSourceData(profile = {}, answers = {}) {
  return {
    nombre: toTrimmedString(profile?.nombre),
    apellido: toTrimmedString(profile?.apellido),
    email: toTrimmedString(answers.email || profile?.email),
    bio: toTrimmedString(profile?.bio),
    universidad: toTrimmedString(profile?.universidad),
    carrera: toTrimmedString(profile?.carrera || profile?.careerFocus || profile?.carrerFocus),
    targetRole: toTrimmedString(answers.targetRole),
    phone: toTrimmedString(answers.phone || profile?.telefono || profile?.phone),
    location: toTrimmedString(answers.location || profile?.ubicacion || profile?.location),
    linkedin: toTrimmedString(answers.linkedin || profile?.linkedin),
    portfolio: toTrimmedString(answers.portfolio || profile?.portfolio || profile?.github),
    skills: toTrimmedString(answers.skills),
    projects: toTrimmedString(answers.projects),
    experience: toTrimmedString(answers.experience),
    languages: toTrimmedString(answers.languages),
    certifications: toTrimmedString(answers.certifications),
  }
}

function createCvPromptPayload(sourceData) {
  return {
    candidate: {
      fullName: [sourceData.nombre, sourceData.apellido].filter(Boolean).join(' ').trim(),
      email: sourceData.email,
      phone: sourceData.phone,
      location: sourceData.location,
      linkedin: sourceData.linkedin,
      portfolio: sourceData.portfolio,
      university: sourceData.universidad,
      degree: sourceData.carrera,
      bio: sourceData.bio,
      targetRole: sourceData.targetRole,
      skills: sourceData.skills,
      projects: sourceData.projects,
      experience: sourceData.experience,
      languages: sourceData.languages,
      certifications: sourceData.certifications,
    },
    instructions: {
      language: 'es',
      audience: 'student candidate',
      tone: 'professional, concise, credible, ATS-friendly',
      honestyPolicy: 'Do not invent facts, employers, dates, links, metrics, or certifications.',
      missingDataPolicy:
        'If data is missing, omit that field or describe the profile honestly as entry-level.',
    },
    requiredJsonShape: {
      fullName: 'string',
      targetRole: 'string',
      email: 'string',
      phone: 'string',
      location: 'string',
      linkedin: 'string',
      portfolio: 'string',
      summary: 'string',
      education: [
        {
          institution: 'string',
          degree: 'string',
          startDate: 'string',
          endDate: 'string',
          location: 'string',
          highlights: ['string'],
        },
      ],
      experience: [
        {
          title: 'string',
          company: 'string',
          startDate: 'string',
          endDate: 'string',
          location: 'string',
          bullets: ['string'],
        },
      ],
      projects: [
        {
          name: 'string',
          subtitle: 'string',
          bullets: ['string'],
        },
      ],
      skills: [
        {
          category: 'string',
          items: ['string'],
        },
      ],
      languages: [
        {
          name: 'string',
          level: 'string',
        },
      ],
      certifications: [
        {
          name: 'string',
          issuer: 'string',
          year: 'string',
        },
      ],
    },
  }
}

function buildContactLine(cvData) {
  return [cvData.email, cvData.phone, cvData.location].filter(Boolean).join('  |  ')
}

function buildLinkLine(cvData) {
  return [cvData.linkedin, cvData.portfolio].filter(Boolean).join('  |  ')
}

function ensurePdfPageSpace(doc, currentY, neededHeight, resetY) {
  const pageHeight = doc.internal.pageSize.getHeight()

  if (currentY + neededHeight <= pageHeight - 48) {
    return currentY
  }

  doc.addPage()
  return resetY
}

function drawSectionTitle(doc, title, currentY) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(234, 88, 12)
  doc.text(title.toUpperCase(), 48, currentY)
  doc.setDrawColor(254, 215, 170)
  doc.setLineWidth(1)
  doc.line(48, currentY + 6, doc.internal.pageSize.getWidth() - 48, currentY + 6)
  return currentY + 22
}

function drawParagraph(doc, text, currentY, options = {}) {
  const width = options.width || doc.internal.pageSize.getWidth() - 96
  const fontSize = options.fontSize || 10.5
  const lineHeight = options.lineHeight || 14
  const x = options.x || 48

  if (!text) {
    return currentY
  }

  const lines = doc.splitTextToSize(text, width)

  doc.setFont('helvetica', options.fontStyle || 'normal')
  doc.setFontSize(fontSize)
  doc.setTextColor(30, 41, 59)
  doc.text(lines, x, currentY)

  return currentY + lines.length * lineHeight
}

function drawBulletList(doc, items, currentY, options = {}) {
  const x = options.x || 48
  const width = options.width || doc.internal.pageSize.getWidth() - 110
  const lineHeight = options.lineHeight || 14

  if (!items?.length) {
    return currentY
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(options.fontSize || 10.2)
  doc.setTextColor(51, 65, 85)

  let nextY = currentY

  items.forEach((item) => {
    const lines = doc.splitTextToSize(item, width)
    doc.text('-', x, nextY)
    doc.text(lines, x + 12, nextY)
    nextY += lines.length * lineHeight + 3
  })

  return nextY
}

function drawDatedHeading(doc, leftText, rightText, currentY) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text(leftText, 48, currentY)

  if (rightText) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(100, 116, 139)
    doc.text(rightText, doc.internal.pageSize.getWidth() - 48, currentY, { align: 'right' })
  }

  return currentY + 14
}

export function buildStudentCvQuestions() {
  return STUDENT_CV_QUESTIONNAIRE.map((question) => ({ ...question }))
}

export function createInitialCvAnswers(profile = {}) {
  return {
    targetRole: '',
    email: toTrimmedString(profile?.email),
    phone: toTrimmedString(profile?.telefono || profile?.phone),
    location: toTrimmedString(profile?.ubicacion || profile?.location),
    linkedin: toTrimmedString(profile?.linkedin),
    portfolio: toTrimmedString(profile?.portfolio || profile?.github),
    skills: '',
    projects: '',
    experience: '',
    languages: '',
    certifications: '',
  }
}

export async function generateStudentCvContent({ profile = {}, answers = {} }) {
  ensureOpenRouterConfig()

  const sourceData = buildSourceData(profile, answers)
  const promptPayload = createCvPromptPayload(sourceData)

  const headers = {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  }

  if (OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = OPENROUTER_SITE_URL
  }

  if (OPENROUTER_APP_NAME) {
    headers['X-OpenRouter-Title'] = OPENROUTER_APP_NAME
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.35,
      max_tokens: 1800,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior career coach. Generate ATS-friendly resume content in Spanish. Return valid JSON only and do not wrap it in markdown. Never invent facts or experience that the candidate did not provide.',
        },
        {
          role: 'user',
          content: `Create a professional student resume from this data:\n${JSON.stringify(
            promptPayload,
            null,
            2,
          )}`,
        },
      ],
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result?.error?.message || 'OpenRouter could not generate the CV content right now.',
    )
  }

  const content = result?.choices?.[0]?.message?.content
  const rawCvData = parseJsonBlock(content)
  return normalizeCvData(rawCvData, sourceData)
}

export function getStudentCvFileName(cvData) {
  const rawName = toTrimmedString(cvData?.fullName) || 'student-cv'
  const safeName = rawName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${safeName || 'student-cv'}.pdf`
}

export function createStudentCvPdfBlob(cvData) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - 96
  let currentY = 0

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, 104, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(255, 255, 255)
  doc.text(cvData.fullName || 'Student Candidate', 48, 42)

  if (cvData.targetRole) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(cvData.targetRole, 48, 64)
  }

  const contactLine = buildContactLine(cvData)
  if (contactLine) {
    doc.setFontSize(10)
    doc.text(doc.splitTextToSize(contactLine, contentWidth), 48, 84)
  }

  const linkLine = buildLinkLine(cvData)
  if (linkLine) {
    doc.setFontSize(9.5)
    doc.text(doc.splitTextToSize(linkLine, contentWidth), 48, 98)
  }

  currentY = 136

  currentY = drawSectionTitle(doc, 'Perfil profesional', currentY)
  currentY = drawParagraph(doc, cvData.summary, currentY, {
    width: contentWidth,
    lineHeight: 15,
  })
  currentY += 8

  if (cvData.education.length) {
    currentY = ensurePdfPageSpace(doc, currentY, 90, 56)
    currentY = drawSectionTitle(doc, 'Formacion academica', currentY)

    cvData.education.forEach((item) => {
      currentY = ensurePdfPageSpace(doc, currentY, 82, 56)
      currentY = drawDatedHeading(
        doc,
        item.degree || item.institution,
        [item.startDate, item.endDate].filter(Boolean).join(' - '),
        currentY,
      )
      currentY = drawParagraph(
        doc,
        [item.institution, item.location].filter(Boolean).join(' | '),
        currentY,
        { width: contentWidth, fontSize: 10, lineHeight: 14 },
      )
      currentY = drawBulletList(doc, item.highlights, currentY + 4, {
        width: contentWidth - 12,
      })
      currentY += 6
    })
  }

  if (cvData.experience.length) {
    currentY = ensurePdfPageSpace(doc, currentY, 100, 56)
    currentY = drawSectionTitle(doc, 'Experiencia', currentY)

    cvData.experience.forEach((item) => {
      currentY = ensurePdfPageSpace(doc, currentY, 98, 56)
      currentY = drawDatedHeading(
        doc,
        item.title || item.company,
        [item.startDate, item.endDate].filter(Boolean).join(' - '),
        currentY,
      )
      currentY = drawParagraph(
        doc,
        [item.company, item.location].filter(Boolean).join(' | '),
        currentY,
        { width: contentWidth, fontSize: 10, lineHeight: 14 },
      )
      currentY = drawBulletList(doc, item.bullets, currentY + 4, {
        width: contentWidth - 12,
      })
      currentY += 6
    })
  }

  if (cvData.projects.length) {
    currentY = ensurePdfPageSpace(doc, currentY, 100, 56)
    currentY = drawSectionTitle(doc, 'Proyectos', currentY)

    cvData.projects.forEach((item) => {
      currentY = ensurePdfPageSpace(doc, currentY, 90, 56)
      currentY = drawDatedHeading(doc, item.name, item.subtitle, currentY)
      currentY = drawBulletList(doc, item.bullets, currentY + 2, {
        width: contentWidth - 12,
      })
      currentY += 6
    })
  }

  if (cvData.skills.length) {
    currentY = ensurePdfPageSpace(doc, currentY, 90, 56)
    currentY = drawSectionTitle(doc, 'Habilidades', currentY)

    cvData.skills.forEach((item) => {
      const skillLine = [item.category, item.items.join(', ')].filter(Boolean).join(': ')
      currentY = ensurePdfPageSpace(doc, currentY, 34, 56)
      currentY = drawParagraph(doc, skillLine, currentY, {
        width: contentWidth,
        fontStyle: item.category ? 'bold' : 'normal',
        lineHeight: 14,
      })
      currentY += 3
    })
  }

  if (cvData.languages.length) {
    currentY = ensurePdfPageSpace(doc, currentY, 70, 56)
    currentY = drawSectionTitle(doc, 'Idiomas', currentY)
    currentY = drawBulletList(
      doc,
      cvData.languages.map((item) => [item.name, item.level].filter(Boolean).join(' - ')),
      currentY,
      { width: contentWidth - 12 },
    )
    currentY += 6
  }

  if (cvData.certifications.length) {
    currentY = ensurePdfPageSpace(doc, currentY, 80, 56)
    currentY = drawSectionTitle(doc, 'Certificaciones', currentY)
    currentY = drawBulletList(
      doc,
      cvData.certifications.map((item) =>
        [item.name, item.issuer, item.year].filter(Boolean).join(' | '),
      ),
      currentY,
      { width: contentWidth - 12 },
    )
  }

  return doc.output('blob')
}
