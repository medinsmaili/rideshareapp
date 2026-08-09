import type { User, Ride, Booking, Vehicle, City, Report, Language, Message } from './types';

export const users: User[] = [
  { id: '3d2f982e-5544-464e-a77d-89319d3dcbd3', email: 'bajramiallahida@gmail.com', first_name: 'Ahida', last_name: 'Smaili', phone_number: '044752176', bio: null, profile_picture: null, gender: null, average_rating: null, rating_count: 0, blocked_users: [], verification_docs_url: 'license-1771465045514.jpg', student_id_url: null, driver_verification_status: 'pending', student_verification_status: null, is_verified_driver: false, is_student_verified: false, is_email_verified: true, is_banned: false, ban_reason: 'test', ban_expires_at: '2026-02-01T13:00:00', onesignal_id: null, role: 'user', created_at: '2026-02-01T05:51:16', updated_at: '2026-02-19T01:37:25' },
  { id: 'b3029544-0ecf-4e2d-9706-1a793db7fcd8', email: 'medin.smaili@gmail.com', first_name: 'Medin', last_name: 'Smaili', phone_number: '045256091', bio: null, profile_picture: null, gender: 'M', average_rating: '5.00', rating_count: 3, blocked_users: [], verification_docs_url: 'license-1769923445013.jpg', student_id_url: null, driver_verification_status: 'approved', student_verification_status: 'approved', is_verified_driver: true, is_student_verified: true, is_email_verified: true, is_banned: false, ban_reason: null, ban_expires_at: null, onesignal_id: null, role: 'admin', created_at: '2026-02-01T04:04:47', updated_at: '2026-02-19T01:31:52' },
  { id: 'd4db59cf-eeff-4fd7-bcac-6c7b0fa3eefc', email: 'smailirasim@gmail.com', first_name: 'Rasim', last_name: 'Smaili', phone_number: '041328454', bio: null, profile_picture: null, gender: null, average_rating: null, rating_count: 0, blocked_users: [], verification_docs_url: null, student_id_url: null, driver_verification_status: null, student_verification_status: null, is_verified_driver: false, is_student_verified: false, is_email_verified: true, is_banned: false, ban_reason: null, ban_expires_at: null, onesignal_id: null, role: 'user', created_at: '2026-02-01T16:37:42', updated_at: '2026-02-01T16:38:10' },
  { id: '98f6f778-b841-4118-8563-1af3b866b0f9', email: 'rackw734@gmail.com', first_name: 'Urim', last_name: 'Shala', phone_number: '045905921', bio: null, profile_picture: null, gender: null, average_rating: null, rating_count: 0, blocked_users: [], verification_docs_url: null, student_id_url: 'student-id-4829104.jpg', driver_verification_status: null, student_verification_status: 'pending', is_verified_driver: false, is_student_verified: false, is_email_verified: true, is_banned: false, ban_reason: null, ban_expires_at: null, onesignal_id: null, role: 'user', created_at: '2026-02-03T13:52:14', updated_at: '2026-02-03T13:53:06' },
  { id: 'cefd6bb2-ffcb-4a75-bec1-3100e3c6fa1e', email: 'jon.haxhiu98@gmail.com', first_name: 'Jon', last_name: 'Haxhiu', phone_number: '049717895', bio: null, profile_picture: null, gender: null, average_rating: null, rating_count: 0, blocked_users: [], verification_docs_url: null, student_id_url: null, driver_verification_status: null, student_verification_status: null, is_verified_driver: false, is_student_verified: false, is_email_verified: true, is_banned: false, ban_reason: null, ban_expires_at: null, onesignal_id: null, role: 'user', created_at: '2026-02-06T00:51:36', updated_at: '2026-02-06T00:52:20' },
];

export const cities: City[] = [
  { id: 'ea4319b9-9443-4cee-9d77-863aac7cc55e', name: 'Prishtina', country: 'Kosovo' },
  { id: '24e64ace-d6f7-4574-8d9a-12a151059c51', name: 'Prizren', country: 'Kosovo' },
  { id: '6321670f-042b-44fa-a10b-890f2ceeb831', name: 'Gjilan', country: 'Kosovo' },
  { id: '5989594b-e371-49fb-802f-edcfa447b2d3', name: 'Peja', country: 'Kosovo' },
  { id: '3e54f3c2-e9cf-4589-858d-5a33fbc79d86', name: 'Mitrovica', country: 'Kosovo' },
];

const getCityName = (id: string) => cities.find(c => c.id === id)?.name ?? 'Unknown';
const getUserName = (id: string) => { const u = users.find(u => u.id === id); return u ? `${u.first_name} ${u.last_name}` : 'Unknown'; };

