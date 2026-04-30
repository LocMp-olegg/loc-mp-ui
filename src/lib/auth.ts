const TOKEN_ENDPOINT = 'http://localhost:5000/connect/token'
const REFRESH_TOKEN_KEY = 'rt'
const CLIENT_ID = 'default-client'

let _accessToken: string | null = null
let _refreshPromise: Promise<string> | null = null
let _onAuthFailure: (() => void) | null = null

export function getAccessToken(): string | null {
  return _accessToken
}

export function setOnAuthFailure(cb: () => void): void {
  _onAuthFailure = cb
}

export function setTokens(at: string, rt?: string): void {
  _accessToken = at
  if (rt) sessionStorage.setItem(REFRESH_TOKEN_KEY, rt)
}

export function clearTokens(): void {
  _accessToken = null
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getStoredRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

const _originalFetch = window.fetch.bind(window)

export async function loginRequest(
  usernameOrEmail: string,
  password: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'password',
    username: usernameOrEmail,
    password,
    client_id: CLIENT_ID,
    scope: 'openid profile offline_access IdentityServerApi',
  })
  const res = await _originalFetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error_description?: string } | null
    throw new Error(err?.error_description ?? 'Неверные данные для входа')
  }
  return res.json() as Promise<TokenResponse>
}

async function _doRefresh(): Promise<string> {
  const rt = getStoredRefreshToken()
  if (!rt) throw new Error('No refresh token')
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: rt,
    client_id: CLIENT_ID,
  })
  const res = await _originalFetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error('Refresh failed')
  const data = (await res.json()) as TokenResponse
  setTokens(data.access_token, data.refresh_token)
  return data.access_token
}

export async function refreshAccessToken(): Promise<string> {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = _doRefresh().finally(() => {
    _refreshPromise = null
  })
  return _refreshPromise
}

function _getUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return (input as Request).url
}

export function installFetchInterceptor(): void {
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (_getUrl(input).includes('/connect/token')) {
      return _originalFetch(input, init)
    }

    const token = _accessToken
    const headers = new Headers(init?.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const res = await _originalFetch(input, { ...init, headers })

    if (res.status !== 401) return res

    try {
      const newToken = await refreshAccessToken()
      const retryHeaders = new Headers(init?.headers)
      retryHeaders.set('Authorization', `Bearer ${newToken}`)
      return _originalFetch(input, { ...init, headers: retryHeaders })
    } catch {
      clearTokens()
      _onAuthFailure?.()
      return res
    }
  }
}

export function parseJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1]
    if (!payload) return {}
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as Record<
      string,
      unknown
    >
  } catch {
    return {}
  }
}
