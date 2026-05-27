import { Role } from './auth.model';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
  dataCriacao: string;
}

export interface UsuarioUpdateRequest {
  nome: string;
  email: string;
  novaSenha?: string;
}
