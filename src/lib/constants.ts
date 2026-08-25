import { Origem, Role, Stage } from "@/generated/prisma/browser";

export const ETAPAS_FUNIL: Stage[] = [
  Stage.NOVO,
  Stage.EM_ATENDIMENTO,
  Stage.PROPOSTA,
  Stage.FECHADO,
  Stage.PERDIDO,
];

export const NOME_ETAPA: Record<Stage, string> = {
  NOVO: "Novo Lead",
  EM_ATENDIMENTO: "Em Atendimento",
  PROPOSTA: "Proposta Enviada",
  FECHADO: "Fechado (Ganho)",
  PERDIDO: "Perdido",
};

export const NOME_ORIGEM: Record<Origem, string> = {
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  INDICACAO: "Indicação",
  LOJA_FISICA: "Loja Física",
  SITE: "Site",
  OUTRO: "Outro",
};

export const NOME_PAPEL: Record<Role, string> = {
  ADMIN: "Administrador",
  GERENTE: "Gerente",
  VENDEDORA: "Vendedora",
  MARKETING: "Marketing",
};
