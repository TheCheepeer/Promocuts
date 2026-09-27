import { Metadata } from "next";
import { Shield, ShieldAlert, AlertTriangle } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
    title: "Acesso Administrativo — PromoCuts",
    description: "Autenticacao segura para gestao do PromoCuts",
};

interface AdminLoginPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminLoginPage(props: AdminLoginPageProps) {
    const searchParams = await props.searchParams;
    const errorParam =
        typeof searchParams.error === "string" ? searchParams.error : undefined;
    const nextDestination =
        typeof searchParams.next === "string" ? searchParams.next : "/admin";

    // Mapeamento semantico de codigos de erro da URL
    const errorFeedbackMap: Record<
        string,
        { title: string; description: string; type: "error" | "warning" }
    > = {
        unauthorized: {
            title: "Acesso Nao Autorizado",
            description:
                "O e-mail informado nao possui permissao para acessar o painel de administracao.",
            type: "error",
        },
        invalid_link: {
            title: "Link Invalido ou Expirado",
            description:
                "O link de acesso utilizado expirou ou ja foi consumido. Solicite um novo link abaixo.",
            type: "warning",
        },
        missing_code: {
            title: "Codigo de Acesso Invalido",
            description:
                "Nao foi possivel confirmar a autenticacao. Solicite um novo link de acesso.",
            type: "warning",
        },
        auth_failed: {
            title: "Falha na Autenticacao",
            description:
                "Ocorreu um erro ao validar sua sessao. Tente realizar o acesso novamente.",
            type: "error",
        },
    };

    const currentError = errorParam ? errorFeedbackMap[errorParam] : null;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6">
                {/* Cabecalho de Identidade */}
                <div className="text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                        <Shield className="h-6 w-6" aria-hidden="true" />
                    </div>

                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        PromoCuts Admin
                    </h1>

                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Painel de administracao
                    </p>
                </div>

                {/* Banner de Feedback de Erro (se houver na URL) */}
                {currentError && (
                    <div
                        role="alert"
                        className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                            currentError.type === "error"
                                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
                        }`}
                    >
                        <div className="mt-0.5 shrink-0">
                            {currentError.type === "error" ? (
                                <ShieldAlert
                                    className="h-5 w-5 text-red-600 dark:text-red-400"
                                    aria-hidden="true"
                                />
                            ) : (
                                <AlertTriangle
                                    className="h-5 w-5 text-amber-600 dark:text-amber-400"
                                    aria-hidden="true"
                                />
                            )}
                        </div>

                        <div>
                            <h2 className="font-semibold">
                                {currentError.title}
                            </h2>
                            <p className="mt-1 text-xs leading-relaxed opacity-90">
                                {currentError.description}
                            </p>
                        </div>
                    </div>
                )}

                {/* Formulario Interativo de Login */}
                <LoginForm nextDestination={nextDestination} />
            </div>
        </main>
    );
}
