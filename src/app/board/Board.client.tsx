"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Lead, Stage, User } from "@/generated/prisma/browser";
import { ETAPAS_FUNIL, NOME_ETAPA, NOME_ORIGEM } from "@/lib/constants";
import { moverEtapaAction } from "./actions";
import { MarcarPerdidoModal } from "./MarcarPerdidoModal";

type LeadComVendedor = Lead & { vendedor: User };

export function Board({
  leads,
  currentUser,
  mostrarVendedor,
}: {
  leads: LeadComVendedor[];
  currentUser: User;
  mostrarVendedor: boolean;
}) {
  const [items, setItems] = useState(leads);
  const [pendentePerdido, setPendentePerdido] = useState<LeadComVendedor | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const porEtapa = useMemo(() => {
    const map = new Map<Stage, LeadComVendedor[]>();
    for (const etapa of ETAPAS_FUNIL) map.set(etapa, []);
    for (const lead of items) map.get(lead.stage)?.push(lead);
    return map;
  }, [items]);

  function aplicarMudancaLocal(leadId: string, novaEtapa: Stage) {
    setItems((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: novaEtapa } : l)));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const novaEtapa = over.id as Stage;
    const lead = items.find((l) => l.id === leadId);
    if (!lead || lead.stage === novaEtapa) return;

    if (novaEtapa === Stage.PERDIDO) {
      setPendentePerdido(lead);
      return;
    }

    aplicarMudancaLocal(leadId, novaEtapa);
    startTransition(async () => {
      try {
        await moverEtapaAction(leadId, novaEtapa);
      } catch (e) {
        aplicarMudancaLocal(leadId, lead.stage);
        alert(e instanceof Error ? e.message : "Erro ao mover o lead.");
      }
    });
  }

  const leadAtivo = activeId ? items.find((l) => l.id === activeId) : null;

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPAS_FUNIL.map((etapa) => (
            <Coluna
              key={etapa}
              etapa={etapa}
              leads={porEtapa.get(etapa) ?? []}
              mostrarVendedor={mostrarVendedor}
            />
          ))}
        </div>

        <DragOverlay>
          {leadAtivo ? <LeadCard lead={leadAtivo} mostrarVendedor={mostrarVendedor} /> : null}
        </DragOverlay>
      </DndContext>

      {pendentePerdido && (
        <MarcarPerdidoModal
          lead={pendentePerdido}
          onFechar={() => setPendentePerdido(null)}
          onConfirmar={async (motivo) => {
            aplicarMudancaLocal(pendentePerdido.id, Stage.PERDIDO);
            setPendentePerdido(null);
            await moverEtapaAction(pendentePerdido.id, Stage.PERDIDO, { motivoPerda: motivo });
          }}
        />
      )}
    </>
  );
}

function Coluna({
  etapa,
  leads,
  mostrarVendedor,
}: {
  etapa: Stage;
  leads: LeadComVendedor[];
  mostrarVendedor: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border ${
        isOver ? "border-brand-red bg-red-50" : "border-neutral-200 bg-neutral-100"
      }`}
    >
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
        <h2 className="text-sm font-semibold">{NOME_ETAPA[etapa]}</h2>
        <span className="rounded-full bg-neutral-200 px-2 text-xs text-neutral-600">
          {leads.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        {leads.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} mostrarVendedor={mostrarVendedor} />
        ))}
        {leads.length === 0 && (
          <p className="mt-4 text-center text-xs text-neutral-400">Nenhum lead aqui</p>
        )}
      </div>
    </div>
  );
}

function DraggableLeadCard({
  lead,
  mostrarVendedor,
}: {
  lead: LeadComVendedor;
  mostrarVendedor: boolean;
}) {
  return <LeadCard lead={lead} mostrarVendedor={mostrarVendedor} draggableId={lead.id} />;
}

function LeadCard({
  lead,
  mostrarVendedor,
  draggableId,
}: {
  lead: LeadComVendedor;
  mostrarVendedor: boolean;
  draggableId?: string;
}) {
  return (
    <DraggableWrapper id={draggableId}>
      <Link
        href={`/leads/${lead.id}`}
        className="block rounded-md border border-neutral-200 bg-white p-3 text-sm shadow-sm hover:border-neutral-400"
      >
        <p className="font-medium">{lead.nomeCliente}</p>
        <p className="text-neutral-500">{lead.oQueProcurou}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
          <span>{NOME_ORIGEM[lead.origem]}</span>
          {mostrarVendedor && <span>{lead.vendedor.nome}</span>}
        </div>
      </Link>
    </DraggableWrapper>
  );
}

function DraggableWrapper({ id, children }: { id?: string; children: React.ReactNode }) {
  if (!id) return <>{children}</>;
  return <DraggableInner id={id}>{children}</DraggableInner>;
}

function DraggableInner({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      {children}
    </div>
  );
}
