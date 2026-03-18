import { API_BASE_URL } from "../config/api";

/**
 * Construct a full image URL from a relative path
 * @param imagePath Relative image path (with or without leading slash)
 * @returns Full image URL
 */
export function getImageUrl(imagePath: string): string {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath; // Already full URL

  // Handle both with and without leading slash
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  return `${API_BASE_URL}/${cleanPath}`;
}

/**
 * Get signature image URL with fallback logic
 * @param signaturePath Signature file path from database
 * @param baseUrl Base API URL
 * @param bookingId Booking ID for fallback filename
 * @returns Signature image URL
 */
export function getSignatureUrl(
  signaturePath: string,
  baseUrl: string,
  bookingId: number
): string {
  if (!signaturePath) {
    // Fallback to standard naming convention
    return `${baseUrl}/uploads/signatures/sig_only_${bookingId}.jpg`;
  }

  if (signaturePath.startsWith("http")) {
    return signaturePath; // Already a full URL
  }

  // Construct full URL from relative path
  const cleanPath = signaturePath.startsWith("/") ? signaturePath.slice(1) : signaturePath;
  return `${baseUrl}/${cleanPath}`;
}