"use client";

import { useActionState, useState } from "react";
import {
    Mail,
    ArrowRight,
    Loader2,
    CheckCircle2,
    RotateCcw,
} from "lucide-react";
import { sendMagicLink, type LoginActionState } from "./actions";

interface LoginFormProps {
    nextDestination?: string;
}

const initialLoginState: LoginActionState = {
    success: false,
    message: "",
};

export function LoginForm({ nextDestination = "/admin" }: LoginFormProps) {
    const [state, formAction, isPending] = useActionState(
        sendMagicLink,
        initialLoginState,
    );
    const [isReset, setIsReset] = useState(false);

    const showSuccess = state.success && !isReset;

    if (showSuccess) {
        return (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                    </div>

                    <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Verifique seu e-mail
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {state.message}
                    </p>

                    <div className="mt-4 w-full rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
                        Caso nao localize a mensagem na caixa de entrada,
                        verifique tambem a pasta de spam ou lixo eletronico.
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsReset(true)}
                        className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                    >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Tentar com outro endereco ou reenviar</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form
            action={formAction}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
            <input type="hidden" name="next" value={nextDestination} />

            {state.error && !isReset && (
                <div
                    role="alert"
                    className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                >
                    <p className="font-medium">{state.error}</p>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                    >
                        E-mail
                    </label>
                    <div className="relative mt-2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-500">
                            <Mail className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            autoComplete="email"
                            autoFocus
                            placeholder="seu-email@dominio.com"
                            disabled={isPending}
                            className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pr-3 pl-10 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/20"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-2.5 px-4 text-sm font-medium text-white shadow-sm transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? (
                        <>
                            <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                            />
                            <span>Enviando link...</span>
                        </>
                    ) : (
                        <>
                            <span>Acessar Painel</span>
                            <ArrowRight
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
