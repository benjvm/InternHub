import { doc, getDoc, serverTimestamp } from 'firebase/firestore'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { auth, db } from '../firebase'
import { updateUserProfile } from './profileService'

const USERS_COLLECTION = 'users'
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-5.2'
const OPENROUTER_SITE_URL =
  import.meta.env.VITE_OPENROUTER_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : undefined)
const OPENROUTER_APP_NAME = import.meta.env.VITE_OPENROUTER_APP_NAME || 'InternHub'

const ALLOWED_PDF_MIME_TYPES = new Set(['application/pdf'])
const MAX_CV_FILE_SIZE_BYTES = 8 * 1024 * 1024
const MAX_RAW_TEXT_LENGTH = 120000
const MAX_AI_TEXT_LENGTH = 24000

let pdfJsModulePromise = null

function ensureAuthenticatedOwner(uid) {
  if (!uid || auth.currentUser?.uid !== uid) {
    throw new Error('Solo puedes procesar tu propio CV.')
  }
}

function ensureOpenRouterConfig() {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      'OpenRouter no esta configurado. Anade VITE_OPENROUTER_API_KEY a tus variables de entorno.',
    )
  }
}

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeWhitespace(value) {
  return toTrimmedString(value).replace(/\s+/g, ' ')
}

function deduplicateStrings(values) {
  const seen = new Set()

  return values.filter((value) => {
    const normalizedValue = value.toLowerCase()

    if (seen.has(normalizedValue)) {
      return false
    }

    seen.add(normalizedValue)
    return true
  })
}

function normalizeStringList(values) {
  if (!Array.isArray(values)) {
    if (typeof values === 'string') {
      return deduplicateStrings(
        values
          .split(/[\n,;|]/)
          .map((value) => normalizeWhitespace(value))
          .filter(Boolean),
      )
    }

    return []
  }

  return deduplicateStrings(
    values
      .map((value) => normalizeWhitespace(value))
      .filter(Boolean),
  )
}

function truncateText(value, maxLength) {
  const normalizedValue = typeof value === 'string' ? value.trim() : ''

  if (normalizedValue.length <= maxLength) {
    return normalizedValue
  }

  return normalizedValue.slice(0, maxLength).trim()
}

function buildFullName(profile = {}) {
  const firstName = toTrimmedString(profile?.nombre || profile?.firstName)
  const lastName = toTrimmedString(profile?.apellido || profile?.lastName)
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

function createEmptyParsedProfile(profile = {}) {
  const portfolio = toTrimmedString(profile?.portfolio)
  const github = toTrimmedString(profile?.github)

  return {
    fullName: buildFullName(profile),
    headline: toTrimmedString(profile?.headline || profile?.carrera || profile?.careerFocus),
    location: toTrimmedString(profile?.ubicacion || profile?.location),
    bio: toTrimmedString(profile?.bio),
    university: toTrimmedString(profile?.universidad || profile?.university),
    degree: toTrimmedString(profile?.carrera || profile?.degree || profile?.careerFocus),
    semester: toTrimmedString(profile?.semester || profile?.semestre),
    skills: {
      technical: [],
      design: [],
      soft: [],
    },
    experience: [],
    education: [],
    languages: [],
    projects: [],
    socialLinks: {
      linkedin: toTrimmedString(profile?.linkedin),
      github,
      portfolio,
    },
  }
}

function normalizeExperienceList(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((item) => {
      if (typeof item === 'string') {
        const summary = normalizeWhitespace(item)
        return summary
          ? {
              title: '',
              company: '',
              startDate: '',
              endDate: '',
              location: '',
              summary,
            }
          : null
      }

      if (!item || typeof item !== 'object') {
        return null
      }

      const normalizedItem = {
        title: toTrimmedString(item.title || item.role || item.position),
        company: toTrimmedString(item.company || item.organization),
        startDate: toTrimmedString(item.startDate),
        endDate: toTrimmedString(item.endDate),
        location: toTrimmedString(item.location),
        summary: normalizeWhitespace(
          item.summary ||
            item.description ||
            (Array.isArray(item.bullets) ? item.bullets.join(' ') : ''),
        ),
      }

      return Object.values(normalizedItem).some(Boolean) ? normalizedItem : null
    })
    .filter(Boolean)
}

function normalizeEducationList(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((item) => {
      if (typeof item === 'string') {
        const details = normalizeWhitespace(item)
        return details
          ? {
              institution: '',
              degree: '',
              startDate: '',
              endDate: '',
              details,
            }
          : null
      }

      if (!item || typeof item !== 'object') {
        return null
      }

      const normalizedItem = {
        institution: toTrimmedString(item.institution || item.school || item.university),
        degree: toTrimmedString(item.degree || item.title || item.program),
        startDate: toTrimmedString(item.startDate),
        endDate: toTrimmedString(item.endDate),
        details: normalizeWhitespace(
          item.details ||
            item.description ||
            (Array.isArray(item.highlights) ? item.highlights.join(' ') : ''),
        ),
      }

      return Object.values(normalizedItem).some(Boolean) ? normalizedItem : null
    })
    .filter(Boolean)
}

function normalizeLanguageList(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((item) => {
      if (typeof item === 'string') {
        const name = normalizeWhitespace(item)
        return name ? { name, level: '' } : null
      }

      if (!item || typeof item !== 'object') {
        return null
      }

      const normalizedItem = {
        name: toTrimmedString(item.name || item.language),
        level: toTrimmedString(item.level || item.proficiency),
      }

      return normalizedItem.name ? normalizedItem : null
    })
    .filter(Boolean)
}

function normalizeProjectList(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((item) => {
      if (typeof item === 'string') {
        const description = normalizeWhitespace(item)
        return description
          ? {
              name: '',
              description,
              technologies: [],
              link: '',
            }
          : null
      }

      if (!item || typeof item !== 'object') {
        return null
      }

      const normalizedItem = {
        name: toTrimmedString(item.name || item.title),
        description: normalizeWhitespace(
          item.description ||
            item.summary ||
            item.subtitle ||
            (Array.isArray(item.bullets) ? item.bullets.join(' ') : ''),
        ),
        technologies: normalizeStringList(item.technologies || item.stack || item.tools),
        link: toTrimmedString(item.link || item.url || item.repository),
      }

      return Object.values(normalizedItem).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value),
      )
        ? normalizedItem
        : null
    })
    .filter(Boolean)
}

