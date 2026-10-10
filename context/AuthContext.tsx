import { createContext, ReactNode, useState } from 'react';

// Definimos la estructura del usuario
export interface User {
  id: string;
  nombre_usuario?: string;
  correo: string;
  password?: string;
  rol: 'Estudiante' | 'Docente';
}

// Definimos qué contendrá el contexto global
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};