import { ThemeToggle } from "@/components/theme-toggle";
import { CheckCircle2, ShieldCheck, Zap, Layers } from "lucide-react";

export default function HomePage() {
    const features = [
        {
            icon: <Zap className="w-5 h-5 text-brand-primary" />,
            title: "Custo Operacional Zero",
            description:
                "Embeds nativos de TikTok, Instagram Reels e YouTube Shorts sem custos de streaming ou armazenamento.",
        },
        {
            icon: <ShieldCheck className="w-5 h-5 text-brand-primary" />,
            title: "Seguranca em Quatro Barreiras",
            description:
                "Painel administrativo protegido com validacao estrita de e-mail e chave de servico isolada no servidor.",
        },
        {
            icon: <Layers className="w-5 h-5 text-brand-primary" />,
            title: "Alta Conversao Mobile-First",
            description:
                "Feed vertical com rolagem fluida e integracao direta com links de afiliados e cupons.",
        },
    ];

    return (
        <main className="min-h-dvh flex flex-col justify-between p-6 sm:p-12 max-w-5xl mx-auto">
            <header className="flex items-center justify-between py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        P
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">
                            PromoCuts
                        </h1>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Fundacao e Tooling (Fase 1)
                        </p>
                    </div>
                </div>

                <ThemeToggle />
            </header>

            <section className="my-16 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-6">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Fase 1 Concluida com Sucesso</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 max-w-2xl leading-tight">
                    Agregador de videos curtos para afiliacao e alta conversao.
                </h2>

                <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl">
                    Ambiente base configurado com Next.js 15, React 19,
                    TypeScript, Tailwind CSS v4, clientes Supabase tipados e
                    sistema de temas dual.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
                    {features.map((item, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col gap-3"
                        >
                            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                                {item.icon}
                            </div>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {item.title}
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="py-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-2">
                <p>PromoCuts — Todos os direitos reservados.</p>
                <p className="font-mono">Next.js 15 | Tailwind v4 | Supabase</p>
            </footer>
        </main>
    );
}
