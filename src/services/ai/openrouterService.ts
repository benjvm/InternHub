const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-5.2'
const OPENROUTER_SITE_URL =
  import.meta.env.VITE_OPENROUTER_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : undefined)
const OPENROUTER_APP_NAME = import.meta.env.VITE_OPENROUTER_APP_NAME || 'InternHub'

export function ensureOpenRouterConfig() {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      'OpenRouter no esta configurado. Anade VITE_OPENROUTER_API_KEY a tus variables de entorno.',
    )
  }
}

export async function createOpenRouterChatCompletion(options: {
  messages: Array<{ role: string; content: string }>
  model?: string
  temperature?: number
  maxTokens?: number
}) {
  ensureOpenRouterConfig()

  const headers: Record<string, string> = {
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
      model: options.model || OPENROUTER_MODEL,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1800,
      messages: options.messages,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result?.error?.message || 'OpenRouter no pudo completar la solicitud.')
  }

  return result
}
