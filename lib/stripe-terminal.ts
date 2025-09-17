import { loadStripeTerminal, Terminal, Reader } from "@stripe/terminal-js"
import { env } from "~/env"

export type ConnectionStatus =
  | "not_connected"
  | "connecting"
  | "connected"
  | "disconnecting"

export type PaymentStatus =
  | "idle"
  | "processing"
  | "reading"
  | "confirming"
  | "succeeded"
  | "failed"
  | "canceled"

interface TerminalConfig {
  onFetchConnectionToken: () => Promise<string>
  onUnexpectedReaderDisconnect?: () => void
  onConnectionStatusChange?: (status: ConnectionStatus) => void
  onPaymentStatusChange?: (status: PaymentStatus) => void
}

class StripeTerminalManager {
  private terminal: Terminal | null = null
  private connectedReader: Reader | null = null
  private config: TerminalConfig
  private connectionStatus: ConnectionStatus = "not_connected"
  private paymentStatus: PaymentStatus = "idle"

  constructor(config: TerminalConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    if (this.terminal) {
      console.log("Terminal already initialized")
      return
    }

    try {
      const StripeTerminal = await loadStripeTerminal()

      if (!StripeTerminal) {
        throw new Error("Stripe Terminal SDKの読み込みに失敗しました")
      }

      this.terminal = StripeTerminal.create({
        onFetchConnectionToken: this.config.onFetchConnectionToken,
        onUnexpectedReaderDisconnect: () => {
          console.log("Unexpected reader disconnect")
          this.connectedReader = null
          this.updateConnectionStatus("not_connected")
          this.config.onUnexpectedReaderDisconnect?.()
        },
      })

      console.log("Terminal initialized successfully")
    } catch (error) {
      console.error("Failed to initialize terminal:", error)
      throw error
    }
  }

  async discoverReaders(simulated: boolean = false): Promise<Reader[]> {
    if (!this.terminal) {
      throw new Error("ターミナルが初期化されていません")
    }

    try {
      const config = simulated
        ? { simulated: true }
        : env.NEXT_PUBLIC_STRIPE_LOCATION_ID
          ? { location: env.NEXT_PUBLIC_STRIPE_LOCATION_ID }
          : {}

      const discoverResult = await this.terminal.discoverReaders(config)

      if ("error" in discoverResult && discoverResult.error) {
        const errorMessage =
          (discoverResult.error as { message?: string })?.message ||
          "リーダーの検出に失敗しました"
        throw new Error(errorMessage)
      }

      return (
        ("discoveredReaders" in discoverResult &&
          discoverResult.discoveredReaders) ||
        []
      )
    } catch (error) {
      console.error("Failed to discover readers:", error)
      throw error
    }
  }

  async connectToReader(reader: Reader): Promise<void> {
    if (!this.terminal) {
      throw new Error("ターミナルが初期化されていません")
    }

    try {
      this.updateConnectionStatus("connecting")

      const connectResult = await this.terminal.connectReader(reader)

      if ("error" in connectResult && connectResult.error) {
        this.updateConnectionStatus("not_connected")
        const errorMessage =
          (connectResult.error as { message?: string })?.message ||
          "接続に失敗しました"
        throw new Error(errorMessage)
      }

      this.connectedReader =
        "reader" in connectResult ? connectResult.reader : null
      this.updateConnectionStatus("connected")
      console.log("Connected to reader:", this.connectedReader)
    } catch (error) {
      this.updateConnectionStatus("not_connected")
      console.error("Failed to connect to reader:", error)
      throw error
    }
  }

  async disconnectReader(): Promise<void> {
    if (!this.terminal || !this.connectedReader) {
      console.log("No reader connected")
      return
    }

    try {
      this.updateConnectionStatus("disconnecting")

      const disconnectResult = await this.terminal.disconnectReader()

      if ("error" in disconnectResult && disconnectResult.error) {
        const errorMessage =
          (disconnectResult.error as { message?: string })?.message ||
          "切断に失敗しました"
        throw new Error(errorMessage)
      }

      this.connectedReader = null
      this.updateConnectionStatus("not_connected")
      console.log("Disconnected from reader")
    } catch (error) {
      console.error("Failed to disconnect reader:", error)
      throw error
    }
  }

  async collectPayment(clientSecret: string): Promise<void> {
    if (!this.terminal || !this.connectedReader) {
      throw new Error("リーダーが接続されていません")
    }

    try {
      this.updatePaymentStatus("reading")

      const collectResult =
        await this.terminal.collectPaymentMethod(clientSecret)

      if ("error" in collectResult && collectResult.error) {
        this.updatePaymentStatus("failed")
        const errorMessage =
          (collectResult.error as { message?: string })?.message ||
          "支払いの受け付けに失敗しました"
        throw new Error(errorMessage)
      }

      this.updatePaymentStatus("confirming")

      const paymentIntent =
        "paymentIntent" in collectResult ? collectResult.paymentIntent : null
      if (!paymentIntent) {
        throw new Error("支払いインテントが見つかりません")
      }

      const confirmResult = await this.terminal.processPayment(paymentIntent)

      if ("error" in confirmResult && confirmResult.error) {
        this.updatePaymentStatus("failed")
        const errorMessage =
          (confirmResult.error as { message?: string })?.message ||
          "支払いの確認に失敗しました"
        throw new Error(errorMessage)
      }

      this.updatePaymentStatus("succeeded")
      console.log(
        "Payment processed successfully:",
        "paymentIntent" in confirmResult ? confirmResult.paymentIntent : null,
      )
    } catch (error) {
      this.updatePaymentStatus("failed")
      console.error("Failed to collect payment:", error)
      throw error
    }
  }

  async cancelPayment(): Promise<void> {
    if (!this.terminal) {
      throw new Error("ターミナルが初期化されていません")
    }

    try {
      const cancelResult = await this.terminal.cancelCollectPaymentMethod()

      if ("error" in cancelResult && cancelResult.error) {
        const errorMessage =
          (cancelResult.error as { message?: string })?.message ||
          "支払いのキャンセルに失敗しました"
        throw new Error(errorMessage)
      }

      this.updatePaymentStatus("canceled")
      console.log("Payment collection canceled")
    } catch (error) {
      console.error("Failed to cancel payment:", error)
      throw error
    }
  }

  async clearReaderDisplay(): Promise<void> {
    if (!this.terminal || !this.connectedReader) {
      console.log("No reader connected")
      return
    }

    try {
      const clearResult = await this.terminal.clearReaderDisplay()

      if ("error" in clearResult && clearResult.error) {
        const errorMessage =
          (clearResult.error as { message?: string })?.message ||
          "ディスプレイのクリアに失敗しました"
        throw new Error(errorMessage)
      }

      console.log("Reader display cleared")
    } catch (error) {
      console.error("Failed to clear reader display:", error)
      throw error
    }
  }

  private updateConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status
    this.config.onConnectionStatusChange?.(status)
  }

  private updatePaymentStatus(status: PaymentStatus): void {
    this.paymentStatus = status
    this.config.onPaymentStatusChange?.(status)
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  getPaymentStatus(): PaymentStatus {
    return this.paymentStatus
  }

  getConnectedReader(): Reader | null {
    return this.connectedReader
  }

  isInitialized(): boolean {
    return this.terminal !== null
  }
}

export default StripeTerminalManager
