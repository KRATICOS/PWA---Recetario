
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ChefCasa | Recetario",
  description:
    "Descubre, busca y guarda deliciosas recetas para preparar en casa con ChefCasa.",
  applicationName: "ChefCasa",
  keywords: [
    "recetas",
    "cocina",
    "comida casera",
    "recetario",
    "ChefCasa",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        
      </body>
    </html>
  );
}