function normalizeSocialLinks(values, fallbackLinks = {}) {
  return {
    linkedin: toTrimmedString(values?.linkedin || fallbackLinks.linkedin),
    github: toTrimmedString(values?.github || fallbackLinks.github),
    portfolio: toTrimmedString(values?.portfolio || fallbackLinks.portfolio),
  }
}

function normalizeSkills(values, fallbackSkills = {}) {
  const normalizedSkills = {
    technical: normalizeStringList(values?.technical || fallbackSkills.technical),
    design: normalizeStringList(values?.design || fallbackSkills.design),
    soft: normalizeStringList(values?.soft || fallbackSkills.soft),
  }

  if (Array.isArray(values)) {
    values.forEach((entry) => {
      if (!entry || typeof entry !== 'object') {
        return
      }

      const category = toTrimmedString(entry.category).toLowerCase()
      const items = normalizeStringList(entry.items)

      if (!items.length) {
        return
      }

      if (category.includes('design')) {
        normalizedSkills.design = deduplicateStrings([...normalizedSkills.design, ...items])
        return
      }

      if (category.includes('soft') || category.includes('blanda')) {
        normalizedSkills.soft = deduplicateStrings([...normalizedSkills.soft, ...items])
        return
      }

      normalizedSkills.technical = deduplicateStrings([...normalizedSkills.technical, ...items])
    })
  }

  return normalizedSkills
}

function normalizeParsedProfile(rawProfile, fallbackProfile = {}) {
  const baseProfile = createEmptyParsedProfile(fallbackProfile)
  const rawSocialLinks = rawProfile?.socialLinks || {}
  const socialLinks = normalizeSocialLinks(rawSocialLinks, baseProfile.socialLinks)
  const normalizedProfile = {
    fullName: toTrimmedString(rawProfile?.fullName) || baseProfile.fullName,
    headline: toTrimmedString(rawProfile?.headline || rawProfile?.targetRole) || baseProfile.headline,
    location: toTrimmedString(rawProfile?.location) || baseProfile.location,
    bio: normalizeWhitespace(rawProfile?.bio || rawProfile?.summary) || baseProfile.bio,
    university: toTrimmedString(rawProfile?.university) || baseProfile.university,
    degree: toTrimmedString(rawProfile?.degree) || baseProfile.degree,
    semester: toTrimmedString(rawProfile?.semester) || baseProfile.semester,
    skills: normalizeSkills(rawProfile?.skills, baseProfile.skills),
    experience: normalizeExperienceList(rawProfile?.experience),
    education: normalizeEducationList(rawProfile?.education),
    languages: normalizeLanguageList(rawProfile?.languages),
    projects: normalizeProjectList(rawProfile?.projects),
    socialLinks: {
      linkedin: socialLinks.linkedin,
      github: socialLinks.github || (socialLinks.portfolio.includes('github.com') ? socialLinks.portfolio : ''),
      portfolio:
        socialLinks.portfolio ||
        (socialLinks.github && !socialLinks.github.includes('github.com') ? socialLinks.github : ''),
    },
  }

  return normalizedProfile
}

