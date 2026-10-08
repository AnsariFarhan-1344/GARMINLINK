import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  currentUser: User;
  currentRole: UserRole;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  availableUsers: User[];
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]); // Defaults to Entrepreneur / SHG
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  const switchRole = (role: UserRole) => {
    const matchedUser = mockUsers.find(u => u.role === role) || mockUsers[0];
    setCurrentUser(matchedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser.role,
        setCurrentUser,
        switchRole,
        availableUsers: mockUsers,
        isDemoMode,
        setIsDemoMode
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
