import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  MemberWithRelationships,
  UpdateMemberRequest,
  AddRelationshipRequest,
  CreateMemberRequest,
  Member,
  Family,
  Invitation,
  Post,
  Comment,
  Notification,
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
  PostQueryParams,
  NotificationQueryParams,
  UploadedFile,
  FileUploadResponse,
  ExportRequest,
  FolderTreeExportData,
} from "@/types";
import { useAppDispatch, useAppSelector } from "./redux";
import { loginSuccess, logout, setProfile } from "@/store/slices/authSlice";
import toast from "react-hot-toast";

// Auth hooks (state-free approach)
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiClient.post<{ data: AuthResponse }>(
        "/auth/login",
        credentials
      );
      return response;
    },
    onSuccess: async (data: any) => {
      // Store tokens in localStorage directly
      if (data?.data?.accessToken && data?.data?.refreshToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
      }

      // Invalidate queries to trigger fresh data fetching
      queryClient.invalidateQueries();

      toast.success("Login successful!");

      // Redirect to dashboard or saved URL
      setTimeout(() => {
        const savedUrl = localStorage.getItem("savedNavigationUrl");
        if (savedUrl && savedUrl.startsWith("/")) {
          localStorage.removeItem("savedNavigationUrl");
          window.location.href = savedUrl;
        } else {
          window.location.href = "/dashboard";
        }
      }, 100);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Login failed");
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await apiClient.post<{ data: AuthResponse }>(
        "/auth/register",
        data
      );
      return response;
    },
    onSuccess: async (data) => {
      // Store tokens in localStorage directly
      if (data?.data?.accessToken && data?.data?.refreshToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
      }

      // Invalidate queries to trigger fresh data fetching
      queryClient.invalidateQueries();

      toast.success("Registration successful!");

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Registration failed");
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    // Clear tokens from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("savedNavigationUrl");
    }

    // Clear all cached data
    queryClient.clear();

    toast.success("Logged out successfully");

    // Use Next.js router for client-side navigation
    if (typeof window !== "undefined") {
      // Small delay to allow cleanup to complete
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    }
  };
};

// File Upload hooks
export const useUploadFile = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post<Response>("/upload", formData);

      // Extract JSON from Response object
      if (response instanceof Response) {
        const data = await response.json();
        return data as FileUploadResponse;
      }

      return response as FileUploadResponse;
    },
    onSuccess: () => {
      toast.success("File uploaded successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload file");
    },
  });
};

export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post<Response>(
        "/upload/profile-image",
        formData
      );

      // Extract JSON from Response object
      if (response instanceof Response) {
        const data = await response.json();
        return data as FileUploadResponse;
      }

      return response as FileUploadResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile image updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload profile image");
    },
  });
};

export const useDeleteFile = () => {
  return useMutation({
    mutationFn: async (fileId: string) => {
      await apiClient.delete(`/upload/${fileId}`);
    },
    onSuccess: () => {
      toast.success("File deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete file");
    },
  });
};

// Member hooks (state-free approach)
export const useProfile = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined") return;

      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken || !refreshToken) {
        setIsAuthenticated(false);
        return;
      }

      // Try to fetch profile to verify token validity
      try {
        await apiClient.get<MemberWithRelationships>("/members/profile");
        setIsAuthenticated(true);
      } catch (error) {
        // Token is invalid, clear it
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await apiClient.get<MemberWithRelationships>(
        "/members/profile"
      );
      return response;
    },
    enabled: isAuthenticated === true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Redux-based profile hook (preferred)
export const useProfileFromStore = () => {
  const { profile, isAuthenticated } = useAppSelector((state) => state.auth);
  return { profile, isAuthenticated };
};