function parseJsonBlock(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('La respuesta de la IA no incluyo contenido util.')
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

    throw new Error('No se pudo interpretar la respuesta de la IA como JSON.')
  }
}

async function loadPdfJsModule() {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import('pdfjs-dist').then((module) => {
      module.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
      return module
    })
  }

  return pdfJsModulePromise
}

async function getStudentProfile(uid) {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, uid))
  return snapshot.exists() ? snapshot.data() : {}
}

export function validateCvPdf(file) {
  if (!file) {
    throw new Error('Selecciona un archivo PDF antes de continuar.')
  }

  const isPdfFile =
    ALLOWED_PDF_MIME_TYPES.has(file.type) || toTrimmedString(file.name).toLowerCase().endsWith('.pdf')

  if (!isPdfFile) {
    throw new Error('Solo se admiten archivos PDF.')
  }

  if (file.size > MAX_CV_FILE_SIZE_BYTES) {
    throw new Error('El PDF debe pesar 8 MB o menos.')
  }
}

export async function generateFileHash(file) {
  validateCvPdf(file)

  if (!window.crypto?.subtle) {
    throw new Error('Tu navegador no soporta hashing seguro para procesar el CV.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function extractTextFromPDF(file) {
  validateCvPdf(file)

  const pdfjs = await loadPdfJsModule()
  const pdfBytes = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjs.getDocument({ data: pdfBytes })

  try {
    const pdfDocument = await loadingTask.promise
    const pages = []

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (pageText) {
        pages.push(pageText)
      }
    }

    const extractedText = pages.join('\n\n').trim()

    if (!extractedText) {
      throw new Error(
        'No se pudo extraer texto del PDF. Revisa si el archivo esta corrupto o si es un PDF escaneado sin texto seleccionable.',
      )
    }

    return truncateText(extractedText, MAX_RAW_TEXT_LENGTH)
  } catch (error) {
    throw new Error(error.message || 'No se pudo leer el PDF.')
  } finally {
    await loadingTask.destroy()
  }
}

export async function parseCVWithAI(pdfText) {
  ensureOpenRouterConfig()

  const normalizedPdfText = truncateText(pdfText, MAX_AI_TEXT_LENGTH)

  if (!normalizedPdfText) {
    throw new Error('No hay texto suficiente para analizar el CV.')
  }

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
      temperature: 0.2,
      max_tokens: 1800,
      messages: [
        {
          role: 'system',
          content:
            'Eres un analista experto en CV. Extrae solo informacion presente en el texto. Devuelve exclusivamente JSON valido, sin Markdown, sin comentarios y sin inventar datos.',
        },
        {
          role: 'user',
          content: `Analiza este CV y devuelve un JSON con esta estructura exacta:
{
  "fullName": "string",
  "headline": "string",
  "location": "string",
  "bio": "string",
  "university": "string",
  "degree": "string",
  "semester": "string",
  "skills": {
    "technical": ["string"],
    "design": ["string"],
    "soft": ["string"]
  },
  "experience": [
    {
      "title": "string",
      "company": "string",
      "startDate": "string",
      "endDate": "string",
      "location": "string",
      "summary": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "startDate": "string",
      "endDate": "string",
      "details": "string"
    }
  ],
  "languages": [
    {
      "name": "string",
      "level": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "link": "string"
    }
  ],
  "socialLinks": {
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  }
}

Reglas:
- No inventes experiencia, fechas, enlaces ni niveles si no aparecen.
- Si falta un dato, devuelve cadena vacia o array vacio.
- Resume en espanol neutro y profesional.
- Clasifica habilidades en technical, design y soft.

Texto del CV:
${normalizedPdfText}`,
        },
      ],
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result?.error?.message || 'La IA no pudo analizar el CV en este momento.',
    )
  }

  const content = result?.choices?.[0]?.message?.content
  return normalizeParsedProfile(parseJsonBlock(content))
}

