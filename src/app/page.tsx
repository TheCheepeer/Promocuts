import { ThemeToggle } from "@/components/theme-toggle";
import { EmbedTester } from "@/components/embed-tester";
import {
    Zap,
    ShieldCheck,
    Smartphone,
    Server,
    Sparkles,
    CheckCircle2,
    ArrowUpRight,
} from "lucide-react";

export default function HomePage() {
    const pillars = [
        {
            icon: <Zap className="w-5 h-5 text-brand-primary" />,
            title: "Custo Operacional Zero",
            description:
                "Embeds oficiais de TikTok, Reels e Shorts delegam 100% do streaming e armazenamento para as plataformas originais.",
            tag: "Zero Storage",
        },
        {
            icon: <ShieldCheck className="w-5 h-5 text-brand-primary" />,
            title: "Segurança em 4 Barreiras",
            description:
                "Painel restrito com VPN Guard (IP/CIDR), Supabase Auth, whitelist rígida de e-mail e chave service_role isolada no servidor.",
            tag: "Defense in Depth",
        },
        {
            icon: <Smartphone className="w-5 h-5 text-brand-primary" />,
            title: "Alta Conversão Mobile-First",
            description:
                "Feed vertical fluido com scroll-snap, badges de cupom com cópia instantânea e cards de produtos afiliados integrados.",
            tag: "Mobile-First",
        },
        {
            icon: <Server className="w-5 h-5 text-brand-primary" />,
            title: "Portabilidade Total",
            description:
                "Execução serverless gratuita na Vercel + Supabase ou contêineres Docker independentes com PostgreSQL 18.6 e Redis.",
            tag: "Docker & Cloud",
        },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
            {/* Header com largura total e vidro fosco */}
            <header className="w-full sticky top-0 z-50 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white font-black text-base shadow-sm ring-1 ring-black/5">
                            P
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-lg tracking-tight text-zinc-950 dark:text-zinc-50">
                                PromoCuts
                            </span>
                            <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Fase 2 Pronta
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Motor de Embeds Ativo
                            </span>
                        </div>

                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Secao Hero com largura total e gradiente sutil */}
            <section className="w-full relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-white via-zinc-50/50 to-zinc-100/40 dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950 py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 mb-6 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                                Agregador de Videos Verticais para Afiliacao
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-[1.1]">
                            Cortes virais que convertem em{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
                                vendas reais.
                            </span>
                        </h1>

                        <p className="mt-6 text-base sm:text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                            Vitrine mobile-first conectada a TikTok, Instagram
                            Reels e YouTube Shorts com cupons rápidos, links de
                            lojas parceiras e custo de servidor zero.
                        </p>
                    </div>

                    {/* Testador interativo ao vivo do motor da Fase 2 */}
                    <EmbedTester />
                </div>
            </section>

            {/* Grade de Pilares Arquiteturais */}
            <section className="w-full py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                            Engenharia e Arquitetura
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
                            Pilares Fundamentais do PromoCuts
                        </h2>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
                        Construído sob o princípio de custo operacional zero,
                        sem bancos pesados nem consumo de banda para vídeos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pillars.map((pillar, idx) => (
                        <div
                            key={idx}
                            className="group p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-brand-primary/40 dark:hover:border-brand-primary/40 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center transition-transform group-hover:scale-105">
                                        {pillar.icon}
                                    </div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                        {pillar.tag}
                                    </span>
                                </div>
                                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">
                                    {pillar.title}
                                </h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {pillar.description}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center text-xs font-semibold text-brand-primary">
                                <span>Verificado</span>
                                <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Rodape institucional com largura total */}
            <footer className="w-full mt-auto border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            PromoCuts
                        </span>
                        <span>
                            — Plataforma Open-Source de Achadinhos e Cortes
                            Virais.
                        </span>
                    </div>

                    <div className="flex items-center gap-6 font-mono text-[11px]">
                        <span>Next.js 15</span>
                        <span>Tailwind v4</span>
                        <span>Supabase</span>
                        <a
                            href="https://github.com/TheCheepeer/Promocuts"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                            GitHub
                            <ArrowUpRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
