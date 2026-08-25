import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { podeGerenciarUsuarios } from "@/lib/permissions";
import { NOME_PAPEL } from "@/lib/constants";
import { Role } from "@/generated/prisma/client";
import { criarUsuarioAction, desativarUsuarioAction } from "./actions";
import { RedefinirSenha } from "./RedefinirSenha.client";

export default async function UsuariosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!podeGerenciarUsuarios(user)) redirect("/board");

  const usuarios = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-xl font-bold">Usuários</h1>

      <ul className="mb-8 flex flex-col gap-2">
        {usuarios.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <span>
              {u.nome} <span className="text-neutral-400">— {NOME_PAPEL[u.role]}</span>
              {!u.ativo && <span className="ml-2 text-xs text-brand-red">(inativo)</span>}
            </span>
            <div className="flex items-center gap-3">
              <RedefinirSenha userId={u.id} />
              {u.ativo && u.id !== user.id && (
                <form action={desativarUsuarioAction.bind(null, u.id)}>
                  <button type="submit" className="text-xs text-neutral-400 hover:text-brand-red">
                    desativar
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mb-3 text-sm font-semibold">Adicionar usuário</h2>
      <form action={criarUsuarioAction} className="flex flex-col gap-3">
        <input name="nome" required placeholder="Nome" className="input" />
        <select name="role" defaultValue={Role.VENDEDORA} className="input">
          {Object.entries(NOME_PAPEL).map(([valor, nome]) => (
            <option key={valor} value={valor}>
              {nome}
            </option>
          ))}
        </select>
        <input
          name="senha"
          type="text"
          required
          minLength={4}
          placeholder="Senha de acesso (mín. 4 caracteres)"
          className="input"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white hover:bg-brand-red-dark"
        >
          Adicionar
        </button>
      </form>
    </div>
  );
}
