import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { podeEditarLead, podePreencherProduto, podeReatribuirVendedor } from "@/lib/permissions";
import { NOME_ETAPA, NOME_ORIGEM } from "@/lib/constants";
import { LeadPainel } from "./LeadPainel.client";

export default async function LeadDetailPage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      vendedor: true,
      eventos: { include: { autor: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!lead) notFound();

  const podeEditar = podeEditarLead(user, lead.vendedorId);
  const podeProduto = podePreencherProduto(user, lead.vendedorId);
  const vendedores = podeReatribuirVendedor(user)
    ? await prisma.user.findMany({ where: { role: "VENDEDORA", ativo: true } })
    : [];

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{lead.nomeCliente}</h1>
          <p className="text-sm text-neutral-500">{lead.whatsapp}</p>
        </div>
        <span className="rounded-full bg-brand-yellow px-3 py-1 text-xs font-semibold text-brand-wood-dark">
          {NOME_ETAPA[lead.stage]}
        </span>
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
        <div>
          <dt className="text-neutral-400">O que procurou</dt>
          <dd className="font-medium">{lead.oQueProcurou}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">Origem</dt>
          <dd className="font-medium">{NOME_ORIGEM[lead.origem]}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">Vendedora responsável</dt>
          <dd className="font-medium">{lead.vendedor.nome}</dd>
        </div>
        {lead.produtoVendido && (
          <div>
            <dt className="text-neutral-400">Produto(s) vendido(s)</dt>
            <dd className="font-medium">{lead.produtoVendido}</dd>
          </div>
        )}
        {lead.valorFechado != null && (
          <div>
            <dt className="text-neutral-400">Valor fechado</dt>
            <dd className="font-medium">
              {lead.valorFechado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </dd>
          </div>
        )}
        {lead.motivoPerda && (
          <div className="col-span-2">
            <dt className="text-neutral-400">Motivo da perda</dt>
            <dd className="font-medium text-red-700">{lead.motivoPerda}</dd>
          </div>
        )}
      </dl>

      <LeadPainel
        lead={lead}
        podeEditar={podeEditar}
        podeProduto={podeProduto}
        vendedores={vendedores}
        eventos={lead.eventos}
      />
    </div>
  );
}
