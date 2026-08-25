import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { podeVerTodosLeads } from "@/lib/permissions";
import { NOME_ETAPA, NOME_ORIGEM } from "@/lib/constants";
import { Lead, Stage, User } from "@/generated/prisma/client";

export default async function RelatoriosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const where = podeVerTodosLeads(user) ? {} : { vendedorId: user.id };
  const leads = await prisma.lead.findMany({ where, include: { vendedor: true } });

  const total = leads.length;
  const fechados = leads.filter((l) => l.stage === Stage.FECHADO);
  const perdidos = leads.filter((l) => l.stage === Stage.PERDIDO);
  const emAndamento = total - fechados.length - perdidos.length;
  const taxaConversao = total > 0 ? ((fechados.length / total) * 100).toFixed(1) : "0.0";
  const valorTotalFechado = fechados.reduce((soma, l) => soma + (l.valorFechado ?? 0), 0);

  const porOrigem = new Map<string, number>();
  for (const l of leads) porOrigem.set(l.origem, (porOrigem.get(l.origem) ?? 0) + 1);

  const porMotivoPerda = new Map<string, number>();
  for (const l of perdidos) {
    const chave = l.motivoPerda?.trim() || "Sem motivo registrado";
    porMotivoPerda.set(chave, (porMotivoPerda.get(chave) ?? 0) + 1);
  }

  const porProcura = new Map<string, number>();
  for (const l of leads) {
    const chave = l.oQueProcurou.trim();
    porProcura.set(chave, (porProcura.get(chave) ?? 0) + 1);
  }
  const topProcurados = [...porProcura.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const resumoPorDia = montarResumoPorDia(leads);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-bold">Relatórios</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Cartao titulo="Leads" valor={total} />
        <Cartao titulo="Fechados" valor={fechados.length} />
        <Cartao titulo="Perdidos" valor={perdidos.length} />
        <Cartao titulo="Em andamento" valor={emAndamento} />
        <Cartao titulo="Taxa de conversão" valor={`${taxaConversao}%`} />
        <Cartao
          titulo="Valor fechado"
          valor={valorTotalFechado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Bloco titulo="Origem dos contatos">
          {[...porOrigem.entries()].map(([origem, qtd]) => (
            <LinhaBarra
              key={origem}
              label={NOME_ORIGEM[origem as keyof typeof NOME_ORIGEM]}
              valor={qtd}
              total={total}
            />
          ))}
        </Bloco>

        <Bloco titulo="Motivos de perda">
          {porMotivoPerda.size === 0 && <p className="text-sm text-neutral-400">Nenhuma perda ainda.</p>}
          {[...porMotivoPerda.entries()].map(([motivo, qtd]) => (
            <LinhaBarra key={motivo} label={motivo} valor={qtd} total={perdidos.length} />
          ))}
        </Bloco>

        <Bloco titulo="O que mais procuram" className="sm:col-span-2">
          {topProcurados.map(([texto, qtd]) => (
            <LinhaBarra key={texto} label={texto} valor={qtd} total={total} />
          ))}
        </Bloco>
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold">Relatório diário (últimos 30 dias)</h2>
        <p className="mb-3 text-xs text-neutral-400">
          Preenchido automaticamente a partir do que é cadastrado em cada cliente.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs text-neutral-400">
                <th className="py-2 pr-3 font-medium">Dia</th>
                <th className="py-2 pr-3 font-medium">Leads recebidos</th>
                <th className="py-2 pr-3 font-medium">Leads convertidos</th>
                <th className="py-2 pr-3 font-medium">Produto(s) vendido(s)</th>
                <th className="py-2 pr-3 font-medium">Faturamento do dia (R$)</th>
                <th className="py-2 pr-3 font-medium">Vendedor responsável</th>
              </tr>
            </thead>
            <tbody>
              {resumoPorDia.map((dia) => {
                const semMovimento = dia.leadsRecebidos === 0 && dia.leadsConvertidos === 0;
                return (
                  <tr
                    key={dia.data}
                    className={`border-b border-neutral-100 ${semMovimento ? "text-neutral-300" : ""}`}
                  >
                    <td className="py-1.5 pr-3">{dia.rotulo}</td>
                    <td className="py-1.5 pr-3">{dia.leadsRecebidos || ""}</td>
                    <td className="py-1.5 pr-3">{dia.leadsConvertidos || ""}</td>
                    <td className="py-1.5 pr-3">{[...dia.produtos].join(", ")}</td>
                    <td className="py-1.5 pr-3">
                      {dia.faturamento > 0
                        ? dia.faturamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : ""}
                    </td>
                    <td className="py-1.5 pr-3">{[...dia.vendedores].join(", ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type LeadComVendedor = Lead & { vendedor: User };

function chaveDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function montarResumoPorDia(leads: LeadComVendedor[]) {
  const hoje = new Date();
  const dias = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    return d;
  });

  const porDia = new Map(
    dias.map((d) => [
      chaveDia(d),
      {
        data: chaveDia(d),
        rotulo: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", weekday: "short" }),
        leadsRecebidos: 0,
        leadsConvertidos: 0,
        produtos: new Set<string>(),
        faturamento: 0,
        vendedores: new Set<string>(),
      },
    ])
  );

  for (const l of leads) {
    const resumoRecebido = porDia.get(chaveDia(l.createdAt));
    if (resumoRecebido) resumoRecebido.leadsRecebidos += 1;

    if (l.stage === Stage.FECHADO && l.dataFechamento) {
      const resumoFechado = porDia.get(chaveDia(l.dataFechamento));
      if (resumoFechado) {
        resumoFechado.leadsConvertidos += 1;
        resumoFechado.faturamento += l.valorFechado ?? 0;
        if (l.produtoVendido) resumoFechado.produtos.add(l.produtoVendido);
        resumoFechado.vendedores.add(l.vendedor.nome);
      }
    }
  }

  return [...porDia.values()];
}

function Cartao({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-400">{titulo}</p>
      <p className="text-lg font-bold">{valor}</p>
    </div>
  );
}

function Bloco({
  titulo,
  children,
  className = "",
}: {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-neutral-200 bg-white p-4 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold">{titulo}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function LinhaBarra({ label, valor, total }: { label: string; valor: number; total: number }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-neutral-600">{label}</span>
        <span className="text-neutral-400">{valor}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-neutral-100">
        <div className="h-1.5 rounded-full bg-brand-red" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
