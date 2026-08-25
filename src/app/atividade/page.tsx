import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { podeGerenciarUsuarios } from "@/lib/permissions";

const ACAO_AUDIT: Record<string, string> = {
  LOGIN: "Entrou no sistema",
  USUARIO_CRIADO: "Criou usuário",
  USUARIO_DESATIVADO: "Desativou usuário",
  SENHA_REDEFINIDA: "Redefiniu senha",
};

const ACAO_LEAD: Record<string, string> = {
  CADASTRO: "Cadastrou cliente",
  MUDANCA_ETAPA: "Mudou etapa",
  NOTA: "Registrou observação",
};

type LinhaAtividade = {
  id: string;
  createdAt: Date;
  autor: string;
  acao: string;
  detalhe: string;
  leadId?: string;
  leadNome?: string;
};

export default async function AtividadePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!podeGerenciarUsuarios(user)) redirect("/board");

  const [auditLogs, leadEvents] = await Promise.all([
    prisma.auditLog.findMany({
      include: { autor: true },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.leadEvent.findMany({
      include: { autor: true, lead: true },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
  ]);

  const linhas: LinhaAtividade[] = [
    ...auditLogs.map((a) => ({
      id: `audit-${a.id}`,
      createdAt: a.createdAt,
      autor: a.autor.nome,
      acao: ACAO_AUDIT[a.acao] ?? a.acao,
      detalhe: a.detalhe,
    })),
    ...leadEvents.map((e) => ({
      id: `lead-${e.id}`,
      createdAt: e.createdAt,
      autor: e.autor.nome,
      acao: ACAO_LEAD[e.tipo] ?? e.tipo,
      detalhe: e.texto,
      leadId: e.leadId,
      leadNome: e.lead.nomeCliente,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 200);

  const totalLoginsHoje = auditLogs.filter(
    (a) => a.acao === "LOGIN" && ehHoje(a.createdAt)
  ).length;
  const totalAcoesHoje = linhas.filter((l) => ehHoje(l.createdAt)).length;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-xl font-bold">Atividade do sistema</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Tudo que foi feito no CRM: quem entrou, quem cadastrou, quem alterou.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Cartao titulo="Ações hoje" valor={totalAcoesHoje} />
        <Cartao titulo="Logins hoje" valor={totalLoginsHoje} />
        <Cartao titulo="Registros no histórico" valor={linhas.length} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs text-neutral-400">
              <th className="px-3 py-2 font-medium">Quando</th>
              <th className="px-3 py-2 font-medium">Quem</th>
              <th className="px-3 py-2 font-medium">Ação</th>
              <th className="px-3 py-2 font-medium">Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id} className="border-b border-neutral-100 align-top">
                <td className="whitespace-nowrap px-3 py-2 text-neutral-400">
                  {l.createdAt.toLocaleString("pt-BR")}
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-medium">{l.autor}</td>
                <td className="whitespace-nowrap px-3 py-2">{l.acao}</td>
                <td className="px-3 py-2 text-neutral-600">
                  {l.detalhe}
                  {l.leadId && (
                    <>
                      {" — "}
                      <Link href={`/leads/${l.leadId}`} className="text-brand-red hover:underline">
                        {l.leadNome}
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-neutral-400">
                  Nenhuma atividade registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ehHoje(data: Date) {
  const hoje = new Date();
  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  );
}

function Cartao({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-400">{titulo}</p>
      <p className="text-lg font-bold">{valor}</p>
    </div>
  );
}
