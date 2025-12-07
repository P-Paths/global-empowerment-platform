// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// Listing Types
export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  mileage: number;
  make: string;
  model: string;
  year: number;
  images: string[];
  platform: string;
  status: 'draft' | 'active' | 'sold' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  mileage: number;
  make: string;
  model: string;
  year: number;
  images?: string[];
}

// Message Types
export interface Message {
  id: string;
  listing_id: string;
  buyer_name: string;
  content: string;
  message_type: string;
  platform: string;
  is_read: boolean;
  created_at: string;
}

// AI Reply Types
export interface AIReplyRequest {
  message: string;
  listing_context?: Record<string, any>;
  task_type?: string;
}

export interface AIReplyResponse {
  reply: string;
  brain_used: string;
  confidence?: number;
  suggested_delay_minutes: number;
}

// Appointment Types
export interface Appointment {
  id: string;
  listing_id: string;
  buyer_name: string;
  buyer_phone?: string;
  buyer_email?: string;
  appointment_date: string;
  location: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface CreateAppointmentRequest {
  listing_id: string;
  buyer_name: string;
  buyer_phone?: string;
  buyer_email?: string;
  appointment_date: string;
  location: string;
  notes?: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Component Props Types
export interface ListingCardProps {
  listing: Listing;
  onEdit?: (listing: Listing) => void;
  onDelete?: (id: string) => void;
}

export interface MessageCardProps {
  message: Message;
  onReply?: (message: Message) => void;
  onMarkRead?: (id: string) => void;
}

export interface AppointmentCardProps {
  appointment: Appointment;
  onUpdateStatus?: (id: string, status: string) => void;
} 