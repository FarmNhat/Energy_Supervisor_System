import React, { useState, createContext, useContext, ReactNode } from 'react';
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
const mockUser: User = {
  id: 'usr-1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  homeName: 'My Home',
  memberSince: 'October 2023'
};
const mockSessions: Session[] = [
{
  id: 'sess-1',
  deviceType: 'Desktop',
  deviceName: 'MacBook Pro 14"',
  browser: 'Chrome on macOS',
  ip: '192.168.1.42',
  location: 'San Francisco, CA',
  lastActive: 'Just now',
  isCurrent: true
},
{
  id: 'sess-2',
  deviceType: 'Mobile',
  deviceName: 'iPhone 13 Pro',
  browser: 'Safari on iOS',
  ip: '10.0.0.115',
  location: 'San Francisco, CA',
  lastActive: '2 hours ago',
  isCurrent: false
},
{
  id: 'sess-3',
  deviceType: 'Desktop',
  deviceName: 'Office iMac',
  browser: 'Firefox on macOS',
  ip: '198.51.100.24',
  location: 'San Jose, CA',
  lastActive: 'Yesterday',
  isCurrent: false
}];

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: {children: ReactNode;}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const login = async (email: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          setIsAuthenticated(true);
          setCurrentUser(mockUser);
          resolve();
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  };
  const register = async (name: string, email: string, password: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsAuthenticated(true);
        setCurrentUser({
          id: 'usr-2',
          name,
          email,
          homeName: `${name.split(' ')[0]}'s Home`,
          memberSince: 'Just now'
        });
        resolve();
      }, 1000);
    });
  };
  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };
  const terminateSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };
  const terminateAllSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
  };
  const updateProfile = (name: string, email: string, homeName: string) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name,
        email,
        homeName
      });
    }
  };
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        sessions,
        login,
        register,
        logout,
        terminateSession,
        terminateAllSessions,
        updateProfile
      }}>

      {children}
    </AuthContext.Provider>);

}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}