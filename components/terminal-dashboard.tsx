"use client"

import { useState, useEffect } from "react"
import { Reader } from "@stripe/terminal-js"
import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCard,
  Wifi,
  WifiOff,
  Smartphone,
  Check,
  X,
  AlertCircle,
  Loader2,
  Terminal,
  Zap,
  Shield,
  ChevronRight,
  DollarSign,
  Activity,
  Radio,
  Power,
  Sparkles,
} from "lucide-react"
import { useStripeTerminal } from "@/hooks/use-stripe-terminal"
import { env } from "~/env"

export default function TerminalDashboard() {
  const {
    isInitialized,
    connectionStatus,
    paymentStatus,
    connectedReader,
    discoveredReaders,
    isDiscovering,
    error,
    discoverReaders,
    connectToReader,
    disconnectReader,
    collectPayment,
    cancelPayment,
    clearReaderDisplay,
  } = useStripeTerminal()

  const [amount, setAmount] = useState<string>("1000")
  // 本番環境では自動的にシミュレーターを無効化
  const isProduction = env.NEXT_PUBLIC_STRIPE_MODE === "live"
  const [useSimulator, setUseSimulator] = useState(!isProduction)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)

  useEffect(() => {
    if (paymentStatus === "succeeded") {
      setShowPaymentSuccess(true)
      setTimeout(() => setShowPaymentSuccess(false), 3000)
    }
  }, [paymentStatus])

  const handleDiscoverReaders = async () => {
    await discoverReaders(useSimulator)
  }

  const handleCollectPayment = async () => {
    const amountInCents = parseInt(amount)
    if (isNaN(amountInCents) || amountInCents <= 0) {
      alert("有効な金額を入力してください")
      return
    }
    await collectPayment(amountInCents)
  }

  const formatReaderLabel = (reader: Reader) => {
    return reader.label || reader.id
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "succeeded":
        return <Check className="w-4 h-4" />
      case "connecting":
      case "processing":
      case "reading":
      case "confirming":
        return <Loader2 className="w-4 h-4 animate-spin" />
      case "not_connected":
      case "failed":
        return <X className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
      case "succeeded":
        return "text-green-500"
      case "connecting":
      case "processing":
      case "reading":
      case "confirming":
        return "text-yellow-500"
      case "not_connected":
      case "failed":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getPaymentStatusMessage = () => {
    switch (paymentStatus) {
      case "reading":
        return "カードをタップまたは挿入してください..."
      case "confirming":
        return "支払いを処理中..."
      case "succeeded":
        return "支払いが完了しました！"
      case "failed":
        return "支払いに失敗しました。もう一度お試しください。"
      case "canceled":
        return "支払いがキャンセルされました。"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                <Terminal className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Stripe Terminal
                </h1>
                <p className="text-sm text-gray-500">Stripe Terminal 決済デモ</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">セキュア接続</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-600">高速処理</span>
              </div>
              {isProduction && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold">本番モード</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Status & Reader */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-6">
                <h2 className="text-white text-lg font-semibold flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  システムステータス
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Terminal className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">ターミナル</span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 ${isInitialized ? "text-green-500" : "text-red-500"}`}
                  >
                    {isInitialized ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {isInitialized ? "初期化済み" : "未初期化"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Wifi className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">接続状態</span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 ${getStatusColor(connectionStatus)}`}
                  >
                    {getStatusIcon(connectionStatus)}
                    <span className="text-sm font-medium">
                      {connectionStatus === "not_connected"
                        ? "未接続"
                        : connectionStatus === "connecting"
                          ? "接続中"
                          : connectionStatus === "connected"
                            ? "接続済み"
                            : connectionStatus === "disconnecting"
                              ? "切断中"
                              : String(connectionStatus)
                                  .replace(/_/g, " ")
                                  .toUpperCase()}
                    </span>
                  </div>
                </div>

                {connectedReader && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          接続中のリーダー
                        </p>
                        <p className="text-xs text-green-700">
                          {formatReaderLabel(connectedReader)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Reader Discovery Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6">
                <h2 className="text-white text-lg font-semibold flex items-center">
                  <Radio className="w-5 h-5 mr-2" />
                  リーダー検出
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={useSimulator}
                      onChange={(e) => setUseSimulator(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      シミュレーターモード
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      テスト用
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleDiscoverReaders}
                  disabled={
                    !isInitialized ||
                    isDiscovering ||
                    connectionStatus === "connected"
                  }
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isDiscovering ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>検出中...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-5 h-5" />
                      <span>リーダーを検出</span>
                    </>
                  )}
                </button>

                {/* Discovered Readers */}
                <AnimatePresence>
                  {discoveredReaders.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-2"
                    >
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        利用可能なリーダー
                      </p>
                      {discoveredReaders.map((reader, index) => (
                        <motion.div
                          key={reader.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg flex items-center justify-between hover:shadow-md transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <Smartphone className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatReaderLabel(reader)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {reader.device_type} • {reader.status}
                              </p>
                            </div>
                          </div>
                          {connectionStatus === "not_connected" && (
                            <button
                              onClick={() => connectToReader(reader)}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center space-x-1"
                            >
                              <span>接続</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Payment */}
          <div className="lg:col-span-2">
            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">エラー</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payment Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden ${
                connectionStatus !== "connected"
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
            >
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-8">
                <h2 className="text-white text-2xl font-bold flex items-center">
                  <CreditCard className="w-8 h-8 mr-3" />
                  決済処理
                </h2>
                <p className="text-purple-100 mt-2">安全で高速な決済体験</p>
              </div>

              <div className="p-8">
                {/* Amount Input */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    決済金額
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <span className="text-2xl font-bold text-gray-400">
                        ¥
                      </span>
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all"
                      placeholder="1000"
                      min="50"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <span className="text-sm text-gray-500">JPY</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-500">最小金額: ¥50</span>
                    <span className="text-lg font-semibold text-gray-700">
                      合計: ¥{(parseInt(amount) || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                  {["500", "1000", "3000", "5000"].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      ¥{parseInt(preset).toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Payment Status */}
                <AnimatePresence>
                  {paymentStatus !== "idle" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`mb-6 p-6 rounded-xl ${
                        paymentStatus === "succeeded"
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                          : paymentStatus === "failed"
                            ? "bg-gradient-to-r from-red-50 to-pink-50 border border-red-200"
                            : "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        {paymentStatus === "reading" && (
                          <>
                            <div className="p-3 bg-blue-100 rounded-full">
                              <CreditCard className="w-6 h-6 text-blue-600 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-blue-900">
                                カードを読み取り中
                              </p>
                              <p className="text-sm text-blue-700">
                                {getPaymentStatusMessage()}
                              </p>
                            </div>
                          </>
                        )}
                        {paymentStatus === "confirming" && (
                          <>
                            <div className="p-3 bg-yellow-100 rounded-full">
                              <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-yellow-900">
                                処理中
                              </p>
                              <p className="text-sm text-yellow-700">
                                {getPaymentStatusMessage()}
                              </p>
                            </div>
                          </>
                        )}
                        {paymentStatus === "succeeded" && (
                          <>
                            <div className="p-3 bg-green-100 rounded-full">
                              <Check className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-green-900">
                                決済完了
                              </p>
                              <p className="text-sm text-green-700">
                                {getPaymentStatusMessage()}
                              </p>
                            </div>
                          </>
                        )}
                        {paymentStatus === "failed" && (
                          <>
                            <div className="p-3 bg-red-100 rounded-full">
                              <X className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-red-900">
                                決済失敗
                              </p>
                              <p className="text-sm text-red-700">
                                {getPaymentStatusMessage()}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleCollectPayment}
                    disabled={
                      paymentStatus === "processing" ||
                      paymentStatus === "reading" ||
                      paymentStatus === "confirming" ||
                      connectionStatus !== "connected"
                    }
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-100 flex items-center justify-center space-x-2 stripe-button"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>決済を開始</span>
                    <Sparkles className="w-4 h-4" />
                  </button>

                  {(paymentStatus === "reading" ||
                    paymentStatus === "processing") && (
                    <button
                      onClick={cancelPayment}
                      className="px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2"
                    >
                      <X className="w-5 h-5" />
                      <span>キャンセル</span>
                    </button>
                  )}
                </div>

                {connectionStatus === "connected" && (
                  <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between">
                    <button
                      onClick={clearReaderDisplay}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors flex items-center space-x-2"
                    >
                      <Terminal className="w-4 h-4" />
                      <span>画面クリア</span>
                    </button>
                    <button
                      onClick={disconnectReader}
                      className="px-4 py-2 text-red-600 hover:text-red-700 font-medium transition-colors flex items-center space-x-2"
                    >
                      <Power className="w-4 h-4" />
                      <span>切断</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Success Animation */}
            <AnimatePresence>
              {showPaymentSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
                >
                  <div className="bg-white rounded-full p-8 shadow-2xl">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10 }}
                    >
                      <Check className="w-24 h-24 text-green-500" />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本日の取引</p>
                <p className="text-2xl font-bold text-gray-900">¥0</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">処理件数</p>
                <p className="text-2xl font-bold text-gray-900">0件</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">成功率</p>
                <p className="text-2xl font-bold text-gray-900">--%</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
