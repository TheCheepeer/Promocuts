import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
    return (
        <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <Search className="h-8 w-8" aria-hidden="true" />
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                Pagina nao encontrada
            </h1>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                O conteudo que voce esta procurando nao existe, foi removido ou
                o endereco digitado esta incorreto.
            </p>

            <div className="mt-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    <span>Voltar para a pagina inicial</span>
                </Link>
            </div>
        </main>
    );
}