export function mapGeneratedCvDataToParsedProfile(generatedCvData = {}, fallbackProfile = {}) {
  const technicalSkills = []
  const designSkills = []
  const softSkills = []

  if (Array.isArray(generatedCvData.skills)) {
    generatedCvData.skills.forEach((group) => {
      const category = toTrimmedString(group?.category).toLowerCase()
      const items = normalizeStringList(group?.items)

      if (!items.length) {
        return
      }

      if (category.includes('design')) {
        designSkills.push(...items)
        return
      }

      if (category.includes('soft') || category.includes('interpersonal')) {
        softSkills.push(...items)
        return
      }

      technicalSkills.push(...items)
    })
  }

  return normalizeParsedProfile(
    {
      fullName: generatedCvData.fullName,
      headline: generatedCvData.targetRole,
      location: generatedCvData.location,
      bio: generatedCvData.summary,
      university: fallbackProfile?.universidad || fallbackProfile?.university,
      degree: fallbackProfile?.carrera || fallbackProfile?.degree || fallbackProfile?.careerFocus,
      semester: fallbackProfile?.semester || fallbackProfile?.semestre,
      skills: {
        technical: technicalSkills,
        design: designSkills,
        soft: softSkills,
      },
      experience: Array.isArray(generatedCvData.experience)
        ? generatedCvData.experience.map((item) => ({
            title: item?.title,
            company: item?.company,
            startDate: item?.startDate,
            endDate: item?.endDate,
            location: item?.location,
            summary: Array.isArray(item?.bullets) ? item.bullets.join(' ') : '',
          }))
        : [],
      education: Array.isArray(generatedCvData.education)
        ? generatedCvData.education.map((item) => ({
            institution: item?.institution,
            degree: item?.degree,
            startDate: item?.startDate,
            endDate: item?.endDate,
            details: Array.isArray(item?.highlights) ? item.highlights.join(' ') : '',
          }))
        : [],
      languages: generatedCvData.languages,
      projects: Array.isArray(generatedCvData.projects)
        ? generatedCvData.projects.map((item) => ({
            name: item?.name,
            description:
              item?.subtitle || (Array.isArray(item?.bullets) ? item.bullets.join(' ') : ''),
            technologies: [],
            link: '',
          }))
        : [],
      socialLinks: {
        linkedin: generatedCvData.linkedin,
        github: toTrimmedString(generatedCvData.portfolio).includes('github.com')
          ? generatedCvData.portfolio
          : fallbackProfile?.github,
        portfolio: generatedCvData.portfolio,
      },
    },
    fallbackProfile,
  )
}

export async function processStudentCV(uid, file, options = {}) {
  ensureAuthenticatedOwner(uid)
  validateCvPdf(file)

  const studentProfile = await getStudentProfile(uid)
  const existingCvData = studentProfile?.cvData || {}
  const fileHash = options.fileHash || (await generateFileHash(file))
  const cvUpload = options.cvUpload || null

  if (existingCvData.cvHash && existingCvData.cvHash === fileHash) {
    const existingParsedProfile = normalizeParsedProfile(
      existingCvData.parsedProfile,
      studentProfile,
    )

    if (cvUpload && studentProfile?.cvUrl !== cvUpload.url) {
      await updateUserProfile(uid, {
        cvUrl: cvUpload.url,
        cvFileName: file.name,
        cvPublicId: cvUpload.publicId || studentProfile?.cvPublicId || '',
        cvUpdatedAt: new Date().toISOString(),
      })
    }

    return {
      reusedExisting: true,
      parsedProfile: existingParsedProfile,
      rawExtractedText: toTrimmedString(existingCvData.rawExtractedText),
      cvData: {
        ...existingCvData,
        parsedProfile: existingParsedProfile,
      },
    }
  }

  const rawExtractedText = options.rawExtractedText || (await extractTextFromPDF(file))
  let parsedProfile = createEmptyParsedProfile(studentProfile)
  let aiProcessingStatus = 'failed'
  let lastParseError = ''

  if (options.preParsedProfile) {
    parsedProfile = normalizeParsedProfile(options.preParsedProfile, studentProfile)
    aiProcessingStatus = 'provided'
  } else {
    try {
      parsedProfile = normalizeParsedProfile(await parseCVWithAI(rawExtractedText), studentProfile)
      aiProcessingStatus = 'success'
    } catch (error) {
      lastParseError = error.message || 'No se pudo analizar el CV con IA.'
    }
  }

  const cvData = {
    cvHash: fileHash,
    originalFileName: file.name,
    lastParsedAt: serverTimestamp(),
    rawExtractedText: truncateText(rawExtractedText, MAX_RAW_TEXT_LENGTH),
    parsedProfile,
    aiProcessingStatus,
    lastParseError,
  }

  const profileUpdate = {
    cvFileName: file.name,
    cvUpdatedAt: new Date().toISOString(),
    cvData,
  }

  if (cvUpload) {
    profileUpdate.cvUrl = cvUpload.url
    profileUpdate.cvPublicId = cvUpload.publicId || ''
  }

  await updateUserProfile(uid, profileUpdate)

  return {
    reusedExisting: false,
    parsedProfile,
    rawExtractedText: cvData.rawExtractedText,
    cvData: {
      ...cvData,
      lastParsedAt: new Date().toISOString(),
    },
    aiProcessingStatus,
    lastParseError,
  }
}
