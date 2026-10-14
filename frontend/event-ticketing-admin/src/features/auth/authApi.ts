import apiClient from '@/lib/axios';
import type { AuthResponseDto, UserProfileDto } from '@/types/api';

export interface OrganizerProfile {
  id: string;
  name: string;
  description?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  verificationLevel: 'Unverified' | 'Basic' | 'Pro' | 'Enterprise';
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ORGANIZER' | 'CUSTOMER' | 'ACCESS_OPERATOR';
  organizer?: OrganizerProfile;
}

export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await apiClient.post<AuthResponseDto>('/api/auth/login', { email, password });
    const { token, userId, firstName, lastName, role } = res.data;

    try {
      const profileRes = await apiClient.get<UserProfileDto>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        token,
        user: {
          id: profileRes.data.id,
          email: profileRes.data.email,
          firstName: profileRes.data.firstName,
          lastName: profileRes.data.lastName,
          role: profileRes.data.role as User['role'],
          organizer: profileRes.data.organizer as OrganizerProfile | undefined,
        },
      };
    } catch {
      return {
        token,
        user: {
          id: userId,
          email,
          firstName,
          lastName,
          role: role as User['role'],
        },
      };
    }
  },

  getMe: async (token?: string): Promise<User> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const res = await apiClient.get<UserProfileDto>('/api/auth/me', { headers });
    return {
      id: res.data.id,
      email: res.data.email,
      firstName: res.data.firstName,
      lastName: res.data.lastName,
      role: res.data.role as User['role'],
      organizer: res.data.organizer as OrganizerProfile | undefined,
    };
  },
};
