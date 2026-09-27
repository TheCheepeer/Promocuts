import React from "react";
import * as LucideIcons from "lucide-react";
import { Folder } from "lucide-react";

interface DynamicCategoryIconProps {
    name?: string | null;
    className?: string;
}

/**
 * Renderizador dinamico seguro de icones da Lucide React com fallback gracioso.
 */
export function DynamicCategoryIcon({
    name,
    className = "h-4 w-4",
}: DynamicCategoryIconProps) {
    if (!name || name.trim() === "") {
        return <Folder className={className} aria-hidden="true" />;
    }

    // Normalizacao: converte formatos como "gamepad-2" ou "gamepad_2" para PascalCase "Gamepad2"
    const normalizedName = name
        .trim()
        .split(/[-_]/)
        .map(
            (part) =>
                part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join("");

    const iconsMap = LucideIcons as unknown as Record<
        string,
        React.ComponentType<{ className?: string }>
    >;
    const IconComponent = iconsMap[normalizedName] || iconsMap[name] || Folder;

    return <IconComponent className={className} aria-hidden="true" />;
}
