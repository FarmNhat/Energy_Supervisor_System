import { useEffect, useState } from 'react';

export type RealtimeSocketState = 'connecting' | 'open' | 'closed';

export function useRealtimeMetrics<T>(socketUrl: string | null) {
  const [message, setMessage] = useState<T | null>(null);
  const [state, setState] = useState<RealtimeSocketState>('closed');

  useEffect(() => {
    if (!socketUrl) {
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) {
        return;
      }

      setState('connecting');
      socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        setState('open');
      };

      socket.onmessage = (event) => {
        try {
          setMessage(JSON.parse(event.data) as T);
        } catch {
          return;
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        setState('closed');
        if (!cancelled) {
          reconnectTimer = window.setTimeout(connect, 1500);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [socketUrl]);

  return { message, state };
}
