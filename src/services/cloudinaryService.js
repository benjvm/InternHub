const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const CLOUDINARY_PROFILE_FOLDER = import.meta.env.VITE_CLOUDINARY_PROFILE_FOLDER || 'internhub/profile-images'
const CLOUDINARY_CV_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_CV_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET
const CLOUDINARY_CV_FOLDER =
  import.meta.env.VITE_CLOUDINARY_CV_FOLDER || `${CLOUDINARY_PROFILE_FOLDER}/cvs`

const DEFAULT_PROFILE_IMAGE_URL =
  'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_PDF_TYPES = new Set(['application/pdf'])
const MAX_CV_FILE_SIZE_BYTES = 8 * 1024 * 1024

function ensureCloudinaryConfig() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your environment variables.',
    )
  }
}

function ensureCloudinaryPreset(uploadPreset, errorMessage) {
  if (!uploadPreset) {
    throw new Error(errorMessage)
  }
}

async function uploadToCloudinary(resourceType, file, options = {}) {
  ensureCloudinaryConfig()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', options.uploadPreset || CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', options.folder || CLOUDINARY_PROFILE_FOLDER)

  if (options.publicId) {
    formData.append('public_id', options.publicId)
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result?.error?.message || 'The file could not be uploaded to Cloudinary.')
  }

  if (!result.secure_url) {
    throw new Error('Cloudinary did not return a valid file URL.')
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    originalFilename: result.original_filename,
    resourceType: result.resource_type,
  }
}

export function getProfileImageUrl(user) {
  return (
    user?.photoURL ||
    user?.profileImageUrl ||
    user?.avatarUrl ||
    user?.photoUrl ||
    DEFAULT_PROFILE_IMAGE_URL
  )
}

export function getCvDocumentUrl(user) {
  return user?.cvUrl || user?.resumeUrl || user?.curriculumUrl || ''
}

export function validateProfileImage(file) {
  if (!file) {
    throw new Error('Select an image before continuing.')
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Use a JPG, PNG, WEBP, or GIF image.')
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    throw new Error('The image must be 5 MB or smaller.')
  }
}

export function validateCvPdf(file) {
  if (!file) {
    throw new Error('Select a PDF before continuing.')
  }

  if (!ALLOWED_PDF_TYPES.has(file.type)) {
    throw new Error('Use a PDF file for the CV.')
  }

  if (file.size > MAX_CV_FILE_SIZE_BYTES) {
    throw new Error('The PDF must be 8 MB or smaller.')
  }
}

export async function uploadProfileImage(file, options = {}) {
  validateProfileImage(file)
  const result = await uploadToCloudinary('image', file, {
    uploadPreset: options.uploadPreset || CLOUDINARY_UPLOAD_PRESET,
    folder: options.folder || CLOUDINARY_PROFILE_FOLDER,
    publicId: options.publicId,
  })

  return {
    ...result,
    width: result.width,
    height: result.height,
  }
}

export async function uploadCvPdf(file, options = {}) {
  validateCvPdf(file)
  ensureCloudinaryPreset(
    options.uploadPreset || CLOUDINARY_CV_UPLOAD_PRESET,
    'Cloudinary PDF uploads are not configured. Add VITE_CLOUDINARY_CV_UPLOAD_PRESET to your environment variables.',
  )

  return uploadToCloudinary('raw', file, {
    uploadPreset: options.uploadPreset || CLOUDINARY_CV_UPLOAD_PRESET,
    folder: options.folder || CLOUDINARY_CV_FOLDER,
    publicId: options.publicId,
  })
}

export { CLOUDINARY_CV_FOLDER, DEFAULT_PROFILE_IMAGE_URL, CLOUDINARY_PROFILE_FOLDER }
