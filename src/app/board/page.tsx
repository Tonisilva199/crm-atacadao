import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { podeVerTodosLeads } from "@/lib/permissions";
import { Board } from "./Board.client";

export default async function BoardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const verTudo = podeVerTodosLeads(user);

  const leads = await prisma.lead.findMany({
    where: verTudo ? {} : { vendedorId: user.id },
    include: { vendedor: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">Funil de Vendas</h1>
      <Board leads={leads} currentUser={user} mostrarVendedor={verTudo} />
    </div>
  );
}
