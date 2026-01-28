import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Role Alignment Assessment",
  description:
    "Identify how individuals naturally approach problem-solving, risk, and delivery under pressure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
