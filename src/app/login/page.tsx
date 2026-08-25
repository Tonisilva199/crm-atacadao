import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./LoginForm.client";

export default async function LoginPage() {
  const usuarios = await prisma.user.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-yellow p-6">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border-4 border-brand-red bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image src="/logo-atacadao.png" alt="Atacadão de Madeiras" width={220} height={163} priority />
          <p className="text-sm font-medium text-brand-wood-dark">Quem é você?</p>
        </div>

        <LoginForm usuarios={usuarios} />

        {usuarios.length === 0 && (
          <p className="text-center text-sm text-brand-red">
            Nenhum usuário cadastrado ainda. Rode <code>npm run seed</code>.
          </p>
        )}
      </div>
    </div>
  );
}