// Hook for automatic redirection when profile is missing (state-free approach)
export const useAuthGuard = () => {
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean | null;
    hasProfile: boolean;
    profile: MemberWithRelationships | null;
    isLoading: boolean;
  }>({
    isAuthenticated: null,
    hasProfile: false,
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined") return;

      try {
        // Check for tokens in localStorage
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!accessToken || !refreshToken) {
          setAuthStatus({
            isAuthenticated: false,
            hasProfile: false,
            profile: null,
            isLoading: false,
          });
          return;
        }

        // Try to fetch profile to verify token validity
        try {
          const response = await apiClient.get<MemberWithRelationships>(
            "/members/profile"
          );

          setAuthStatus({
            isAuthenticated: true,
            hasProfile: true,
            profile: response,
            isLoading: false,
          });
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");

          setAuthStatus({
            isAuthenticated: false,
            hasProfile: false,
            profile: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthStatus({
          isAuthenticated: false,
          hasProfile: false,
          profile: null,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  // Handle redirection logic
  useEffect(() => {
    if (typeof window === "undefined" || authStatus.isLoading) return;

    if (!authStatus.isAuthenticated) {
      // Check if we're on a protected route
      const currentPath = window.location.pathname;
      const isOnProtectedRoute =
        !currentPath.startsWith("/login") &&
        !currentPath.startsWith("/signup") &&
        currentPath !== "/";

      // Only redirect if we're on a protected route
      if (isOnProtectedRoute) {
        // Check if there's a saved navigation URL
        const savedUrl = localStorage.getItem("savedNavigationUrl");
        if (!savedUrl || savedUrl === "/" || savedUrl === currentPath) {
          // Use Next.js router for client-side navigation
          setTimeout(() => {
            window.location.href = "/";
          }, 100);
        }
      }
    }
  }, [authStatus.isAuthenticated, authStatus.isLoading]);

  return {
    profile: authStatus.profile,
    isAuthenticated: authStatus.isAuthenticated,
    hasProfile: authStatus.hasProfile,
    loading: authStatus.isLoading,
  };
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData | UpdateMemberRequest) => {
      console.log("[API Hook] useUpdateProfile - Mutation started", {
        dataType: data instanceof FormData ? "FormData" : "JSON",
        hasFile: data instanceof FormData,
      });

      // If it's FormData, use the API client with FormData support
      if (data instanceof FormData) {
        console.log("[API Hook] useUpdateProfile - Sending FormData request");
        const response = await apiClient.put<MemberWithRelationships>(
          "/members/profile",
          data,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log("[API Hook] useUpdateProfile - FormData request completed");
        return response;
      }

      // Otherwise, use regular JSON request
      console.log("[API Hook] useUpdateProfile - Sending JSON request");
      const response = await apiClient.put<MemberWithRelationships>(
        "/members/profile",
        data
      );
      console.log("[API Hook] useUpdateProfile - JSON request completed");
      return response;
    },
    onSuccess: (updatedProfile) => {
      console.log("[API Hook] useUpdateProfile - Mutation successful", {
        hasUpdatedProfile: !!updatedProfile,
      });
      // Invalidate profile queries to trigger fresh data fetching
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully!");
    },
    onError: (error: Error) => {
      console.error("[API Hook] useUpdateProfile - Mutation failed:", error);
      toast.error(error.message || "Failed to update profile");
    },
    onMutate: () => {
      console.log("[API Hook] useUpdateProfile - Mutation initiated");
    },
    onSettled: () => {
      console.log("[API Hook] useUpdateProfile - Mutation settled");
    },
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMemberRequest) => {
      const response = await apiClient.post<Member>("/members", data);
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({
        queryKey: ["family-members", variables.familyId],
      });
      queryClient.invalidateQueries({ queryKey: ["families"] });
      toast.success("Family member created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create family member");
    },
  });
};

export const useAddRelationship = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddRelationshipRequest) => {
      await apiClient.post("/members/relationships", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["member-details"] });
      toast.success("Relationship added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add relationship");
    },
  });
};

export const useAddRelationshipToMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      data,
    }: {
      memberId: string;
      data: AddRelationshipRequest;
    }) => {
      await apiClient.post(`/members/${memberId}/relationships`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["member-details"] });
      toast.success("Relationship added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add relationship");
    },
  });
};

