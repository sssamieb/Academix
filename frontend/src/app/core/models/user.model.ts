export interface User {
  id:                   number;
  name:                 string;
  email:                string;
  role:                 'admin' | 'instructor' | 'student';
  is_active:            boolean;
  must_change_password: boolean;
  plan_id:              number | null;
  plan?: {
    id:                 number;
    name:               string;
    slug:               string;
    type:               string;
    monthly_tokens:     number;
    unlimited_tokens:   boolean;
    unlimited_attempts: boolean;
    quiz_attempts:      number;
    exam_attempts:      number;
    early_access:       boolean;
    state_certificate:  boolean;
  };
}

export interface AuthResponse {
  message:              string;
  user:                 User;
  token:                string;
  token_type:           string;
  must_change_password: boolean;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  name:                  string;
  email:                 string;
  password:              string;
  password_confirmation: string;
}