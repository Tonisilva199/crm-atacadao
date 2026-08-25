"use client";

import { useState } from "react";
import { Lead, User } from "@/generated/prisma/browser";

const MOTIVOS_COMUNS = [
  "Preço muito alto",
  "Fechou com concorrente",
  "Desistiu da compra",
  "Sem resposta / sumiu",
  "Fora do prazo de entrega",
];

export function MarcarPerdidoModal({
  lead,
  onFechar,
  onConfirmar,
}: {
  lead: Lead & { vendedor: User };
  onFechar: () => void;
  onConfirmar: (motivo: string) => void | Promise<void>;
}) {
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    if (!motivo.trim()) return;
    setEnviando(true);
    await onConfirmar(motivo.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h3 className="font-semibold">Marcar como perdido</h3>
        <p className="mb-3 text-sm text-neutral-500">
          {lead.nomeCliente} — por que essa venda não fechou?
        </p>

        <div className="mb-3 flex flex-wrap gap-1">
          {MOTIVOS_COMUNS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMotivo(m)}
              className={`rounded-full border px-2 py-1 text-xs ${
                motivo === m
                  ? "border-brand-red bg-red-50"
                  : "border-neutral-300 hover:border-neutral-400"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Descreva o motivo..."
          className="mb-4 w-full rounded-md border border-neutral-300 p-2 text-sm"
          rows={3}
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!motivo.trim() || enviando}
            onClick={confirmar}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Confirmar perda
          </button>
        </div>
      </div>
    </div>
  );
}
