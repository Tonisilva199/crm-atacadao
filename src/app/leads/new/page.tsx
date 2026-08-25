import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { podeCadastrarLead } from "@/lib/permissions";
import { NOME_ORIGEM } from "@/lib/constants";
import { Origem } from "@/generated/prisma/client";
import { criarLeadAction } from "./actions";

export default async function NovoLeadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!podeCadastrarLead(user)) redirect("/board");

  const vendedores =
    user.role !== "VENDEDORA"
      ? await prisma.user.findMany({ where: { role: "VENDEDORA", ativo: true } })
      : [];

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-1 text-xl font-bold">Cadastrar novo lead</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Registre o contato assim que a mensagem chegar pelo WhatsApp.
      </p>

      <form action={criarLeadAction} className="flex flex-col gap-4">
        <Campo label="Nome do cliente">
          <input name="nomeCliente" required className="input" />
        </Campo>

        <Campo label="WhatsApp">
          <input name="whatsapp" required placeholder="(00) 00000-0000" className="input" />
        </Campo>

        <Campo label="O que a pessoa procurou">
          <textarea
            name="oQueProcurou"
            required
            rows={2}
            placeholder="Ex: cozinha planejada, MDF branco 15mm, closet..."
            className="input"
          />
        </Campo>

        <Campo label="Origem do contato">
          <select name="origem" defaultValue={Origem.WHATSAPP} className="input">
            {Object.entries(NOME_ORIGEM).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
        </Campo>

        {vendedores.length > 0 && (
          <Campo label="Atribuir à vendedora">
            <select name="vendedorId" defaultValue={vendedores[0]?.id} className="input">
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </Campo>
        )}

        <button
          type="submit"
          className="mt-2 rounded-md bg-brand-red px-4 py-2 font-medium text-white hover:bg-brand-red-dark"
        >
          Cadastrar e abrir no funil
        </button>
      </form>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
