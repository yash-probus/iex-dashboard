export interface LoginDTO {
  username?: string;
  password?: string;
}

export interface AdminResponse {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  admin: AdminResponse;
}
