'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { initializeAuth, setUser, setLoading } from '@/store/slices/authSlice';
import { apiClient } from '@/lib/api';
import { MemberWithRelationships } from '@/types';

export function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initAuth = async () => {
      dispatch(setLoading(true));

      try {
        // Check if we have tokens in localStorage
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (accessToken && refreshToken) {
          // Initialize tokens in store
          dispatch(initializeAuth({ accessToken, refreshToken }));

          // Try to get user profile to verify token is still valid
          try {
            const response = await apiClient.get<MemberWithRelationships>('/members/profile');
            if (response) {
              // Extract user data from member profile response
              const userData = {
                id: response.id || '',
                email: response.personalInfo?.email || '',
                phone: response.personalInfo?.phoneNumber || '',
                memberId: response.id,
                member: {
                  id: response.id,
                  name: response.name,
                  gender: response.gender,
                  status: response.status,
                  personalInfo: response.personalInfo,
                  createdAt: response.createdAt,
                  updatedAt: response.updatedAt,
                },
              };
              dispatch(setUser(userData));
            }
          } catch (error) {
            // Token is invalid, remove it
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            console.log('Token validation failed, clearing stored tokens');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    initAuth();
  }, [dispatch]);

  return null;
}
