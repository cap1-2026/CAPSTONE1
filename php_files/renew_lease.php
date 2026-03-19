<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

include "db.php";

$input            = json_decode(file_get_contents("php://input"), true);
$booking_id       = isset($input['booking_id'])       ? intval($input['booking_id'])       : null;
$extension_months = isset($input['extension_months']) ? intval($input['extension_months']) : 0;

if (!$booking_id || $extension_months <= 0) {
    echo json_encode(["status" => "error", "message" => "booking_id and extension_months > 0 are required"]);
    exit;
}

try {
    // Fetch current lease_duration
    $stmt = $conn->prepare("SELECT lease_duration FROM bookings WHERE id = ?");
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $booking = $result->fetch_assoc();
    $stmt->close();

    if (!$booking) {
        echo json_encode(["status" => "error", "message" => "Booking not found"]);
        exit;
    }

    // Parse existing duration to months
    $duration = strtolower(trim($booking['lease_duration']));
    $current_months = 12; // default fallback
    if (preg_match('/(\d+)\s*month/', $duration, $m)) {
        $current_months = intval($m[1]);
    } elseif (preg_match('/(\d+)\s*year/', $duration, $m)) {
        $current_months = intval($m[1]) * 12;
    }

    $new_months   = $current_months + $extension_months;
    $new_duration = $new_months . " months";

    // Update booking
    $stmt = $conn->prepare("UPDATE bookings SET lease_duration = ? WHERE id = ?");
    $stmt->bind_param("si", $new_duration, $booking_id);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["status" => "success", "new_duration" => $new_duration]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
