// API Configuration
// Update this file with your backend API URL

// Find your local IP address:
// Windows: Open CMD and run "ipconfig" (look for IPv4 Address)
// Mac/Linux: Open Terminal and run "ifconfig" or "ip addr"

// Replace with your computer's local IP address
export const API_BASE_URL = "http://192.168.100.52/Caps";

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  REGISTER: `${API_BASE_URL}/register.php`,
  LOGIN: `${API_BASE_URL}/login.php`,
  
  // Properties
  ADD_PROPERTY: `${API_BASE_URL}/add_property.php`,
  GET_PROPERTIES: `${API_BASE_URL}/get_properties.php`,
  UPDATE_PROPERTY: `${API_BASE_URL}/update_property.php`,
  DELETE_PROPERTY: `${API_BASE_URL}/delete_property.php`,
  UPLOAD_IMAGES: `${API_BASE_URL}/upload_images.php`,
  
  // Bookings
  BOOK_ROOM: `${API_BASE_URL}/book_room.php`,
  GET_BOOKINGS: `${API_BASE_URL}/get_bookings.php`,
  APPROVE_BOOKING: `${API_BASE_URL}/approve_booking.php`,
  DELETE_BOOKING: `${API_BASE_URL}/delete_booking.php`,
  VERIFY_QR: `${API_BASE_URL}/verify_qr.php`,
  
  // Payments
  PAYMENT: `${API_BASE_URL}/payment.php`,
  GET_PAYMENTS: `${API_BASE_URL}/get_payments.php`,
  ESCROW_DECISION: `${API_BASE_URL}/escrow_decision.php`,
  
  // Test
  TEST: `${API_BASE_URL}/test.php`,
};

// Helper function to check if backend is accessible
export async function testBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch(API_ENDPOINTS.TEST);
    const data = await response.json();
    return data.status === "success";
  } catch (error) {
    console.error("Backend connection test failed:", error);
    return false;
  }
}

export default API_ENDPOINTS;
