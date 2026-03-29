import { createContext } from 'react';
import { type Login, type Signup } from '../lib/schemas';

export type User = {
    id: string;
    username: string;
    role: string;
    [key: string]: unknown;
} | null;

export interface AuthContextType {
    user: User;
    token: string | null;
    login: (credentials: Login) => Promise<void>;
    register: (userData: Signup) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
