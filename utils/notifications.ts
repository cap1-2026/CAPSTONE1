import API_ENDPOINTS from "../config/api";

/**
 * Send a notification to a user
 * @param userId Target user ID
 * @param role User role (tenant or owner)
 * @param type Notification type
 * @param title Notification title
 * @param message Notification message
 * @param relatedId Related entity ID (booking, property, etc.)
 * @param actionType Optional action type
 */
export async function sendNotification(
  userId: number,
  role: "tenant" | "owner",
  type: string,
  title: string,
  message: string,
  relatedId: number,
  actionType?: string
) {
  try {
    await fetch(API_ENDPOINTS.NOTIFICATIONS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        user_id: userId,
        user_role: role,
        type,
        title,
        message,
        related_id: relatedId,
        action_type: actionType,
      }),
    });
  } catch (error) {
    // Notifications are non-critical, fail silently
    console.warn("Failed to send notification:", error);
  }
}