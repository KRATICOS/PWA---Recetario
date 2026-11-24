
export default function manifest() {
  return {
    id: "/",
    name: "ChefCasa - Recetario",
    short_name: "ChefCasa",
    description:
      "Descubre, busca y guarda deliciosas recetas para preparar en casa.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffaf3",
    theme_color: "#f97316",

    icons: [
      {
        src: "/assest/icons/icon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assest/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assest/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assest/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assest/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assest/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assest/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assest/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assest/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },

    ],
    screenshots: [
      {
        src: "/screenshots/chefCasa-desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "ChefCasa en computadora",
      },
      {
        src: "/screenshots/chefCasa-mobile.png",
        sizes: "390x844",
        type: "image/png",
        label: "ChefCasa en dispositivo móvil",
      },
    ],
  };
}
