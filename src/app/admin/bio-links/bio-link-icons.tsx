import React from "react";
import {
    Twitch,
    Youtube,
    Globe,
    Link as LinkIcon,
    Heart,
    MessageCircle,
    Send,
} from "lucide-react";

export interface BioLinkIconOption {
    id: string;
    label: string;
    description: string;
    brandColor: string;
}

export const BIO_LINK_AVAILABLE_ICONS: BioLinkIconOption[] = [
    {
        id: "twitch",
        label: "Twitch",
        description: "Transmissões e lives",
        brandColor: "#9146FF",
    },
    {
        id: "kick",
        label: "Kick",
        description: "Canal de live streaming",
        brandColor: "#53FC18",
    },
    {
        id: "youtube",
        label: "YouTube",
        description: "Canal de vídeos e transmissões",
        brandColor: "#FF0000",
    },
    {
        id: "discord",
        label: "Discord",
        description: "Servidor e comunidade",
        brandColor: "#5865F2",
    },
    {
        id: "telegram",
        label: "Telegram",
        description: "Canal e grupo de ofertas",
        brandColor: "#229ED9",
    },
    {
        id: "whatsapp",
        label: "WhatsApp",
        description: "Comunidade ou grupo VIP",
        brandColor: "#25D366",
    },
    {
        id: "pix",
        label: "PIX",
        description: "Apoio e doações instantâneas",
        brandColor: "#32BCAD",
    },
    {
        id: "apoiase",
        label: "Apoia-se",
        description: "Financiamento coletivo contínuo",
        brandColor: "#FF2A54",
    },
    {
        id: "instagram",
        label: "Instagram",
        description: "Perfil e publicações",
        brandColor: "#E1306C",
    },
    {
        id: "tiktok",
        label: "TikTok",
        description: "Vídeos curtos e tendências",
        brandColor: "#000000",
    },
    {
        id: "x",
        label: "X (Twitter)",
        description: "Notícias e atualizações",
        brandColor: "#0F1419",
    },
    {
        id: "site",
        label: "Website / Blog",
        description: "Portal ou página oficial",
        brandColor: "#4B5563",
    },
    {
        id: "link",
        label: "Link Externo",
        description: "Qualquer página web",
        brandColor: "#6B7280",
    },
];

interface BioIconProps {
    name: string | null | undefined;
    className?: string;
}

export function BioLinkIcon({ name, className = "h-4 w-4" }: BioIconProps) {
    const iconId = (name || "link").toLowerCase().trim();

    switch (iconId) {
        case "twitch":
            return <Twitch className={className} aria-hidden="true" />;
        case "youtube":
            return <Youtube className={className} aria-hidden="true" />;
        case "kick":
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={className}
                    aria-hidden="true"
                >
                    <path d="M4 3h5v5.5l4-5.5h6l-6.5 8 7 10h-6l-4.5-6.5V21H4V3z" />
                </svg>
            );
        case "discord":
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={className}
                    aria-hidden="true"
                >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
            );
        case "telegram":
            return <Send className={className} aria-hidden="true" />;
        case "whatsapp":
            return <MessageCircle className={className} aria-hidden="true" />;
        case "pix":
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={className}
                    aria-hidden="true"
                >
                    <path d="M16.924 16.896l-3.92-3.92a1.414 1.414 0 0 1 0-2l3.92-3.92a3.782 3.782 0 0 1 5.348 0l.478.478a.946.946 0 0 1 0 1.338l-4.148 4.148a.946.946 0 0 0 0 1.338l4.148 4.148a.946.946 0 0 1 0 1.338l-.478.478a3.782 3.782 0 0 1-5.348 0zm-9.848 0l-4.148-4.148a.946.946 0 0 1 0-1.338L7.076 7.262a3.782 3.782 0 0 1 5.348 0l.478.478a.946.946 0 0 1 0 1.338l-3.92 3.92a1.414 1.414 0 0 0 0 2l3.92 3.92a.946.946 0 0 1 0 1.338l-.478.478a3.782 3.782 0 0 1-5.348 0z" />
                </svg>
            );
        case "apoiase":
            return <Heart className={className} aria-hidden="true" />;
        case "instagram":
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    aria-hidden="true"
                >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
            );
        case "tiktok":
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={className}
                    aria-hidden="true"
                >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.11V9.41a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.05a8.27 8.27 0 0 0 4.77 1.47V7.07a4.82 4.82 0 0 1-1-.38z" />
                </svg>
            );
        case "x":
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={className}
                    aria-hidden="true"
                >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            );
        case "site":
            return <Globe className={className} aria-hidden="true" />;
        default:
            return <LinkIcon className={className} aria-hidden="true" />;
    }
}