export const useRemoveRelationship = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddRelationshipRequest) => {
      await apiClient.delete("/members/relationships", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["member-details"] });
      toast.success("Relationship removed successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove relationship");
    },
  });
};

export const useRemoveRelationshipToMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      data,
    }: {
      memberId: string;
      data: AddRelationshipRequest;
    }) => {
      await apiClient.delete(`/members/${memberId}/relationships`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["member-details"] });
      toast.success("Relationship removed successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add relationship");
    },
  });
};

export const useFamilyMembers = (familyId: string) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined") return;

      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken || !refreshToken) {
        setIsAuthenticated(false);
        return;
      }

      // Try to fetch profile to verify token validity
      try {
        await apiClient.get<MemberWithRelationships>("/members/profile");
        setIsAuthenticated(true);
      } catch (error) {
        // Token is invalid, clear it
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return useQuery({
    queryKey: ["family-members", familyId],
    queryFn: async () => {
      const response = await apiClient.get<Member[]>(
        `/members/family/${familyId}`
      );
      return response;
    },
    enabled: isAuthenticated === true && !!familyId,
  });
};

// Family hooks
export const useFamilies = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["families"],
    queryFn: async () => {
      const response = await apiClient.get<Family[]>("/families");
      return response;
    },
    enabled: isAuthenticated,
  });
};

export const useFamily = (familyId: string) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["family", familyId],
    queryFn: async () => {
      const response = await apiClient.get<Family>(`/families/${familyId}`);
      return response;
    },
    enabled: isAuthenticated && !!familyId,
  });
};

export const useCreateFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      isSubFamily?: boolean;
      parentFamilyId?: string;
      addCreatorAsMember?: boolean;
    }) => {
      const response = await apiClient.post<Family>("/families", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Family created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create family");
    },
  });
};

export const useAddMemberToFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      memberId,
      role,
    }: {
      familyId: string;
      memberId: string;
      role: "MEMBER" | "HEAD" | "ADMIN";
    }) => {
      const response = await apiClient.post(`/families/${familyId}/members`, {
        memberId,
        role,
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({
        queryKey: ["family-members", variables.familyId],
      });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Member added to family successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add member to family");
    },
  });
};

export const useRemoveMemberFromFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      memberId,
    }: {
      familyId: string;
      memberId: string;
    }) => {
      const response = await apiClient.delete(
        `/families/${familyId}/members/${memberId}`
      );
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({
        queryKey: ["family-members", variables.familyId],
      });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Member removed from family successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove member from family");
    },
  });
};

export const useSoftDeleteFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (familyId: string) => {
      const response = await apiClient.delete(`/families/${familyId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Family deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete family");
    },
  });
};

export const useRestoreFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (familyId: string) => {
      const response = await apiClient.post(`/families/${familyId}/restore`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Family restored successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to restore family");
    },
  });
};

// Invitation hooks
export const useCreateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      familyId: string;
      memberStub?: Record<string, unknown>;
    }) => {
      const response = await apiClient.post<Invitation>("/invitations", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create invitation");
    },
  });
};

export const useMyInvitations = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["my-invitations"],
    queryFn: async () => {
      const response = await apiClient.get<Invitation[]>(
        "/invitations/my-invitations"
      );
      return response;
    },
    enabled: isAuthenticated,
  });
};

export const useValidateInvitation = (code: string) => {
  return useQuery({
    queryKey: ["validate-invitation", code],
    queryFn: async () => {
      const response = await apiClient.get<{
        isValid: boolean;
        familyName: string;
        inviterName: string;
        memberStub?: Record<string, unknown>;
        expiresAt: Date;
      }>(`/invitations/validate?code=${encodeURIComponent(code)}`);
      return response;
    },
    enabled: !!code,
  });
};

// Social Feed - Post hooks
export const usePosts = (params?: PostQueryParams) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["posts", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.familyId) searchParams.set("familyId", params.familyId);
      if (params?.visibility) searchParams.set("visibility", params.visibility);
      if (params?.authorId) searchParams.set("authorId", params.authorId);

      const response = await apiClient.get<{
        posts: Post[];
        pagination: {
          current: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(`/posts?${searchParams.toString()}`);
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const usePost = (postId: string) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const response = await apiClient.get<Post>(`/posts/${postId}`);
      return response;
    },
    enabled: isAuthenticated && !!postId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePostRequest) => {
      const response = await apiClient.post<Post>("/posts", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create post");
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      data,
    }: {
      postId: string;
      data: UpdatePostRequest;
    }) => {
      const response = await apiClient.put<Post>(`/posts/${postId}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      toast.success("Post updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update post");
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      await apiClient.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete post");
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiClient.post<{
        liked: boolean;
        message: string;
      }>(`/posts/${postId}/like`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to like post");
    },
  });
};

