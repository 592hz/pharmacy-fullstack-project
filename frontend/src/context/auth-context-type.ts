import { createContext } from 'react';
import { type Login, type Signup } from '../lib/schemas';

import type { IUser } from '../types/auth';

export type User = IUser | null;

export interface AuthContextType {
    user: User;
    token: string | null;
    login: (credentials: Login) => Promise<void>;
    register: (userData: Signup) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
