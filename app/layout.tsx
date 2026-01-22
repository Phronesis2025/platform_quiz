import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Platform Quiz",
  description: "Test your knowledge with our platform quiz",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
