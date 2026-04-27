const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const CLOUDINARY_PROFILE_FOLDER =
  import.meta.env.VITE_CLOUDINARY_PROFILE_FOLDER || 'internhub/profile-images'

const DEFAULT_PROFILE_IMAGE_URL =
  'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

function ensureCloudinaryConfig() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your environment variables.',
    )
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

export async function uploadProfileImage(file, options = {}) {
  validateProfileImage(file)
  ensureCloudinaryConfig()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', options.folder || CLOUDINARY_PROFILE_FOLDER)

  if (options.publicId) {
    formData.append('public_id', options.publicId)
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result?.error?.message || 'The image could not be uploaded to Cloudinary.')
  }

  if (!result.secure_url) {
    throw new Error('Cloudinary did not return a valid image URL.')
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  }
}

export { DEFAULT_PROFILE_IMAGE_URL, CLOUDINARY_PROFILE_FOLDER }
