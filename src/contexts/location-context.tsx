import { createContext, useContext, useState, type ReactNode } from 'react'

export interface UserLocation {
  lat: number
  lng: number
  label: string
  radius: number // km
}

interface LocationContextValue {
  location: UserLocation | null
  setLocation: (loc: UserLocation) => void
  clearLocation: () => void
}

const LocationContext = createContext<LocationContextValue | null>(null)

const STORAGE_KEY = 'user-location'

function readStored(): UserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UserLocation) : null
  } catch {
    return null
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<UserLocation | null>(readStored)

  const setLocation = (loc: UserLocation) => {
    setLocationState(loc)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
  }

  const clearLocation = () => {
    setLocationState(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <LocationContext.Provider value={{ location, setLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useUserLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useUserLocation must be used within LocationProvider')
  return ctx
}
