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
import { loginSuccess, logout } from "@/store/slices/authSlice";
import toast from "react-hot-toast";

// Auth hooks
export const useLogin = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiClient.post<{ data: AuthResponse }>(
        "/auth/login",
        credentials
      );
      return response;
    },
    onSuccess: (data: any) => {
      dispatch(
        loginSuccess({
          user: data.data.user,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        })
      );
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Login successful!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Login failed");
    },
  });
};

export const useRegister = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await apiClient.post<{ data: AuthResponse }>(
        "/auth/register",
        data
      );
      return response;
    },
    onSuccess: (data) => {
      dispatch(
        loginSuccess({
          user: data.data.user,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        })
      );
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Registration successful!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Registration failed");
    },
  });
};

export const useLogout = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return () => {
    dispatch(logout());
    queryClient.clear();
    toast.success("Logged out successfully");
  };
};

// File Upload hooks
export const useUploadFile = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post<FileUploadResponse>(
        "/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
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

      const response = await apiClient.post<FileUploadResponse>(
        "/upload/profile-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
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

// Member hooks
export const useProfile = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await apiClient.get<MemberWithRelationships>(
        "/members/profile"
      );
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMemberRequest) => {
      const response = await apiClient.put<Member>("/members/profile", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
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

export const useFamilyMembers = (familyId: string) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["family-members", familyId],
    queryFn: async () => {
      const response = await apiClient.get<Member[]>(
        `/members/family/${familyId}`
      );
      return response;
    },
    enabled: isAuthenticated && !!familyId,
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

export const useCreateFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiClient.post<Family>("/families", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      toast.success("Family created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create family");
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
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
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
    refetchInterval: 30000, // Refetch every 30 seconds
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
      // For blob responses, we need to handle the fetch manually
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"
        }/export/family-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(exportRequest),
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return response.blob();
    },
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `family-tree-${variables.format}-${
        new Date().toISOString().split("T")[0]
      }.${variables.format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(
        `Family data exported successfully as ${variables.format.toUpperCase()}!`
      );
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
        links: any[];
        metadata: {
          totalMembers: number;
          generations: number;
          depth: number;
        };
      }>(`/tree/${familyId}?${searchParams.toString()}`);
      return response;
    },
    enabled: isAuthenticated && !!familyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useMemberRelationships = (memberId: string, depth: number = 2) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ["member-relationships", memberId, depth],
    queryFn: async () => {
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
