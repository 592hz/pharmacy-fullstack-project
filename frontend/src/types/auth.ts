export interface IUser {
  _id: string;
  username: string;
  name: string;
  email?: string;
  role: 'admin' | 'staff';
  createdAt?: string;
}

export interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: IUser) => void;
  logout: () => void;
}
