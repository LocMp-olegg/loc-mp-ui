import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { CourierProfileService } from '@/api/identity'
import type { CourierProfileDto, UpdateCourierProfileRequest } from '@/api/identity'

export type { CourierProfileDto, UpdateCourierProfileRequest }

export function useCourierProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CourierProfileDto | null>(null)
  const [loading, setLoading] = useState(() => !!user)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    CourierProfileService.getApiIdentityProfileCourier()
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Ошибка загрузки профиля')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const updateProfile = useCallback(
    async (data: UpdateCourierProfileRequest): Promise<CourierProfileDto> => {
      const updated = await CourierProfileService.putApiIdentityProfileCourier({
        requestBody: data,
      })
      setProfile(updated)
      return updated
    },
    [],
  )

  const resign = useCallback(async (): Promise<void> => {
    await CourierProfileService.deleteApiIdentityProfileCourier()
  }, [])

  return { profile, loading, error, updateProfile, resign }
}
