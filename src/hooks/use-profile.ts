import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

const API = 'http://localhost:5000'

export interface UserProfileDto {
  id: string
  userName: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  gender: 'Male' | 'Female' | null
  birthDate: string | null
  phoneNumber: string | null
  registeredAt: string
  hasPhoto: boolean
  photoMimeType: string | null
  photoVersion: number | null
  roles: string[] | null
}

export interface UpdateProfileData {
  firstName?: string | null
  lastName?: string | null
  gender?: 'Male' | 'Female' | null
  birthDate?: string | null
  phoneNumber?: string | null
  isSeller?: boolean | null
}

async function fetchPhotoBlob(): Promise<string | null> {
  try {
    const res = await fetch(`${API}/api/identity/profile/photo`)
    if (!res.ok) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfileDto | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !!user)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    fetch(`${API}/api/identity/profile`)
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка загрузки профиля')
        return res.json() as Promise<UserProfileDto>
      })
      .then(async (data) => {
        if (cancelled) return
        setProfile(data)
        if (data.hasPhoto) {
          const url = await fetchPhotoBlob()
          if (!cancelled) setPhotoUrl(url)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Ошибка')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  // Revoke blob URL whenever it changes (and on unmount with the last value)
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<UserProfileDto> => {
    const res = await fetch(`${API}/api/identity/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Ошибка сохранения')
    const updated = (await res.json()) as UserProfileDto
    setProfile(updated)
    return updated
  }, [])

  const uploadPhoto = useCallback(async (file: File): Promise<void> => {
    const form = new FormData()
    form.append('photo', file)
    const res = await fetch(`${API}/api/identity/profile/photo`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) throw new Error('Ошибка загрузки фото')
    const url = await fetchPhotoBlob()
    setPhotoUrl(url)
    setProfile((prev) => (prev ? { ...prev, hasPhoto: true } : prev))
  }, [])

  const deletePhoto = useCallback(async (): Promise<void> => {
    const res = await fetch(`${API}/api/identity/profile/photo`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Ошибка удаления фото')
    setPhotoUrl(null)
    setProfile((prev) => (prev ? { ...prev, hasPhoto: false } : prev))
  }, [])

  const logoutAll = useCallback(async (): Promise<void> => {
    const res = await fetch(`${API}/api/identity/profile/logout-all`, { method: 'POST' })
    if (!res.ok) throw new Error('Ошибка при выходе')
  }, [])

  return { profile, photoUrl, loading, error, updateProfile, uploadPhoto, deletePhoto, logoutAll }
}
