import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Brick Bot",
  description: "Brick Bot! - Get Anki cards from a practice convo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}