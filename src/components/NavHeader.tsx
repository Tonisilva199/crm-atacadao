import Image from "next/image";
import Link from "next/link";
import { User } from "@/generated/prisma/client";
import { NOME_PAPEL } from "@/lib/constants";
import { podeCadastrarLead, podeGerenciarUsuarios } from "@/lib/permissions";
import { logoutAction } from "@/app/logout/actions";

export function NavHeader({ user }: { user: User }) {
  return (
    <header className="flex items-center justify-between border-b-4 border-brand-yellow bg-brand-wood-dark px-6 py-2.5">
      <div className="flex items-center gap-6">
        <Link href="/board" className="flex items-center">
          <Image
            src="/logo-atacadao-branco.png"
            alt="Atacadão de Madeiras"
            width={200}
            height={141}
            className="h-12 w-auto"
            priority
          />
        </Link>
        <nav className="flex gap-5 text-sm font-medium text-brand-wood-light">
          <Link href="/board" className="transition-colors hover:text-brand-yellow">
            Funil
          </Link>
          {podeCadastrarLead(user) && (
            <Link href="/leads/new" className="transition-colors hover:text-brand-yellow">
              Novo Lead
            </Link>
          )}
          <Link href="/relatorios" className="transition-colors hover:text-brand-yellow">
            Relatórios
          </Link>
          {podeGerenciarUsuarios(user) && (
            <>
              <Link href="/usuarios" className="transition-colors hover:text-brand-yellow">
                Usuários
              </Link>
              <Link href="/atividade" className="transition-colors hover:text-brand-yellow">
                Atividade
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-brand-wood-light">
          {user.nome}{" "}
          <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-xs font-semibold text-brand-wood-dark">
            {NOME_PAPEL[user.role]}
          </span>
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-brand-wood-light/70 transition-colors hover:text-white hover:underline"
          >
            sair
          </button>
        </form>
      </div>
    </header>
  );
}
