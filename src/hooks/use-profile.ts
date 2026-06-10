import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { UserProfileService } from '@/api/identity'
import { OpenAPI } from '@/api/identity/core/OpenAPI'
import type { UserProfileDto, UpdateUserProfileRequest } from '@/api/identity'

export type { UserProfileDto }
export type { UpdateUserProfileRequest as UpdateProfileData }

async function fetchPhotoBlob(): Promise<string | null> {
  try {
    const res = await fetch(`${OpenAPI.BASE}/api/identity/profile/photo`)
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

    UserProfileService.getApiIdentityProfile()
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

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  const updateProfile = useCallback(
    async (data: UpdateUserProfileRequest): Promise<UserProfileDto> => {
      const updated = await UserProfileService.patchApiIdentityProfile({ requestBody: data })
      setProfile(updated)
      return updated
    },
    [],
  )

  const uploadPhoto = useCallback(async (file: File): Promise<void> => {
    await UserProfileService.postApiIdentityProfilePhoto({ formData: { photo: file } })
    const url = await fetchPhotoBlob()
    setPhotoUrl(url)
    setProfile((prev) => (prev ? { ...prev, hasPhoto: true } : prev))
  }, [])

  const deletePhoto = useCallback(async (): Promise<void> => {
    await UserProfileService.deleteApiIdentityProfilePhoto()
    setPhotoUrl(null)
    setProfile((prev) => (prev ? { ...prev, hasPhoto: false } : prev))
  }, [])

  const logoutAll = useCallback(async (): Promise<void> => {
    await UserProfileService.postApiIdentityProfileLogoutAll()
  }, [])

  return { profile, photoUrl, loading, error, updateProfile, uploadPhoto, deletePhoto, logoutAll }
}
