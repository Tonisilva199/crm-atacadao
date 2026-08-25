import bcrypt from "bcryptjs";

export async function gerarHashSenha(senha: string) {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string) {
  if (!hash) return false;
  return bcrypt.compare(senha, hash);
}
