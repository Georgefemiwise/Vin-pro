import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIN Decoder",
  description: "Decode any 17-character Vehicle Identification Number instantly using NHTSA data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.theme==='dark'||(!localStorage.theme&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch{}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
