"use server";

import { redirect } from "next/navigation";
import { Origem } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { podeCadastrarLead } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function criarLeadAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !podeCadastrarLead(user)) throw new Error("Sem permissão para cadastrar leads.");

  const nomeCliente = String(formData.get("nomeCliente") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const oQueProcurou = String(formData.get("oQueProcurou") ?? "").trim();
  const origem = String(formData.get("origem") ?? "WHATSAPP") as Origem;
  const vendedorIdForm = String(formData.get("vendedorId") ?? "");

  if (!nomeCliente || !whatsapp || !oQueProcurou) {
    throw new Error("Preencha nome, WhatsApp e o que a pessoa procurou.");
  }

  const vendedorId = user.role === "VENDEDORA" ? user.id : vendedorIdForm || user.id;

  const lead = await prisma.lead.create({
    data: { nomeCliente, whatsapp, oQueProcurou, origem, vendedorId },
  });

  await prisma.leadEvent.create({
    data: {
      leadId: lead.id,
      autorId: user.id,
      tipo: "CADASTRO",
      texto: `Lead cadastrado por ${user.nome}.`,
    },
  });

  revalidatePath("/board");
  redirect(`/leads/${lead.id}`);
}
