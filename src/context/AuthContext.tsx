import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '../types/auth';
import { isSupabaseConfigured, parseIdentifier, matchIdentifiers, supabase } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isOnlineConfigured: boolean;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  signInWithCredentials: (
    identifier: string,
    password: string,
    remember: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  signUpWithCredentials: (
    identifier: string,
    password: string,
    displayName: string,
    remember: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (identifier: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_SESSION_KEY = 'fifa_tournament_auth_session';
const LOCAL_ACCOUNTS_KEY = 'fifa_tournament_local_accounts_v1';
const REMEMBER_KEY = 'fifa_tournament_remember_me_pref';

interface LocalAccount {
  id: string;
  identifier: string; // email or phone
  type: 'email' | 'phone';
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  provider: 'email' | 'phone';
  createdAt: string;
}

const DEFAULT_LOCAL_ACCOUNTS: LocalAccount[] = [];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [rememberMe, setRememberMeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const setRememberMe = (val: boolean) => {
    setRememberMeState(val);
    try {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(val));
    } catch {
      // ignore
    }
  };

  // Helper to load/save local accounts when Supabase is not yet connected
  const getLocalAccounts = (): LocalAccount[] => {
    try {
      const data = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return DEFAULT_LOCAL_ACCOUNTS;
  };

  const saveLocalAccounts = (accounts: LocalAccount[]) => {
    try {
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {
      // ignore
    }
  };

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      setLoading(true);

      // Auto-sync any existing local accounts from browser storage to server
      try {
        const localAccounts = getLocalAccounts();
        if (localAccounts.length > 0) {
          fetch('/api/auth/sync-local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ localAccounts }),
          }).catch(() => {
            // Non-blocking background sync
          });
        }
      } catch {
        // Non-blocking
      }

      // 1. If Supabase is configured, listen to Supabase Auth state
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            const u = session.user;
            setUser({
              id: u.id,
              email: u.email,
              phone: u.phone,
              displayName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Usuário',
              avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
              provider: u.app_metadata?.provider === 'google' ? 'google' : u.phone ? 'phone' : 'email',
              createdAt: u.created_at,
            });
            setLoading(false);
            return;
          }

          // Listen for auth events (such as OAuth redirects)
          supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) return;
            if (session?.user) {
              const u = session.user;
              setUser({
                id: u.id,
                email: u.email,
                phone: u.phone,
                displayName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Usuário',
                avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
                provider: u.app_metadata?.provider === 'google' ? 'google' : u.phone ? 'phone' : 'email',
                createdAt: u.created_at,
              });
            } else {
              setUser(null);
            }
          });
        } catch (e) {
          console.warn('Error reading Supabase session:', e);
        }
      }

      // 2. Fallback to persisted local session
      try {
        // Check localStorage first (if Remember Me was true), or sessionStorage
        const saved = localStorage.getItem(STORAGE_SESSION_KEY) || sessionStorage.getItem(STORAGE_SESSION_KEY);
        if (saved && isMounted) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) {
            setUser(parsed);
          }
        }
      } catch (e) {
        console.error('Error reading local session:', e);
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistUserSession = (u: AuthUser, remember: boolean) => {
    setUser(u);
    try {
      const dataStr = JSON.stringify(u);
      if (remember) {
        localStorage.setItem(STORAGE_SESSION_KEY, dataStr);
        sessionStorage.removeItem(STORAGE_SESSION_KEY);
      } else {
        sessionStorage.setItem(STORAGE_SESSION_KEY, dataStr);
        localStorage.removeItem(STORAGE_SESSION_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sign In with Email or Phone + Password
  const signInWithCredentials = async (
    identifier: string,
    password: string,
    remember: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    const parsed = parseIdentifier(identifier);

    // If Supabase is connected, authenticate via Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        let authResult;
        if (parsed.type === 'email') {
          authResult = await supabase.auth.signInWithPassword({
            email: parsed.value,
            password,
          });
        } else {
          authResult = await supabase.auth.signInWithPassword({
            phone: parsed.value,
            password,
          });
        }

        if (authResult.error) {
          return { success: false, error: authResult.error.message };
        }

        const u = authResult.data.user;
        if (u) {
          const formattedUser: AuthUser = {
            id: u.id,
            email: u.email,
            phone: u.phone,
            displayName: u.user_metadata?.full_name || u.user_metadata?.name || parsed.value,
            avatarUrl: u.user_metadata?.avatar_url,
            provider: parsed.type,
            createdAt: u.created_at,
          };
          persistUserSession(formattedUser, remember);
          return { success: true };
        }
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Falha na autenticação.',
        };
      }
    }

    // 2. Primary Cross-Device Authentication via Server API
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        const authUser: AuthUser = data.user;
        persistUserSession(authUser, remember);

        // Update local accounts mirror cache
        const accounts = getLocalAccounts();
        const exists = accounts.find(a => matchIdentifiers(a.identifier, identifier));
        if (!exists) {
          saveLocalAccounts([
            ...accounts,
            {
              id: authUser.id,
              identifier: authUser.email || authUser.phone || identifier,
              type: authUser.phone ? 'phone' : 'email',
              passwordHash: password,
              displayName: authUser.displayName,
              provider: (authUser.provider as 'email' | 'phone') || 'phone',
              createdAt: authUser.createdAt || new Date().toISOString(),
            },
          ]);
        }

        return { success: true };
      } else if (data.error && response.status !== 500) {
        return { success: false, error: data.error };
      }
    } catch (networkErr) {
      console.warn('Server login API unreachable, falling back to local cache:', networkErr);
    }

    // 3. Fallback to Local / Offline authentication
    const accounts = getLocalAccounts();
    const found = accounts.find(acc => matchIdentifiers(acc.identifier, identifier));

    if (!found) {
      return {
        success: false,
        error: 'Nenhuma conta encontrada com este e-mail ou telefone. Crie sua conta primeiro.',
      };
    }

    if (found.passwordHash !== password) {
      return { success: false, error: 'Senha incorreta. Verifique e tente novamente.' };
    }

    const authUser: AuthUser = {
      id: found.id,
      email: found.type === 'email' ? found.identifier : undefined,
      phone: found.type === 'phone' ? found.identifier : undefined,
      displayName: found.displayName,
      avatarUrl: found.avatarUrl,
      provider: found.provider,
      createdAt: found.createdAt,
    };

    persistUserSession(authUser, remember);
    return { success: true };
  };

  // Sign Up with Email or Phone + Password
  const signUpWithCredentials = async (
    identifier: string,
    password: string,
    displayName: string,
    remember: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    const parsed = parseIdentifier(identifier);

    if (password.length < 6) {
      return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
    }

    // If Supabase is connected
    if (isSupabaseConfigured && supabase) {
      try {
        let authResult;
        if (parsed.type === 'email') {
          authResult = await supabase.auth.signUp({
            email: parsed.value,
            password,
            options: {
              data: {
                full_name: displayName,
                name: displayName,
              },
            },
          });
        } else {
          authResult = await supabase.auth.signUp({
            phone: parsed.value,
            password,
            options: {
              data: {
                full_name: displayName,
                name: displayName,
              },
            },
          });
        }

        if (authResult.error) {
          return { success: false, error: authResult.error.message };
        }

        const u = authResult.data.user;
        if (u) {
          const formattedUser: AuthUser = {
            id: u.id,
            email: u.email,
            phone: u.phone,
            displayName: displayName || parsed.value,
            provider: parsed.type,
            createdAt: u.created_at,
          };
          persistUserSession(formattedUser, remember);
          return { success: true };
        }
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Falha ao registrar conta no Supabase.',
        };
      }
    }

    // 2. Primary Cross-Device Registration via Server API
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          displayName: displayName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        const authUser: AuthUser = data.user;
        persistUserSession(authUser, remember);

        // Cache mirror locally
        const accounts = getLocalAccounts();
        saveLocalAccounts([
          ...accounts,
          {
            id: authUser.id,
            identifier: authUser.email || authUser.phone || identifier,
            type: authUser.phone ? 'phone' : 'email',
            passwordHash: password,
            displayName: authUser.displayName,
            provider: (authUser.provider as 'email' | 'phone') || 'phone',
            createdAt: authUser.createdAt || new Date().toISOString(),
          },
        ]);

        return { success: true };
      } else if (data.error) {
        return { success: false, error: data.error };
      }
    } catch (networkErr) {
      console.warn('Server register API unreachable, falling back to local save:', networkErr);
    }

    // 3. Fallback to Local / Offline Registration
    const accounts = getLocalAccounts();
    const existing = accounts.find(acc => matchIdentifiers(acc.identifier, identifier));

    if (existing) {
      return {
        success: false,
        error: 'Já existe uma conta cadastrada com este e-mail ou telefone. Faça login.',
      };
    }

    // Generate unique user ID for Account
    const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAccount: LocalAccount = {
      id: newId,
      identifier: parsed.value,
      type: parsed.type,
      passwordHash: password,
      displayName: displayName.trim() || (parsed.type === 'email' ? parsed.value.split('@')[0] : 'Treinador'),
      provider: parsed.type,
      createdAt: new Date().toISOString(),
    };

    saveLocalAccounts([...accounts, newAccount]);

    const formattedUser: AuthUser = {
      id: newAccount.id,
      email: newAccount.type === 'email' ? newAccount.identifier : undefined,
      phone: newAccount.type === 'phone' ? newAccount.identifier : undefined,
      displayName: newAccount.displayName,
      provider: newAccount.provider,
      createdAt: newAccount.createdAt,
    };

    persistUserSession(formattedUser, remember);
    return { success: true };
  };

  // Password Recovery
  const resetPassword = async (
    identifier: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const parsed = parseIdentifier(identifier);

    if (isSupabaseConfigured && supabase) {
      if (parsed.type === 'email') {
        const { error } = await supabase.auth.resetPasswordForEmail(parsed.value, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return { success: false, error: error.message };
        return {
          success: true,
          message: `Enviamos as instruções de recuperação para ${parsed.value}. Verifique sua caixa de entrada e spam.`,
        };
      } else {
        return {
          success: true,
          message: `Código de redefinição enviado via SMS para o telefone ${parsed.value}.`,
        };
      }
    }

    // Server API reset password
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message };
      } else if (data.error) {
        return { success: false, error: data.error };
      }
    } catch {
      // Local fallback
    }

    // Local simulation
    const accounts = getLocalAccounts();
    const found = accounts.find(a => matchIdentifiers(a.identifier, identifier));
    if (!found) {
      return {
        success: false,
        error: 'Nenhuma conta localizada com este e-mail ou telefone.',
      };
    }

    return {
      success: true,
      message: `Link de redefinição enviado para ${parsed.value}. Senha temporária de teste: 123456`,
    };
  };

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Error signing out from Supabase:', e);
      }
    }

    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      sessionStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {
      // ignore
    }

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOnlineConfigured: isSupabaseConfigured,
        rememberMe,
        setRememberMe,
        signInWithCredentials,
        signUpWithCredentials,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
