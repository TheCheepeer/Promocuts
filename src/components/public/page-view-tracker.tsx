"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/telemetry";

/**
 * Componente invisível de telemetria que registra visualizações de página na vitrine pública.
 * Ignora estritamente qualquer acesso ao painel administrativo (/admin*).
 */
export function PageViewTracker() {
    const pathname = usePathname();
    const lastTrackedPath = useRef<string | null>(null);

    useEffect(() => {
        if (!pathname) return;

        // Exclusão defensiva estrita de qualquer rota administrativa
        const lower = pathname.toLowerCase();
        if (lower === "/admin" || lower.startsWith("/admin/")) {
            return;
        }

        // Previne registros duplicados na mesma rota em renderizações consecutivas
        if (lastTrackedPath.current === pathname) {
            return;
        }

        lastTrackedPath.current = pathname;
        trackPageView(pathname);
    }, [pathname]);

    return null;
}

