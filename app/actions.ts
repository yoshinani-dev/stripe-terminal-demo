"use server"

import Stripe from "stripe"
import { env } from "~/env"

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
})

export async function createConnectionToken(): Promise<
  { secret: string } | { error: string }
> {
  try {
    const connectionToken = await stripe.terminal.connectionTokens.create()
    return { secret: connectionToken.secret }
  } catch (error) {
    console.error("Error creating connection token:", error)
    return { error: "接続トークンの作成に失敗しました" }
  }
}

export async function createPaymentIntent(
  amount: number,
  currency: string = "jpy",
): Promise<
  { clientSecret: string; paymentIntentId: string } | { error: string }
> {
  try {
    if (!amount || amount <= 0) {
      return { error: "無効な金額です" }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ["card_present"],
      capture_method: "automatic",
    })

    return {
      clientSecret: paymentIntent.client_secret || "",
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return { error: "支払いインテントの作成に失敗しました" }
  }
}

export async function capturePaymentIntent(
  paymentIntentId: string,
): Promise<
  { success: boolean; paymentIntent?: Stripe.PaymentIntent } | { error: string }
> {
  try {
    if (!paymentIntentId) {
      return { error: "支払いインテントIDが必要です" }
    }

    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId)

    return {
      success: true,
      paymentIntent,
    }
  } catch (error) {
    console.error("Error capturing payment intent:", error)
    return { error: "支払いのキャプチャに失敗しました" }
  }
}

export async function cancelPaymentIntent(
  paymentIntentId: string,
): Promise<{ success: boolean } | { error: string }> {
  try {
    if (!paymentIntentId) {
      return { error: "支払いインテントIDが必要です" }
    }

    await stripe.paymentIntents.cancel(paymentIntentId)

    return { success: true }
  } catch (error) {
    console.error("Error canceling payment intent:", error)
    return { error: "支払いのキャンセルに失敗しました" }
  }
}

export async function getPaymentIntent(
  paymentIntentId: string,
): Promise<{ paymentIntent: Stripe.PaymentIntent } | { error: string }> {
  try {
    if (!paymentIntentId) {
      return { error: "支払いインテントIDが必要です" }
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    return { paymentIntent }
  } catch (error) {
    console.error("Error retrieving payment intent:", error)
    return { error: "支払い情報の取得に失敗しました" }
  }
}
