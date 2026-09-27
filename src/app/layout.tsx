import type { Metadata } from "next";
import { ThemeScript } from "@/components/theme-script";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();

    const titleDefault = settings.site_tagline
        ? `${settings.site_name} — ${settings.site_tagline}`
        : settings.site_name;

    const icons: Array<{ url: string; media?: string }> = [];

    if (settings.favicon_url_light && settings.favicon_url_dark) {
        icons.push(
            {
                url: settings.favicon_url_light,
                media: "(prefers-color-scheme: light)",
            },
            {
                url: settings.favicon_url_dark,
                media: "(prefers-color-scheme: dark)",
            },
        );
    } else if (settings.favicon_url_light) {
        icons.push({ url: settings.favicon_url_light });
    } else if (settings.favicon_url_dark) {
        icons.push({ url: settings.favicon_url_dark });
    }

    return {
        title: {
            default: titleDefault,
            template: `%s | ${settings.site_name}`,
        },
        description: settings.site_description || undefined,
        icons: icons.length > 0 ? icons : undefined,
        openGraph: {
            title: titleDefault,
            description: settings.site_description || undefined,
            siteName: settings.site_name,
            images: settings.logo_url_light
                ? [{ url: settings.logo_url_light }]
                : [],
        },
    };
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const settings = await getSiteSettings();

    const dynamicBrandCss = `
        :root {
            --brand-primary-light: ${settings.primary_color_light};
            --brand-secondary-light: ${settings.secondary_color_light};
            --brand-primary-dark: ${settings.primary_color_dark};
            --brand-secondary-dark: ${settings.secondary_color_dark};
            --brand-primary: var(--brand-primary-light);
            --brand-secondary: var(--brand-secondary-light);
        }
        .dark {
            --brand-primary: var(--brand-primary-dark);
            --brand-secondary: var(--brand-secondary-dark);
        }
        @media (prefers-color-scheme: dark) {
            :root:not(.light) {
                --brand-primary: var(--brand-primary-dark);
                --brand-secondary: var(--brand-secondary-dark);
            }
        }
    `;

    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <head>
                <ThemeScript />
                <style
                    dangerouslySetInnerHTML={{
                        __html: dynamicBrandCss,
                    }}
                />
            </head>
            <body className="antialiased min-h-dvh bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors">
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
