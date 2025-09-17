import { createEnv } from "@t3-oss/env-nextjs"
import * as v from "valibot"

export const env = createEnv({
  /*
   * サーバーサイドの環境変数です。クライアントでは使用できません。
   * クライアントでこれらの変数にアクセスすると例外がスローされます。
   */
  server: {
    STRIPE_SECRET_KEY: v.string(),
  },
  /*
   * クライアント（およびサーバー）で使用可能な環境変数です。
   *
   * 💡 これらの変数の前にNEXT_PUBLIC_を付けないと、型エラーが発生します。
   */
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: v.string(),
    NEXT_PUBLIC_STRIPE_LOCATION_ID: v.optional(v.string()),
    NEXT_PUBLIC_STRIPE_MODE: v.optional(v.picklist(["test", "live"])),
  },
  /*
   * Next.jsはEdgeとClientの環境変数をバンドルするため、
   * すべての環境変数がバンドルされるように、手動で環境変数を再構築する必要があります。
   *
   * 💡 `server` と `client` のすべての変数がここに含まれていないと、型エラーが発生します。
   */
  runtimeEnv: {
    // server
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,

    // client
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_LOCATION_ID: process.env.NEXT_PUBLIC_STRIPE_LOCATION_ID,
    NEXT_PUBLIC_STRIPE_MODE: process.env.NEXT_PUBLIC_STRIPE_MODE,
  },
})
