"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { podeEditarLead, podePreencherProduto, podeReatribuirVendedor } from "@/lib/permissions";

export async function atualizarProdutoAction(leadId: string, produto: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado.");

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  if (!podePreencherProduto(user, lead.vendedorId)) throw new Error("Sem permissão.");

  await prisma.lead.update({ where: { id: leadId }, data: { produtoVendido: produto.trim() || null } });

  await prisma.leadEvent.create({
    data: {
      leadId,
      autorId: user.id,
      tipo: "NOTA",
      texto: produto.trim()
        ? `Produto vendido registrado: ${produto.trim()}`
        : "Produto vendido removido.",
    },
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/relatorios");
}

export async function adicionarNotaAction(leadId: string, texto: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado.");
  if (!texto.trim()) return;

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  if (!podeEditarLead(user, lead.vendedorId)) throw new Error("Sem permissão.");

  await prisma.leadEvent.create({
    data: { leadId, autorId: user.id, tipo: "NOTA", texto: texto.trim() },
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function reatribuirVendedorAction(leadId: string, novoVendedorId: string) {
  const user = await getCurrentUser();
  if (!user || !podeReatribuirVendedor(user)) throw new Error("Sem permissão.");

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  const novoVendedor = await prisma.user.findUniqueOrThrow({ where: { id: novoVendedorId } });

  await prisma.lead.update({ where: { id: leadId }, data: { vendedorId: novoVendedorId } });

  await prisma.leadEvent.create({
    data: {
      leadId,
      autorId: user.id,
      tipo: "NOTA",
      texto: `Lead reatribuído para ${novoVendedor.nome}.`,
    },
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/board");
  return lead;
}
