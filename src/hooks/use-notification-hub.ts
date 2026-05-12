import { useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { getAccessToken } from '@/lib/auth'

const HUB_URL = '/hubs/notifications'

export function useNotificationHub(onNotificationReceived: () => void) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const onReceived = useRef(onNotificationReceived)
  useEffect(() => {
    onReceived.current = onNotificationReceived
  })

  const start = useCallback(async () => {
    if (connectionRef.current) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getAccessToken() ?? '',
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('notification_received', () => {
      onReceived.current()
    })

    connectionRef.current = connection

    try {
      await connection.start()
    } catch {
      connectionRef.current = null
    }
  }, [])

  const stop = useCallback(async () => {
    const conn = connectionRef.current
    connectionRef.current = null
    if (conn) {
      conn.off('notification_received')
      await conn.stop()
    }
  }, [])

  useEffect(() => {
    void start()
    return () => {
      void stop()
    }
  }, [start, stop])
}
