// ============================================================
//  PadFinder – Central API Configuration
//  Update API_BASE_URL to match your XAMPP server IP/port.
//  All endpoints in the app import from this file.
// ============================================================

// ⚠️  Change this to your machine's local IP (run `ipconfig` on Windows)
//     Keep the trailing slash off – it is added per-endpoint below.
export const API_BASE_URL = "http://192.168.0.131/Caps";

// Shorthand helper so screens can import both default + named
const API_ENDPOINTS = {
  // ── Auth ───────────────────────────────────────────────
  LOGIN:           `${API_BASE_URL}/login.php`,
  REGISTER:        `${API_BASE_URL}/register.php`,

  // ── Properties ────────────────────────────────────────
  GET_PROPERTIES:  `${API_BASE_URL}/get_properties.php`,
  ADD_PROPERTY:    `${API_BASE_URL}/add_property.php`,
  UPDATE_PROPERTY: `${API_BASE_URL}/update_property.php`,
  DELETE_PROPERTY: `${API_BASE_URL}/delete_property.php`,
  APPROVE_PROPERTY:`${API_BASE_URL}/approve_property.php`,
  UPLOAD_IMAGES:   `${API_BASE_URL}/upload_images.php`,

  // ── Bookings ──────────────────────────────────────────
  GET_BOOKINGS:    `${API_BASE_URL}/get_bookings.php`,
  BOOK_ROOM:       `${API_BASE_URL}/book_room.php`,
  APPROVE_BOOKING: `${API_BASE_URL}/approve_booking.php`,
  DELETE_BOOKING:  `${API_BASE_URL}/delete_booking.php`,
  SUBMIT_CONTRACT:        `${API_BASE_URL}/submit_contract.php`,
  APPROVE_CONTRACT:       `${API_BASE_URL}/approve_contract.php`,
  UPLOAD_LEASE_CONTRACT:  `${API_BASE_URL}/upload_lease_contract.php`,

  // ── Payments ──────────────────────────────────────────
  PAYMENT:         `${API_BASE_URL}/payment.php`,
  GET_PAYMENTS:    `${API_BASE_URL}/get_payments.php`,
  ESCROW_DECISION: `${API_BASE_URL}/escrow_decision.php`,

  // ── User Profile ──────────────────────────────────────
  GET_USER_PROFILE:`${API_BASE_URL}/get_user_profile.php`,

  // ── Admin ─────────────────────────────────────────────
  GET_ADMIN_STATS: `${API_BASE_URL}/get_admin_stats.php`,
  GET_USERS:       `${API_BASE_URL}/get_users.php`,

  // ── Notifications ─────────────────────────────────────
  NOTIFICATIONS:   `${API_BASE_URL}/notifications.php`,

  // ── PayMongo ──────────────────────────────────────────
  PAYMONGO_PAYMENT:`${API_BASE_URL}/paymongo_payment.php`,

  // ── Misc ──────────────────────────────────────────────
  VERIFY_QR:       `${API_BASE_URL}/verify_qr.php`,
  APPROVE_PAYMENT: `${API_BASE_URL}/approve_payment.php`,

  // ── Lease Renewal ─────────────────────────────────────
  RENEW_LEASE:     `${API_BASE_URL}/renew_lease.php`,

  // ── Messaging ─────────────────────────────────────────
  GET_MESSAGES:    `${API_BASE_URL}/get_messages.php`,
  SEND_MESSAGE:    `${API_BASE_URL}/send_message.php`,
  MARK_READ:       `${API_BASE_URL}/mark_read.php`,
};

export default API_ENDPOINTS;