// Social Feed - Comment hooks
export const useComments = (
  postId: string,
  params?: { page?: number; limit?: number }
) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["comments", postId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());

      const response = await apiClient.get<Comment[]>(
        `/posts/${postId}/comments?${searchParams.toString()}`
      );
      return response;
    },
    enabled: isAuthenticated && !!postId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      data,
    }: {
      postId: string;
      data: CreateCommentRequest;
    }) => {
      const response = await apiClient.post<Comment>(
        `/posts/${postId}/comments`,
        data
      );
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      toast.success("Comment added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      data,
    }: {
      commentId: string;
      data: Partial<CreateCommentRequest>;
    }) => {
      const response = await apiClient.put<Comment>(
        `/comments/${commentId}`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comment updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update comment");
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await apiClient.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comment deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete comment");
    },
  });
};

export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiClient.post<{
        liked: boolean;
        message: string;
      }>(`/comments/${commentId}/like`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to like comment");
    },
  });
};

// Social Feed - Notification hooks
export const useNotifications = (params?: NotificationQueryParams) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["notifications", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.isRead !== undefined)
        searchParams.set("isRead", params.isRead.toString());
      if (params?.type) searchParams.set("type", params.type);

      const response = await apiClient.get<{
        notifications: Notification[];
        pagination: {
          current: number;
          limit: number;
          total: number;
          pages: number;
        };
        unreadCount: number;
      }>(`/notifications?${searchParams.toString()}`);
      return response;
    },
    enabled: isAuthenticated,
    refetchInterval: 120000, // Refetch every 2 minutes instead of 30 seconds
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    staleTime: 60000, // Consider data fresh for 1 minute
  });
};

export const useUnreadNotificationCount = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const response = await apiClient.get<{ unreadCount: number }>(
        "/notifications/unread-count"
      );
      return response;
    },
    enabled: isAuthenticated,
    refetchInterval: 300000, // Refetch every 5 minutes instead of 2 minutes
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    staleTime: 60000, // Consider data fresh for 1 minute
    retry: (failureCount, error: any) => {
      // Don't retry on 429 errors to avoid making it worse
      if (error?.status === 429) {
        console.warn("Rate limited - skipping retry for unread count");
        return false;
      }
      // Retry up to 2 times for other errors with longer delay
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 60000), // Exponential backoff
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      notificationId,
      isRead,
    }: {
      notificationId: string;
      isRead: boolean;
    }) => {
      const response = await apiClient.put<Notification>(
        `/notifications/${notificationId}/read`,
        { isRead }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update notification");
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.put<{ message: string; count: number }>(
        "/notifications/mark-all-read"
      );
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark all notifications as read");
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
      toast.success("Notification deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete notification");
    },
  });
};

