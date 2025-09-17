"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Reader } from "@stripe/terminal-js"
import StripeTerminalManager, {
  ConnectionStatus,
  PaymentStatus,
} from "@/lib/stripe-terminal"
import { createConnectionToken, createPaymentIntent } from "@/app/actions"

interface UseStripeTerminalReturn {
  isInitialized: boolean
  connectionStatus: ConnectionStatus
  paymentStatus: PaymentStatus
  connectedReader: Reader | null
  discoveredReaders: Reader[]
  isDiscovering: boolean
  error: string | null
  initialize: () => Promise<void>
  discoverReaders: (simulated?: boolean) => Promise<void>
  connectToReader: (reader: Reader) => Promise<void>
  disconnectReader: () => Promise<void>
  collectPayment: (amount: number) => Promise<void>
  cancelPayment: () => Promise<void>
  clearReaderDisplay: () => Promise<void>
}

export function useStripeTerminal(): UseStripeTerminalReturn {
  const terminalRef = useRef<StripeTerminalManager | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("not_connected")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")
  const [connectedReader, setConnectedReader] = useState<Reader | null>(null)
  const [discoveredReaders, setDiscoveredReaders] = useState<Reader[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConnectionToken = useCallback(async (): Promise<string> => {
    try {
      const result = await createConnectionToken()

      if ("error" in result) {
        throw new Error(result.error)
      }

      return result.secret
    } catch (error) {
      console.error("Error fetching connection token:", error)
      throw error
    }
  }, [])

  const initialize = useCallback(async () => {
    if (terminalRef.current?.isInitialized()) {
      console.log("Terminal already initialized")
      return
    }

    try {
      setError(null)

      const terminal = new StripeTerminalManager({
        onFetchConnectionToken: fetchConnectionToken,
        onUnexpectedReaderDisconnect: () => {
          setConnectedReader(null)
          setConnectionStatus("not_connected")
          setError("リーダーが予期せず切断されました")
        },
        onConnectionStatusChange: (status) => {
          setConnectionStatus(status)
        },
        onPaymentStatusChange: (status) => {
          setPaymentStatus(status)
        },
      })

      await terminal.initialize()
      terminalRef.current = terminal
      setIsInitialized(true)
      console.log("Terminal initialized successfully")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "ターミナルの初期化に失敗しました"
      setError(message)
      console.error("Terminal initialization error:", err)
    }
  }, [fetchConnectionToken])

  const discoverReaders = useCallback(async (simulated: boolean = false) => {
    if (!terminalRef.current) {
      setError("ターミナルが初期化されていません")
      return
    }

    try {
      setError(null)
      setIsDiscovering(true)

      const readers = await terminalRef.current.discoverReaders(simulated)
      setDiscoveredReaders(readers)

      if (readers.length === 0) {
        setError(
          "リーダーが見つかりません。Stripe認定リーダーが接続されているか確認してください。",
        )
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "リーダーの検出に失敗しました"
      setError(message)
      console.error("Reader discovery error:", err)
    } finally {
      setIsDiscovering(false)
    }
  }, [])

  const connectToReader = useCallback(async (reader: Reader) => {
    if (!terminalRef.current) {
      setError("ターミナルが初期化されていません")
      return
    }

    try {
      setError(null)
      await terminalRef.current.connectToReader(reader)
      setConnectedReader(reader)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "リーダーへの接続に失敗しました"
      setError(message)
      console.error("Reader connection error:", err)
    }
  }, [])

  const disconnectReader = useCallback(async () => {
    if (!terminalRef.current) {
      setError("ターミナルが初期化されていません")
      return
    }

    try {
      setError(null)
      await terminalRef.current.disconnectReader()
      setConnectedReader(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "リーダーの切断に失敗しました"
      setError(message)
      console.error("Reader disconnection error:", err)
    }
  }, [])

  const collectPayment = useCallback(
    async (amount: number) => {
      if (!terminalRef.current) {
        setError("ターミナルが初期化されていません")
        return
      }

      if (!connectedReader) {
        setError("リーダーが接続されていません")
        return
      }

      try {
        setError(null)

        // Create payment intent using Server Action
        const result = await createPaymentIntent(amount)

        if ("error" in result) {
          throw new Error(result.error)
        }

        const { clientSecret } = result

        // Collect payment
        await terminalRef.current.collectPayment(clientSecret)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "支払いの受け付けに失敗しました"
        setError(message)
        console.error("Payment collection error:", err)
      }
    },
    [connectedReader],
  )

  const cancelPayment = useCallback(async () => {
    if (!terminalRef.current) {
      setError("ターミナルが初期化されていません")
      return
    }

    try {
      setError(null)
      await terminalRef.current.cancelPayment()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "支払いのキャンセルに失敗しました"
      setError(message)
      console.error("Payment cancellation error:", err)
    }
  }, [])

  const clearReaderDisplay = useCallback(async () => {
    if (!terminalRef.current) {
      setError("ターミナルが初期化されていません")
      return
    }

    try {
      setError(null)
      await terminalRef.current.clearReaderDisplay()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "ディスプレイのクリアに失敗しました"
      setError(message)
      console.error("Clear display error:", err)
    }
  }, [])

  // Auto-initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [initialize, isInitialized])

  return {
    isInitialized,
    connectionStatus,
    paymentStatus,
    connectedReader,
    discoveredReaders,
    isDiscovering,
    error,
    initialize,
    discoverReaders,
    connectToReader,
    disconnectReader,
    collectPayment,
    cancelPayment,
    clearReaderDisplay,
  }
}
