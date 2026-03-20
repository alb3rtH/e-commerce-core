import { Request } from 'express';

export interface UserPayload {
  id: string;
  name: string;
  lastname: string;
  role: string;
}

// Estructura completa del JWT Payload
export interface JwtPayload {
  user: UserPayload;
  iat: number;
  exp: number;
  iss: string;
}

export interface RequestWithUser extends Request {
  user: UserPayload;
}
