"use client";

import React, { useState } from "react";
import { getSocialIconStrategy } from "./social-icon-strategies";

export interface SocialIconProps {
    platform: string | null | undefined;
    url?: string | null | undefined;
    className?: string;
}

function ExternalFavicon({
    url,
    className,
    fallback,
}: {
    url: string;
    className: string;
    fallback: React.ReactNode;
}) {
    const [failed, setFailed] = useState(false);

    let domain: string | null = null;
    try {
        const parsed = url.startsWith("http")
            ? new URL(url)
            : new URL(`https://${url}`);
        domain = parsed.hostname;
    } catch {
        domain = null;
    }

    if (!domain || failed) {
        return <>{fallback}</>;
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className={`${className} object-contain rounded-xs`}
            aria-hidden="true"
        />
    );
}

/**
 * Componente unificado de ícones sociais baseado no Padrão Strategy.
 * Resolução dinâmica O(1) de estratégias de ícone sem acoplamento a switch case.
 */
export function SocialIcon({
    platform,
    url,
    className = "h-4 w-4",
}: SocialIconProps) {
    const id = (platform || "link").toLowerCase().trim();
    const strategy = getSocialIconStrategy(id);

    // Caso especial para links/sites genéricos: tenta renderizar o favicon do domínio se a URL estiver presente
    if (
        (id === "link" ||
            id === "site" ||
            id === "globe" ||
            id === "website") &&
        url
    ) {
        return (
            <ExternalFavicon
                url={url}
                className={className}
                fallback={strategy.render(className)}
            />
        );
    }

    return <>{strategy.render(className)}</>;
}
