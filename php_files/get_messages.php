<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

include "db.php";

$booking_id = isset($_GET['booking_id']) ? intval($_GET['booking_id']) : null;

if (!$booking_id) {
    echo json_encode(["status" => "error", "message" => "booking_id is required"]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT m.*, u.fullname as sender_name
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.booking_id = ?
        ORDER BY m.created_at ASC
    ");
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    $stmt->close();

    echo json_encode(["status" => "success", "data" => $rows]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
