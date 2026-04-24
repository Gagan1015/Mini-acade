type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

export type GeminiClientOptions = {
  apiKey?: string
  model?: string
  timeoutMs?: number
}

export class GeminiClient {
  private readonly apiKey: string
  private readonly model: string
  private readonly timeoutMs: number

  constructor(options: GeminiClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.GEMINI_API_KEY ?? ''
    this.model = options.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
    this.timeoutMs = options.timeoutMs ?? Number(process.env.TRIVIA_AI_TIMEOUT_MS ?? 3500)
  }

  get isConfigured() {
    return this.apiKey.length > 0
  }

  async generateJson(prompt: string) {
    if (!this.isConfigured) {
      throw new Error('Gemini API key is not configured.')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
          signal: controller.signal,
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini request failed with ${response.status}.`)
      }

      const payload = (await response.json()) as GeminiGenerateContentResponse
      const text = payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text
      if (!text) {
        throw new Error('Gemini returned no text.')
      }

      return JSON.parse(text) as unknown
    } finally {
      clearTimeout(timeout)
    }
  }
}
