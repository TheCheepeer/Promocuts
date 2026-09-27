import type { Metadata } from "next";
import { ThemeScript } from "@/components/theme-script";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
    title: "PromoCuts — Cortes Virais e Achadinhos de Afiliados",
    description:
        "Descubra as melhores promocoes e produtos recomendados atraves de videos curtos verticais.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <head>
                <ThemeScript />
            </head>
            <body className="antialiased min-h-dvh bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors">
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
