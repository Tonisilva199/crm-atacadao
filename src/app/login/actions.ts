"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setCurrentUserCookie } from "@/lib/auth";
import { verificarSenha } from "@/lib/senha";

export type LoginState = { erro?: string } | undefined;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const userId = String(formData.get("userId") ?? "");
  const senha = String(formData.get("senha") ?? "");
  if (!userId || !senha) return { erro: "Informe a senha." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.ativo) return { erro: "Usuário não encontrado." };

  const senhaOk = await verificarSenha(senha, user.senhaHash);
  if (!senhaOk) return { erro: "Senha incorreta." };

  await setCurrentUserCookie(user.id);
  await prisma.auditLog.create({
    data: { autorId: user.id, acao: "LOGIN", detalhe: `${user.nome} entrou no sistema.` },
  });

  redirect("/board");
}
