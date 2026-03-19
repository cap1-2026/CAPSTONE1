<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

include "db.php";

$input = json_decode(file_get_contents("php://input"), true);
$booking_id  = isset($input['booking_id'])  ? intval($input['booking_id'])  : null;
$sender_id   = isset($input['sender_id'])   ? intval($input['sender_id'])   : null;
$receiver_id = isset($input['receiver_id']) ? intval($input['receiver_id']) : null;
$message     = isset($input['message'])     ? trim($input['message'])       : "";

if (!$booking_id || !$sender_id || !$receiver_id || $message === "") {
    echo json_encode(["status" => "error", "message" => "booking_id, sender_id, receiver_id, and message are required"]);
    exit;
}

try {
    // Ensure messages table exists
    $conn->query("
        CREATE TABLE IF NOT EXISTS messages (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            booking_id  INT NOT NULL,
            sender_id   INT NOT NULL,
            receiver_id INT NOT NULL,
            message     TEXT NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_booking_id (booking_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $stmt = $conn->prepare("INSERT INTO messages (booking_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiis", $booking_id, $sender_id, $receiver_id, $message);
    $stmt->execute();
    $new_id = $stmt->insert_id;
    $stmt->close();

    echo json_encode(["status" => "success", "id" => $new_id]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
