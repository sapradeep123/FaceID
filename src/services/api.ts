import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
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

// Auth API
export const authAPI = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  signup: (data: SignupRequest) => api.post<AuthResponse>('/auth/signup', data),
};

// Face API
export const faceAPI = {
  enrollPassport: (file: File, headers: Record<string, string>) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<FaceEnrollmentResponse>('/face/enroll_passport', formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  enrollLive: (files: File[], headers: Record<string, string>) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post<FaceEnrollmentResponse>('/face/enroll_live', formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  verify: (file: File, headers: Record<string, string>) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<FaceVerificationResponse>('/face/verify_arc', formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Liveness API
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
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
