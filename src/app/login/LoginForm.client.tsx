"use client";

import { useActionState, useState } from "react";
import { User } from "@/generated/prisma/browser";
import { NOME_PAPEL } from "@/lib/constants";
import { loginAction, LoginState } from "./actions";

export function LoginForm({ usuarios }: { usuarios: User[] }) {
  const [selecionado, setSelecionado] = useState<User | null>(null);
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, undefined);

  if (!selecionado) {
    return (
      <div className="flex flex-col gap-3">
        {usuarios.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setSelecionado(u)}
            className="flex items-center justify-between rounded-lg border-2 border-neutral-200 px-4 py-3 text-left transition-colors hover:border-brand-red hover:bg-red-50"
          >
            <span className="font-semibold text-brand-wood-dark">{u.nome}</span>
            <span className="rounded-full bg-brand-navy px-2 py-0.5 text-xs font-medium text-white">
              {NOME_PAPEL[u.role]}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="userId" value={selecionado.id} />

      <button
        type="button"
        onClick={() => setSelecionado(null)}
        className="self-start text-xs text-neutral-400 hover:text-brand-red hover:underline"
      >
        ← trocar usuário
      </button>

      <p className="text-sm font-semibold text-brand-wood-dark">
        {selecionado.nome} <span className="text-neutral-400">({NOME_PAPEL[selecionado.role]})</span>
      </p>

      <input
        type="password"
        name="senha"
        autoFocus
        required
        placeholder="Senha"
        className="input"
      />

      {state?.erro && <p className="text-sm text-brand-red">{state.erro}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
