"use client";

import { useState, useTransition } from "react";
import { redefinirSenhaAction } from "./actions";

export function RedefinirSenha({ userId }: { userId: string }) {
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-xs text-neutral-400 hover:text-brand-navy"
      >
        redefinir senha
      </button>
    );
  }

  function salvar() {
    setErro(null);
    setOk(false);
    startTransition(async () => {
      try {
        await redefinirSenhaAction(userId, senha);
        setOk(true);
        setSenha("");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao redefinir senha.");
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="nova senha"
        className="input w-28 py-1 text-xs"
      />
      <button
        type="button"
        onClick={salvar}
        disabled={pending || senha.length < 4}
        className="rounded bg-brand-navy px-2 py-1 text-xs text-white disabled:opacity-40"
      >
        salvar
      </button>
      <button
        type="button"
        onClick={() => {
          setAberto(false);
          setErro(null);
        }}
        className="text-xs text-neutral-400"
      >
        cancelar
      </button>
      {erro && <span className="text-xs text-brand-red">{erro}</span>}
      {ok && <span className="text-xs text-green-700">Salvo.</span>}
    </div>
  );
}
