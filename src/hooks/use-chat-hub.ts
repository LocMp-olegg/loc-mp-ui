import { useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { getAccessToken } from '@/lib/auth'
import type { MessageDto } from '@/api/chat'

const HUB_URL = '/hubs/chat'

export interface ChatHubCallbacks {
  onMessageReceived?: (message: MessageDto) => void
  onMessageDeleted?: (data: { chatId: string; messageId: string }) => void
  onChatClosed?: (data: { chatId: string }) => void
  onTyping?: (data: { chatId: string; userId: string; userName: string; isTyping: boolean }) => void
  onMessagesRead?: (data: { chatId: string; byUserId: string }) => void
}

export interface ChatHubHandle {
  joinChat: (chatId: string) => Promise<void>
  leaveChat: (chatId: string) => Promise<void>
  startTyping: (chatId: string) => Promise<void>
  stopTyping: (chatId: string) => Promise<void>
}

export function useChatHub(callbacks: ChatHubCallbacks): ChatHubHandle {
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const callbacksRef = useRef(callbacks)
  const joinedChatsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    callbacksRef.current = callbacks
  })

  const start = useCallback(async () => {
    if (connectionRef.current) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getAccessToken() ?? '',
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('message_received', (message: MessageDto) => {
      callbacksRef.current.onMessageReceived?.(message)
    })
    connection.on('message_deleted', (data: { chatId: string; messageId: string }) => {
      callbacksRef.current.onMessageDeleted?.(data)
    })
    connection.on('chat_closed', (data: { chatId: string }) => {
      callbacksRef.current.onChatClosed?.(data)
    })
    connection.on(
      'typing',
      (data: { chatId: string; userId: string; userName: string; isTyping: boolean }) => {
        callbacksRef.current.onTyping?.(data)
      },
    )
    connection.on('messages_read', (data: { chatId: string; byUserId: string }) => {
      callbacksRef.current.onMessagesRead?.(data)
    })

    connection.onreconnected(() => {
      for (const chatId of joinedChatsRef.current) {
        void connection.invoke('JoinChat', chatId).catch(() => {})
      }
    })

    connectionRef.current = connection
    try {
      await connection.start()
      for (const chatId of joinedChatsRef.current) {
        await connection.invoke('JoinChat', chatId).catch(() => {})
      }
    } catch {
      if (connectionRef.current === connection) {
        connectionRef.current = null
      }
    }
  }, [])

  const stop = useCallback(async () => {
    const conn = connectionRef.current
    connectionRef.current = null
    if (conn) {
      conn.off('message_received')
      conn.off('message_deleted')
      conn.off('chat_closed')
      conn.off('typing')
      conn.off('messages_read')
      await conn.stop()
    }
  }, [])

  useEffect(() => {
    void start()
    return () => {
      void stop()
    }
  }, [start, stop])

  const joinChat = useCallback(async (chatId: string) => {
    joinedChatsRef.current.add(chatId)
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('JoinChat', chatId)
    }
  }, [])

  const leaveChat = useCallback(async (chatId: string) => {
    joinedChatsRef.current.delete(chatId)
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('LeaveChat', chatId)
    }
  }, [])

  const startTyping = useCallback(async (chatId: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('StartTyping', chatId)
    }
  }, [])

  const stopTyping = useCallback(async (chatId: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('StopTyping', chatId)
    }
  }, [])

  return { joinChat, leaveChat, startTyping, stopTyping }
}