export const vehicles: Vehicle[] = [
  { id: '8acca45f-0b33-4d2f-98c1-2b20703f3da5', brand: 'Test', color: 'Shshs', license_plate: '041020w', owner_id: '3d2f982e-5544-464e-a77d-89319d3dcbd3', is_default: false, owner_name: 'Ahida Smaili' },
  { id: '1a565217-0dcf-42fd-b76d-b1a53dc78a47', brand: 'sdsds', color: 'sdsd', license_plate: 'dsds', owner_id: 'b3029544-0ecf-4e2d-9706-1a793db7fcd8', is_default: false, owner_name: 'Medin Smaili' },
];

export const rides: Ride[] = [
  { id: '95a1ec0a-8ddc-4304-9d35-ec3c5ceabf18', driver_id: '3d2f982e-5544-464e-a77d-89319d3dcbd3', vehicle_id: '8acca45f-0b33-4d2f-98c1-2b20703f3da5', origin_city_id: 'ea4319b9-9443-4cee-9d77-863aac7cc55e', destination_city_id: '70b0a28e-4b7f-41a2-8cab-279812b8cd51', origin_meeting_point_id: null, destination_meeting_point_id: null, departure_time: '2026-02-01T05:58:43', price_per_seat: 5, total_seats: 3, seats_available: 3, seats_taken: 0, status: 'cancelled', is_female_only: false, description: null, cancellation_reason: 'Hrhr', created_at: '2026-02-01T05:58:55', driver_name: 'Ahida Smaili', origin_city: 'Prishtina', destination_city: 'Suharekë', vehicle_name: 'Test' },
  { id: '939baee9-9bd9-4b9c-8d04-3eb53669a09e', driver_id: 'b3029544-0ecf-4e2d-9706-1a793db7fcd8', vehicle_id: '1a565217-0dcf-42fd-b76d-b1a53dc78a47', origin_city_id: '51ca8812-43ae-49cc-b2bc-1a87b3dcdd97', destination_city_id: '70b0a28e-4b7f-41a2-8cab-279812b8cd51', origin_meeting_point_id: null, destination_meeting_point_id: null, departure_time: '2026-02-19T01:31:58', price_per_seat: 5, total_seats: 3, seats_available: 3, seats_taken: 0, status: 'active', is_female_only: false, description: null, cancellation_reason: null, created_at: '2026-02-19T01:32:27', driver_name: 'Medin Smaili', origin_city: 'Rahovec', destination_city: 'Suharekë', vehicle_name: 'sdsds' },
];

export const bookings: Booking[] = [
  { id: 'b001', ride_id: '4e7786c1-1580-4df7-b5ba-f58a2fca112d', passenger_id: 'b3029544-0ecf-4e2d-9706-1a793db7fcd8', seats_booked: 1, status: 'confirmed', created_at: '2026-02-01T06:00:30', passenger_name: 'Medin Smaili', ride_route: 'Prizren → Prishtina' },
];

export const reports: Report[] = [
  { id: '1f33b2b0-d4ca-40e5-9d79-c131cfff79a1', reason: 'Fake user', status: 'pending', created_at: '2026-02-01T16:38:24', reporter_id: 'd4db59cf-eeff-4fd7-bcac-6c7b0fa3eefc', reported_user_id: 'b3029544-0ecf-4e2d-9706-1a793db7fcd8', ride_id: '4c2e0617-4d2b-4d8a-b579-9e65f5cbba97', reporter_name: 'Rasim Smaili', reported_user_name: 'Medin Smaili' },
];

export const languages: Language[] = [
  { id: 1, name: 'English', code: 'en', is_active: true, created_at: '2026-02-01T04:46:40' },
  { id: 2, name: 'Albanian', code: 'sq', is_active: true, created_at: '2026-02-01T04:48:07' },
];

export const messages: Message[] = [
  { id: '8b3cbb53', content: 'Twst', created_at: '2026-02-01T06:00:49', sender_id: '3d2f982e-5544-464e-a77d-89319d3dcbd3', ride_id: '4e7786c1-1580-4df7-b5ba-f58a2fca112d', sender_name: 'Ahida Smaili' },
];

export const dashboardStats = {
  totalUsers: users.length,
  totalRides: rides.length,
  activeRides: rides.filter(r => r.status === 'active').length,
  totalBookings: bookings.length,
  totalReports: reports.filter(r => r.status === 'pending').length,
  totalCities: cities.length,
  verifiedDrivers: users.filter(u => u.is_verified_driver).length,
  totalVehicles: vehicles.length,
};
