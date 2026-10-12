import React from "react";
import { SOCIAL_PLATFORMS, type PlatformCategory } from "@/lib/social/strategies";
import { SocialIcon } from "@/components/public/social-icon";

export interface BioLinkIconOption {
    id: string;
    label: string;
    description: string;
    brandColor: string;
    category?: PlatformCategory;
}

export const BIO_LINK_AVAILABLE_ICONS: BioLinkIconOption[] = SOCIAL_PLATFORMS.map((p) => ({
    id: p.id,
    label: p.name,
    description: p.placeholder,
    brandColor: p.brandColor,
    category: p.category,
}));

interface BioIconProps {
    name: string | null | undefined;
    className?: string;
}

export function BioLinkIcon({ name, className = "h-4 w-4" }: BioIconProps) {
    return <SocialIcon platform={name} className={className} />;
}
