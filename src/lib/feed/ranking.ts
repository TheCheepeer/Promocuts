export interface RankableVideo {
    id: string;
    created_at: string;
}

/**
 * Calcula a pontuação dinâmica de um vídeo com base em sua recência temporal
 * combinada com uma perturbação estocástica controlada (jitter).
 *
 * Fórmula:
 * - Decaimento suave com meia-vida de 24 horas: recencyScore = 100 / (1 + (ageInHours / 24)^0.75)
 * - Jitter aleatório entre 0 e 25 pontos adicionados para criar dinamismo sem rebaixar novidades
 */
export function calculateVideoScore(
    createdAt: string,
    now: number = Date.now(),
    customRandom?: () => number,
): number {
    const createdTime = new Date(createdAt).getTime();
    const ageInHours = Math.max(0, (now - createdTime) / (1000 * 60 * 60));

    // Curva de decaimento suave
    const recencyScore = 100 / (1 + Math.pow(ageInHours / 24, 0.75));

    // Variação controlada (0 a 25 pontos)
    const randomFn = customRandom || Math.random;
    const jitter = randomFn() * 25;

    return recencyScore + jitter;
}

/**
 * Reordena dinamicamente uma lista de vídeos aplicando o algoritmo de
 * recência com dispersão estocástica controlada.
 */
export function rankVideosByFreshness<T extends RankableVideo>(
    videos: T[],
    now: number = Date.now(),
    customRandom?: () => number,
): T[] {
    if (!videos || videos.length <= 1) {
        return videos || [];
    }

    const scored = videos.map((video) => ({
        video,
        score: calculateVideoScore(video.created_at, now, customRandom),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.map((item) => item.video);
}
