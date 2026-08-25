import "dotenv/config";
import { Role } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import { gerarHashSenha } from "../src/lib/senha";

async function main() {
  // corrige o nome antigo "Luiz" para "Luiza" caso já exista no banco
  const luizAntigo = await prisma.user.findFirst({ where: { nome: "Luiz" } });
  if (luizAntigo) {
    await prisma.user.update({ where: { id: luizAntigo.id }, data: { nome: "Luiza" } });
    console.log("Usuário renomeado: Luiz → Luiza");
  }

  const usuarios: { nome: string; role: Role; senhaPadrao: string }[] = [
    { nome: "Carla", role: Role.VENDEDORA, senhaPadrao: "carla123" },
    { nome: "Eloísa", role: Role.GERENTE, senhaPadrao: "eloisa123" },
    { nome: "Luiza", role: Role.MARKETING, senhaPadrao: "luiza123" },
    { nome: "Admin", role: Role.ADMIN, senhaPadrao: "admin123" },
  ];

  console.log("\nSenhas de acesso:");
  for (const u of usuarios) {
    const existente = await prisma.user.findFirst({ where: { nome: u.nome } });
    if (!existente) {
      await prisma.user.create({
        data: { nome: u.nome, role: u.role, senhaHash: await gerarHashSenha(u.senhaPadrao) },
      });
      console.log(`  ${u.nome}: ${u.senhaPadrao}  (usuário criado agora)`);
    } else if (!existente.senhaHash) {
      await prisma.user.update({
        where: { id: existente.id },
        data: { senhaHash: await gerarHashSenha(u.senhaPadrao) },
      });
      console.log(`  ${u.nome}: ${u.senhaPadrao}  (senha definida agora)`);
    } else {
      console.log(`  ${u.nome}: já tem senha definida (não alterada)`);
    }
  }
  console.log("");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
