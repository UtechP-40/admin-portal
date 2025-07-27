import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth';
import type { LoginCredentials } from '../services/auth';
import { queryKeys } from '../services/queryClient';

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Get current user query
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: authService.getCurrentUser,
    enabled: authService.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(queryKeys.currentUser(), data.user);
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Redirect to login page
      window.location.href = '/login';
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Clear cache and redirect anyway
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  // Refresh token mutation
  const refreshTokenMutation = useMutation({
    mutationFn: authService.refreshToken,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.currentUser(), data.user);
    },
    onError: () => {
      // If refresh fails, logout user
      logoutMutation.mutate();
    },
  });

  // Password reset request mutation
  const passwordResetRequestMutation = useMutation({
    mutationFn: authService.requestPasswordReset,
  });

  // Password reset mutation
  const passwordResetMutation = useMutation({
    mutationFn: ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) => authService.resetPassword(token, newPassword),
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
  });

  const login = async (credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };

  const refreshToken = async () => {
    return refreshTokenMutation.mutateAsync();
  };

  const requestPasswordReset = async (email: string) => {
    return passwordResetRequestMutation.mutateAsync(email);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    return passwordResetMutation.mutateAsync({ token, newPassword });
  };

  const register = async (data: any) => {
    return registerMutation.mutateAsync(data);
  };

  return {
    // State
    user,
    isAuthenticated: !!user && authService.isAuthenticated(),
    isLoading: isLoading || loginMutation.isPending,
    error: error || loginMutation.error,

    // Actions
    login,
    logout,
    refreshToken,
    requestPasswordReset,
    resetPassword,
    register,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,

    // Password reset states
    isRequestingPasswordReset: passwordResetRequestMutation.isPending,
    isResettingPassword: passwordResetMutation.isPending,
    passwordResetRequestError: passwordResetRequestMutation.error,
    passwordResetError: passwordResetMutation.error,

    // Registration states
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
  };
};

// Create a separate hook for registration to avoid confusion
export const useRegister = () => {
  const { register, isRegistering, registerError } = useAuth();
  return { register, isRegistering, registerError };
};

export default useAuth;
