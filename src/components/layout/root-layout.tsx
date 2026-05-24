import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/contexts/auth-context'
import { ChatProvider } from '@/contexts/chat-context'

export function RootLayout() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Outlet />
      </ChatProvider>
    </AuthProvider>
  )
}
