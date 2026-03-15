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

  // ── Payments ──────────────────────────────────────────
  PAYMENT:         `${API_BASE_URL}/payment.php`,
  GET_PAYMENTS:    `${API_BASE_URL}/get_payments.php`,
  ESCROW_DECISION: `${API_BASE_URL}/escrow_decision.php`,

  // ── Admin ─────────────────────────────────────────────
  GET_ADMIN_STATS: `${API_BASE_URL}/get_admin_stats.php`,
  GET_USERS:       `${API_BASE_URL}/get_users.php`,

  // ── Misc ──────────────────────────────────────────────
  VERIFY_QR:       `${API_BASE_URL}/verify_qr.php`,
};

export default API_ENDPOINTS;