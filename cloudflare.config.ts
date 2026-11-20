import { bindings, defineConfig, defineWorker } from "cf/config";

// Server-side env vars read via process.env. Locally they come from .env.local;
// in production set each one with `npx cf workers secrets put <NAME>` (or the dashboard).
const secret = () => bindings.secret();

export default defineConfig({
  worker: defineWorker({
    name: "angelsandroadsters",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-11",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),

      // Mirrors the production env set on Vercel (optional: EMAIL_SECURE,
      // EMAIL_PASSWORD, NEXT_PUBLIC_SITE_URL are read with fallbacks).
      MONGODB_URI: secret(),

      JWT_SECRET: secret(),
      JWT_REFRESH_SECRET: secret(),
      JWT_EXPIRES_IN: secret(),
      JWT_REFRESH_EXPIRES_IN: secret(),

      CLOUDINARY_CLOUD_NAME: secret(),
      CLOUDINARY_API_KEY: secret(),
      CLOUDINARY_API_SECRET: secret(),

      RAZORPAY_KEY_ID: secret(),
      RAZORPAY_KEY_SECRET: secret(),
      NEXT_PUBLIC_RAZORPAY_KEY_ID: secret(),

      NEXT_PUBLIC_APP_URL: secret(),
      NEXT_PUBLIC_APP_NAME: secret(),

      EMAIL_HOST: secret(),
      EMAIL_PORT: secret(),
      EMAIL_USER: secret(),
      EMAIL_PASS: secret(),
      EMAIL_FROM: secret(),

      GROQ_API_KEY: secret(),
    },
  }),
});
