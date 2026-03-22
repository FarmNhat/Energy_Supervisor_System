import React, { ReactNode, createContext, useContext, useMemo, useState } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const AUTH_STORAGE_KEY = 'energy-supervisor.auth';

export interface User {
  id: string;
  name: string;
  email: string;
  homeName: string;
  memberSince: string;
}

export interface Session {
  id: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  deviceName: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  sessions: Session[];
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  terminateSession: (id: string) => void;
  terminateAllSessions: () => void;
  updateProfile: (name: string, email: string, homeName: string) => void;
}

interface BackendAuthUser {
  user_id: number;
  username: string;
  created_at?: string | null;
}

interface BackendAuthResponse {
  access_token: string;
  user: BackendAuthUser;
}

interface PersistedAuthState {
  token: string;
  user: User;
}

const defaultSessions: Session[] = [
  {
    id: 'sess-current',
    deviceType: 'Desktop',
    deviceName: 'Primary Console',
    browser: 'Chrome on Linux',
    ip: '127.0.0.1',
    location: 'Local Operator Terminal',
    lastActive: 'Just now',
    isCurrent: true,
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatMemberSince(createdAt?: string | null) {
  if (!createdAt) {
    return 'Provisioned now';
  }

  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Provisioned now';
  }

  return `Provisioned ${parsed.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })}`;
}

function deriveOperatorName(username: string, preferredName?: string) {
  if (preferredName?.trim()) {
    return preferredName.trim();
  }

  const localPart = username.split('@')[0] ?? username;
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Operator';
}

function toUser(authUser: BackendAuthUser, preferredName?: string): User {
  const operatorName = deriveOperatorName(authUser.username, preferredName);
  return {
    id: `usr-${authUser.user_id}`,
    name: operatorName,
    email: authUser.username,
    homeName: `${operatorName.split(' ')[0] || 'Operator'} Console`,
    memberSince: formatMemberSince(authUser.created_at),
  };
}

function readPersistedAuth(): PersistedAuthState | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedAuthState;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function persistAuthState(nextState: PersistedAuthState | null) {
  if (nextState === null) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
}

async function authenticate(endpoint: string, username: string, password: string) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error(`Cannot reach backend at ${API_BASE_URL}. Start the API first.`);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? `Authentication request failed with ${response.status}`);
  }

  return (await response.json()) as BackendAuthResponse;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const persisted = useMemo(() => readPersistedAuth(), []);
  const [currentUser, setCurrentUser] = useState<User | null>(persisted?.user ?? null);
  const [token, setToken] = useState<string | null>(persisted?.token ?? null);
  const [sessions, setSessions] = useState<Session[]>(defaultSessions);

  const login = async (email: string, password: string) => {
    const auth = await authenticate('/api/auth/login', email, password);
    const user = toUser(auth.user, currentUser?.email === auth.user.username ? currentUser.name : undefined);
    setToken(auth.access_token);
    setCurrentUser(user);
    persistAuthState({ token: auth.access_token, user });
  };

  const register = async (name: string, email: string, password: string) => {
    const auth = await authenticate('/api/auth/register', email, password);
    const user = toUser(auth.user, name);
    setToken(auth.access_token);
    setCurrentUser(user);
    persistAuthState({ token: auth.access_token, user });
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    persistAuthState(null);
  };

  const terminateSession = (id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
  };

  const terminateAllSessions = () => {
    setSessions((prev) => prev.filter((session) => session.isCurrent));
  };

  const updateProfile = (name: string, email: string, homeName: string) => {
    setCurrentUser((previous) => {
      if (previous === null) {
        return previous;
      }

      const nextUser = {
        ...previous,
        name,
        email,
        homeName,
      };
      persistAuthState(token ? { token, user: nextUser } : null);
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(token && currentUser),
        currentUser,
        sessions,
        login,
        register,
        logout,
        terminateSession,
        terminateAllSessions,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
