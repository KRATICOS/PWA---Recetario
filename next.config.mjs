import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",


  // Registrar automáticamente el Service Worker
  register: true,

  // Activar inmediatamente el nuevo Service Worker
  skipWaiting: true,

  // Intentar actualizar la aplicación al recuperar Internet
  reloadOnOnline: true,

  // Guardar la página inicial
  cacheStartUrl: true,

  workboxOptions: {
    runtimeCaching: [
      {
        // Caché de las peticiones de TheMealDB
        // Las recetas consultadas podrán utilizarse sin Internet
        urlPattern:
          /^https:\/\/www\.themealdb\.com\/api\/json\/v1\/.*/i,

        handler: "NetworkFirst",

        options: {
          cacheName: "chefCasa-recipes-api",

          // Esperar hasta 5 segundos por Internet
          // antes de utilizar la versión almacenada
          networkTimeoutSeconds: 5,

          expiration: {
            maxEntries: 200,

            // Mantener las recetas almacenadas durante 30 días
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },

          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      {
        // Caché de las imágenes de las recetas
        urlPattern:
          /^https:\/\/www\.themealdb\.com\/images\/media\/.*/i,

        // Si la imagen ya está guardada, utilizarla directamente
        // sin necesidad de Internet
        handler: "CacheFirst",

        options: {
          cacheName: "chefCasa-recipe-images",

          expiration: {
            maxEntries: 200,

            // Mantener imágenes durante 30 días
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },

          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      {
        // Caché de las páginas de la aplicación
        // Permite recuperar la aplicación cuando no hay Internet
        urlPattern: ({ request }) =>
          request.destination === "document",

        handler: "NetworkFirst",

        options: {
          cacheName: "chefCasa-pages",

          networkTimeoutSeconds: 5,

          expiration: {
            maxEntries: 50,
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