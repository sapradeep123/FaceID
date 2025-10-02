import axios from 'axios';

// Get API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status;
    const url: string = error.config?.url || '';
    const headers = (error.config?.headers || {}) as Record<string, unknown>;
    const detail = error.response?.data?.detail;

    // Do NOT force logout for internal service endpoints using API key.
    // Note: face enrollment/verification require user auth; treat them as user endpoints.
    const isInternalService = url.startsWith('/live/') || 'X-API-Key' in headers;

    if (status === 401 && !isInternalService) {
      const detailText = typeof detail === 'string' ? detail : '';
      const isAuthFailure = /not authenticated|could not validate credentials|invalid token/i.test(detailText);
      if (isAuthFailure) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return; // stop further handling
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  full_name?: string;
  org_id: string;
  branch_id?: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name?: string;
  org_id?: string;
  branch_code?: string;
}

export interface FaceEnrollmentResponse {
  status: string;
  embeddings_added: number;
  image_id?: number;
  image_ids?: number[];
  user_id?: number;
}

export interface FaceImage {
  id: number;
  filename: string;
  created_at: string;
  size: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
}

export interface UserImagesResponse {
  user_id: number;
  user_name: string;
  user_email: string;
  images: FaceImage[];
  total_images: number;
}

export interface AllImagesResponse {
  images: FaceImage[];
  total_images: number;
}

export interface FaceVerificationResponse {
  matched_user_id: number;
  confidence: number;
  branch_id: number;
}

export interface LivenessChallenge {
  challenge: string;
  expires_in: number;
}

export interface LivenessVerificationResponse {
  ok: boolean;
  user_id: number;
  confidence: number;
  branch_id: number;
}

export const authAPI = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  signup: (data: SignupRequest) => api.post<AuthResponse>('/auth/signup', data),
};

export const faceAPI = {
  enrollPassport: (file: File, headers: Record<string, string>, targetUserId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (typeof targetUserId === 'number') {
      formData.append('target_user_id', String(targetUserId));
    }
    return api.post<FaceEnrollmentResponse>('/face/enroll_passport', formData, {
      headers: {
        ...headers,
      },
    });
  },
  enrollLive: (files: File[], headers: Record<string, string>, targetUserId?: number) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (typeof targetUserId === 'number') {
      formData.append('target_user_id', String(targetUserId));
    }
    return api.post<FaceEnrollmentResponse>('/face/enroll_live', formData, {
      headers: {
        ...headers,
      },
    });
  },
  verify: (file: File, headers: Record<string, string>) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<FaceVerificationResponse>('/face/verify_arc', formData, {
      headers: {
        ...headers,
      },
    });
  },
  getUserImages: (userId: number) => api.get<UserImagesResponse>(`/face/images/${userId}`),
  getImage: (imageId: number) => api.get(`/face/image/${imageId}`, { responseType: 'blob' }),
  deleteImage: (imageId: number) => api.delete(`/face/image/${imageId}`),
  listAllImages: () => api.get<AllImagesResponse>('/face/images'),
};

export const livenessAPI = {
  getChallenge: (headers: Record<string, string>) => 
    api.get<LivenessChallenge>('/live/challenge', { headers }),
  verify: (
    challenge: string,
    frameA: File,
    frameB: File,
    uidHint: number | null,
    headers: Record<string, string>
  ) => {
    const formData = new FormData();
    formData.append('challenge', challenge);
    formData.append('frame_a', frameA);
    formData.append('frame_b', frameB);
    if (uidHint) formData.append('uid_hint', uidHint.toString());
    
    return api.post<LivenessVerificationResponse>('/live/verify', formData, {
      headers: {
        ...headers,
      },
    });
  },
};

export interface UserUpdate {
  email?: string;
  full_name?: string;
  org_id?: string;
  password?: string;
  branch_code?: string;
}

export interface UserWithFaceCount extends User {
  face_count?: number;
  last_login?: string;
}

export const userAPI = {
  getUsers: (org_id?: string) => 
    api.get<UserWithFaceCount[]>('/auth/users', { params: { org_id } }),
  getUser: (userId: number) => 
    api.get<UserWithFaceCount>(`/auth/users/${userId}`),
  createUser: (data: SignupRequest) => 
    api.post<UserWithFaceCount>('/auth/users', data),
  updateUser: (userId: number, data: UserUpdate) => 
    api.put<UserWithFaceCount>(`/auth/users/${userId}`, data),
  deleteUser: (userId: number) => 
    api.delete(`/auth/users/${userId}`),
  getUserFaceCount: (userId: number) => 
    api.get<{ user_id: number; face_count: number }>(`/auth/users/${userId}/face-count`),
};