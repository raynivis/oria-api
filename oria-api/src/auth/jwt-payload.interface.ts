export interface JwtPayload {
  sub: string;
  email: string;
}

export interface UsuarioAutenticado {
  id: string;
  email: string;
}
