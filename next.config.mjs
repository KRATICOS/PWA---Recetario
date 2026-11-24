
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",

  // No activar el Service Worker durante el desarrollo
  disable: process.env.NODE_ENV === "development",

  // Registrar automáticamente el Service Worker
  register: true,

  // Activar el nuevo Service Worker cuando esté disponible
  skipWaiting: true,

  // Actualizar la aplicación cuando vuelva la conexión
  reloadOnOnline: true,

  // Permitir almacenar la página inicial
  cacheStartUrl: true,

  // Configurar caché de recursos y peticiones
  workboxOptions: {
    runtimeCaching: [
      {
        // Caché de consultas a TheMealDB
        urlPattern:
          /^https:\/\/www\.themealdb\.com\/api\/json\/v1\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "chefCasa-recipes-api",
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // Caché de imágenes de recetas
        urlPattern:
          /^https:\/\/www\.themealdb\.com\/images\/media\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "chefCasa-recipe-images",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withPWA(nextConfig);
