"use client";

import { useState, useTransition } from "react";
import { Lead, LeadEvent, Stage, User } from "@/generated/prisma/browser";
import { ETAPAS_FUNIL, NOME_ETAPA } from "@/lib/constants";
import { moverEtapaAction } from "@/app/board/actions";
import { adicionarNotaAction, atualizarProdutoAction, reatribuirVendedorAction } from "./actions";

type EventoComAutor = LeadEvent & { autor: User };

export function LeadPainel({
  lead,
  podeEditar,
  podeProduto,
  vendedores,
  eventos,
}: {
  lead: Lead;
  podeEditar: boolean;
  podeProduto: boolean;
  vendedores: User[];
  eventos: EventoComAutor[];
}) {
  const [motivoPerda, setMotivoPerda] = useState("");
  const [valorFechado, setValorFechado] = useState("");
  const [nota, setNota] = useState("");
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function mover(etapa: Stage) {
    setErro(null);
    startTransition(async () => {
      try {
        if (etapa === Stage.PERDIDO) {
          if (!motivoPerda.trim()) {
            setErro("Informe o motivo da perda antes de marcar como perdido.");
            return;
          }
          await moverEtapaAction(lead.id, etapa, { motivoPerda: motivoPerda.trim() });
        } else if (etapa === Stage.FECHADO) {
          await moverEtapaAction(lead.id, etapa, {
            valorFechado: valorFechado ? Number(valorFechado) : undefined,
          });
        } else {
          await moverEtapaAction(lead.id, etapa);
        }
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao mover etapa.");
      }
    });
  }

  function enviarNota() {
    if (!nota.trim()) return;
    startTransition(async () => {
      await adicionarNotaAction(lead.id, nota);
      setNota("");
    });
  }

  if (!podeEditar) {
    return (
      <div className="flex flex-col gap-6">
        {podeProduto && <ProdutoVendidoForm leadId={lead.id} valorAtual={lead.produtoVendido} />}
        <Timeline eventos={eventos} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {podeProduto && <ProdutoVendidoForm leadId={lead.id} valorAtual={lead.produtoVendido} />}

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Mover no funil</h2>

        <div className="mb-3 flex flex-wrap gap-2">
          {ETAPAS_FUNIL.map((etapa) => (
            <button
              key={etapa}
              type="button"
              disabled={pending || etapa === lead.stage}
              onClick={() => mover(etapa)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                etapa === lead.stage
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-neutral-300 hover:border-neutral-500"
              } disabled:cursor-not-allowed`}
            >
              {NOME_ETAPA[etapa]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Motivo (se for marcar como perdido)
            <input
              value={motivoPerda}
              onChange={(e) => setMotivoPerda(e.target.value)}
              className="input"
              placeholder="Ex: preço, concorrência, sumiu..."
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Valor fechado (se for marcar como fechado)
            <input
              value={valorFechado}
              onChange={(e) => setValorFechado(e.target.value)}
              type="number"
              className="input"
              placeholder="R$"
            />
          </label>
        </div>

        {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
      </section>

      {vendedores.length > 0 && (
        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Reatribuir vendedora</h2>
          <select
            defaultValue={lead.vendedorId}
            className="input"
            onChange={(e) => startTransition(() => reatribuirVendedorAction(lead.id, e.target.value))}
          >
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>
        </section>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Adicionar observação</h2>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
          className="input mb-2 w-full"
          placeholder="Ex: cliente pediu para retornar amanhã..."
        />
        <button
          type="button"
          onClick={enviarNota}
          disabled={pending || !nota.trim()}
          className="rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-white disabled:opacity-40"
        >
          Salvar observação
        </button>
      </section>

      <Timeline eventos={eventos} />
    </div>
  );
}

function ProdutoVendidoForm({ leadId, valorAtual }: { leadId: string; valorAtual: string | null }) {
  const [produto, setProduto] = useState(valorAtual ?? "");
  const [pending, startTransition] = useTransition();
  const [salvo, setSalvo] = useState(false);

  function salvar() {
    setSalvo(false);
    startTransition(async () => {
      await atualizarProdutoAction(leadId, produto);
      setSalvo(true);
    });
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold">Produto(s) vendido(s)</h2>
      <p className="mb-2 text-xs text-neutral-400">
        O que foi efetivamente vendido pra esse cliente (pode ser diferente do que ele procurou). Entra no
        relatório diário.
      </p>
      <textarea
        value={produto}
        onChange={(e) => {
          setProduto(e.target.value);
          setSalvo(false);
        }}
        rows={2}
        className="input mb-2 w-full"
        placeholder="Ex: 4 chapas de MDF branco 15mm + fitas de borda"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={salvar}
          disabled={pending}
          className="rounded-md bg-brand-red px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          Salvar produto
        </button>
        {salvo && !pending && <span className="text-xs text-green-700">Salvo.</span>}
      </div>
    </section>
  );
}

function Timeline({ eventos }: { eventos: EventoComAutor[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">Histórico</h2>
      <ul className="flex flex-col gap-3">
        {eventos.map((ev) => (
          <li key={ev.id} className="rounded-md border border-neutral-200 bg-white p-3 text-sm">
            <p>{ev.texto}</p>
            <p className="mt-1 text-xs text-neutral-400">
              {ev.autor.nome} · {new Date(ev.createdAt).toLocaleString("pt-BR")}
            </p>
          </li>
        ))}
        {eventos.length === 0 && <p className="text-sm text-neutral-400">Sem histórico ainda.</p>}
      </ul>
    </section>
  );
}
