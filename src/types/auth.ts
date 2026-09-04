export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  displayName: string;
  avatarUrl?: string;
  provider?: 'email' | 'phone' | 'google';
  createdAt?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  rememberMe: boolean;
  isOnlineConfigured: boolean;
}
