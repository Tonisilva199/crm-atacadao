import { Role, User } from "@/generated/prisma/client";

// Carla (vendedora) só mexe nos próprios leads.
// Eloísa (gerente) e Admin enxergam e editam tudo.
// Luiza (marketing) não move o funil, mas preenche o produto vendido em cada cliente — ela usa isso pros relatórios.

export function podeVerTodosLeads(user: Pick<User, "role">) {
  return user.role === Role.ADMIN || user.role === Role.GERENTE || user.role === Role.MARKETING;
}

export function podeEditarLead(user: Pick<User, "role" | "id">, vendedorId: string) {
  if (user.role === Role.ADMIN || user.role === Role.GERENTE) return true;
  if (user.role === Role.VENDEDORA) return user.id === vendedorId;
  return false; // MARKETING não move etapa, reatribui ou apaga notas
}

// Quem pode preencher o produto vendido dentro de um cliente: além de quem já edita o lead, a Luiza (marketing) também pode.
export function podePreencherProduto(user: Pick<User, "role" | "id">, vendedorId: string) {
  return podeEditarLead(user, vendedorId) || user.role === Role.MARKETING;
}

export function podeCadastrarLead(user: Pick<User, "role">) {
  return user.role === Role.ADMIN || user.role === Role.GERENTE || user.role === Role.VENDEDORA;
}

export function podeReatribuirVendedor(user: Pick<User, "role">) {
  return user.role === Role.ADMIN || user.role === Role.GERENTE;
}

export function podeVerRelatorios(user: Pick<User, "role">) {
  return true; // todos os papéis têm algum interesse nos relatórios
}

export function podeGerenciarUsuarios(user: Pick<User, "role">) {
  return user.role === Role.ADMIN;
}
