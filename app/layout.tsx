import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata = {
  title: "OmniMind — The Intelligent Second Brain",
  description:
    "Dump any link, thought, or idea. Let 5 specialized AI agents organize your life automatically.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}