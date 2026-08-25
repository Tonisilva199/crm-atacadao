"use server";

import { revalidatePath } from "next/cache";
import { Stage } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { podeEditarLead } from "@/lib/permissions";
import { NOME_ETAPA } from "@/lib/constants";

export async function moverEtapaAction(
  leadId: string,
  novaEtapa: Stage,
  opts?: { motivoPerda?: string; valorFechado?: number }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado.");

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  if (!podeEditarLead(user, lead.vendedorId)) {
    throw new Error("Você não tem permissão para mover este lead.");
  }
  if (novaEtapa === Stage.PERDIDO && !opts?.motivoPerda) {
    throw new Error("Informe o motivo da perda.");
  }

  const etapaAnterior = lead.stage;
  const encerraFunil = novaEtapa === Stage.FECHADO || novaEtapa === Stage.PERDIDO;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage: novaEtapa,
      motivoPerda: novaEtapa === Stage.PERDIDO ? opts?.motivoPerda : lead.motivoPerda,
      valorFechado: novaEtapa === Stage.FECHADO ? opts?.valorFechado ?? lead.valorFechado : lead.valorFechado,
      dataFechamento: encerraFunil ? new Date() : lead.dataFechamento,
    },
  });

  await prisma.leadEvent.create({
    data: {
      leadId,
      autorId: user.id,
      tipo: "MUDANCA_ETAPA",
      texto:
        novaEtapa === Stage.PERDIDO && opts?.motivoPerda
          ? `Motivo: ${opts.motivoPerda}`
          : `${NOME_ETAPA[etapaAnterior]} → ${NOME_ETAPA[novaEtapa]}`,
      deStage: etapaAnterior,
      paraStage: novaEtapa,
    },
  });

  revalidatePath("/board");
  revalidatePath(`/leads/${leadId}`);
}
