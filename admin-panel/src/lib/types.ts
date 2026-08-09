export const API_BASE = "https://api.nisu.app";

/** Build full URL for uploaded files */
export function getUploadUrl(path: string | null | undefined, folder?: string): string | null {
  if (!path) return null;
  
  // If already a full URL, return as-is
  if (path.startsWith("http")) return path;
  
  // Remove leading slash if it exists to normalize the string
  let cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // ✅ FIX: If the backend already includes 'uploads/' in the path (e.g. 'uploads/driver_licenses/doc.jpg')
  // We just append it directly to the API base so we don't double up the folder names.
  if (cleanPath.startsWith('uploads/')) {
    return `${API_BASE}/${cleanPath}`;
  }

  // Fallback: If the database ONLY contains the filename, we append the folder
  if (folder) return `${API_BASE}/uploads/${folder}/${cleanPath}`;
  return `${API_BASE}/uploads/${cleanPath}`;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  bio: string | null;
  profile_picture: string | null;
  gender: string | null;
  average_rating: string | null;
  rating_count: number;
  blocked_users: string[];
  verification_docs_url: string | null;
  student_id_url: string | null;
  driver_verification_status: "pending" | "approved" | "rejected" | null;
  student_verification_status: "pending" | "approved" | "rejected" | null;
  is_verified_driver: boolean;
  is_student_verified: boolean;
  is_email_verified: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  ban_expires_at: string | null;
  onesignal_id: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  origin_city_id: string | number;
  destination_city_id: string | number;
  origin_meeting_point_id: string | null;
  destination_meeting_point_id: string | null;
  departure_time: string;
  price_per_seat: number;
  total_seats: number;
  seats_available: number;
  seats_taken: number;
  status: string;
  is_female_only: boolean;
  description: string | null;
  cancellation_reason: string | null;
  created_at: string;
  // Joined fields
  driver_name?: string;
  driver?: Partial<User>;
  origin_city?: string;
  destination_city?: string;
  originCity?: { id: number; name: string; country: string };
  destinationCity?: { id: number; name: string; country: string };
  vehicle_name?: string;
  vehicle?: { id: string; brand: string; model?: string; color: string };
}

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: string;
  created_at: string;
  // Joined
  passenger_name?: string;
  passenger?: Partial<User>;
  ride_route?: string;
  ride?: Partial<Ride>;
}

export interface Vehicle {
  id: string;
  brand: string;
  model?: string;
  color: string;
  license_plate: string;
  owner_id: string;
  is_default: boolean;
  owner_name?: string;
}

export interface City {
  id: string | number;
  name: string;
  country: string;
}

export interface Report {
  id: string;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
  reporter_id: string;
  reported_user_id: string;
  ride_id: string | null;
  reporter_name?: string;
  reported_user_name?: string;
  reporter?: Partial<User>;
  reportedUser?: Partial<User>;
}

export interface Language {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface AppTranslation {
  id: number;
  language_id: number;
  key: string;
  value: string;
  created_at: string;
  language_name?: string;
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  ride_id: string;
  sender_name?: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string | null;
}