// Enhanced Export hooks
export const useExportFamilyData = () => {
  return useMutation({
    mutationFn: async (exportRequest: ExportRequest) => {
      const response = await apiClient.post<{
        downloadUrl: string;
        filename: string;
      }>("/export/family-data", exportRequest);
      return response;
    },
    onSuccess: async (result, variables) => {
      if (result && result.downloadUrl) {
        // Ensure full URL for download
        const fullUrl = result.downloadUrl.startsWith("http")
          ? result.downloadUrl
          : `${window.location.origin}${result.downloadUrl}`;

        console.log("Download URL:", fullUrl);

        // Get JWT token from localStorage
        const token = localStorage.getItem("accessToken");

        try {
          // Try direct link approach first with token in URL
          // const urlWithToken = token
          //   ? `${fullUrl}${
          //       fullUrl.includes("?") ? "&" : "?"
          //     }token=${encodeURIComponent(token)}`
          //   : fullUrl;

          const link = document.createElement("a");
          link.href = fullUrl; // urlWithToken;
          link.download = result.filename || `family-tree.${variables.format}`;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success(
            `${variables.format.toUpperCase()} exported successfully!`
          );
        } catch (error) {
          console.error(
            "Direct download failed, trying fetch approach:",
            error
          );

          // Fallback: Use fetch with Authorization header
          try {
            const response = await fetch(fullUrl, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
              );
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download =
              result.filename || `family-tree.${variables.format}`;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up blob URL
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);

            toast.success(
              `${variables.format.toUpperCase()} exported successfully!`
            );
          } catch (fallbackError) {
            console.error("Fallback download also failed:", fallbackError);
            toast.error("Download failed. Please try again.");
          }
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export family data");
    },
  });
};

export const useGetFolderTreeData = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["folder-tree-data"],
    queryFn: async () => {
      const response = await apiClient.get<FolderTreeExportData>(
        "/export/folder-tree-data"
      );
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Family Tree hooks - Enhanced for better explorer experience
export const useFamilyTree = (
  familyId: string,
  centerMemberId?: string,
  depth: number = 2
) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["family-tree", familyId, centerMemberId, depth],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (centerMemberId) searchParams.set("centerMemberId", centerMemberId);
      if (depth > 0) searchParams.set("depth", depth.toString());

      const response = await apiClient.get<{
        nodes: any[];
        connections: any[];
        metadata: {
          totalMembers: number;
          generations: number;
          depth: number;
        };
      }>(`/tree/${familyId}?${searchParams.toString()}`);
      return response;
    },
    enabled: isAuthenticated && !!familyId && familyId !== "default",
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 403 (Forbidden) errors
      if (error?.status === 403) {
        return false;
      }
      // Don't retry on 404 (Not Found) errors
      if (error?.status === 404) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

export const useMemberRelationships = (memberId: string, depth: number = 2) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["member-relationships", memberId, depth],
    queryFn: async () => {
      const response = await apiClient.get<MemberWithRelationships>(
        `/members/${memberId}`
      );
      // Transform the response to match the expected format
      return {
        member: response,
        parents: response.parents || [],
        spouses: response.spouses || [],
        children: response.children || [],
        metadata: {
          hasMoreParents: false,
          hasMoreChildren: false,
          totalRelationships:
            (response.parents?.length || 0) +
            (response.spouses?.length || 0) +
            (response.children?.length || 0),
        },
      };
    },
    enabled: isAuthenticated && !!memberId,
    staleTime: 1000 * 60 * 10, // 10 minutes - relationships don't change often
  });
};

export const useLoadMemberRelationships = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      depth = 2,
    }: {
      memberId: string;
      depth?: number;
    }) => {
      const response = await apiClient.get<{
        member: any;
        parents: any[];
        spouses: any[];
        children: any[];
        metadata: {
          hasMoreParents: boolean;
          hasMoreChildren: boolean;
          totalRelationships: number;
        };
      }>(`/members/${memberId}/relationships?depth=${depth}`);
      return response;
    },
    onSuccess: (data, variables) => {
      // Update the cache with the new relationship data
      queryClient.setQueryData(
        ["member-relationships", variables.memberId, variables.depth],
        data
      );

      // Also update the family tree cache if it exists
      queryClient.invalidateQueries({ queryKey: ["family-tree"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to load member relationships");
    },
  });
};
