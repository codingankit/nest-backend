export interface EmailResponse {
  success: boolean;
  to: string[];
  messageId: string;
  response: string;
  durationMs: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
