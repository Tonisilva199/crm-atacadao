"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { podeGerenciarUsuarios } from "@/lib/permissions";
import { gerarHashSenha } from "@/lib/senha";

export async function criarUsuarioAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !podeGerenciarUsuarios(user)) throw new Error("Sem permissão.");

  const nome = String(formData.get("nome") ?? "").trim();
  const role = String(formData.get("role") ?? "") as Role;
  const senha = String(formData.get("senha") ?? "");
  if (!nome || !role) throw new Error("Preencha nome e papel.");
  if (senha.length < 4) throw new Error("A senha precisa ter pelo menos 4 caracteres.");

  const novo = await prisma.user.create({ data: { nome, role, senhaHash: await gerarHashSenha(senha) } });

  await prisma.auditLog.create({
    data: {
      autorId: user.id,
      acao: "USUARIO_CRIADO",
      detalhe: `${user.nome} criou o usuário ${novo.nome}.`,
    },
  });

  revalidatePath("/usuarios");
  revalidatePath("/atividade");
}

export async function desativarUsuarioAction(userId: string) {
  const user = await getCurrentUser();
  if (!user || !podeGerenciarUsuarios(user)) throw new Error("Sem permissão.");

  const alvo = await prisma.user.update({ where: { id: userId }, data: { ativo: false } });

  await prisma.auditLog.create({
    data: {
      autorId: user.id,
      acao: "USUARIO_DESATIVADO",
      detalhe: `${user.nome} desativou o usuário ${alvo.nome}.`,
    },
  });

  revalidatePath("/usuarios");
  revalidatePath("/atividade");
}

export async function redefinirSenhaAction(userId: string, novaSenha: string) {
  const user = await getCurrentUser();
  if (!user || !podeGerenciarUsuarios(user)) throw new Error("Sem permissão.");
  if (novaSenha.length < 4) throw new Error("A senha precisa ter pelo menos 4 caracteres.");

  const alvo = await prisma.user.update({
    where: { id: userId },
    data: { senhaHash: await gerarHashSenha(novaSenha) },
  });

  await prisma.auditLog.create({
    data: {
      autorId: user.id,
      acao: "SENHA_REDEFINIDA",
      detalhe: `${user.nome} redefiniu a senha de ${alvo.nome}.`,
    },
  });

  revalidatePath("/usuarios");
  revalidatePath("/atividade");
}
