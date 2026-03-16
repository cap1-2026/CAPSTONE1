<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

include "db.php";

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->booking_id) || !isset($data->action)) {
    echo json_encode(["status" => "error", "message" => "Missing booking_id or action."]);
    exit();
}

$booking_id = intval($data->booking_id);
$action     = $data->action;

if (!in_array($action, ['approved', 'rejected'])) {
    echo json_encode(["status" => "error", "message" => "Invalid action. Must be approved or rejected."]);
    exit();
}

try {
    $stmt = $conn->prepare("UPDATE bookings SET contract_status = ? WHERE id = ?");
    $stmt->bind_param("si", $action, $booking_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode([
            "status"  => "success",
            "message" => "Contract $action successfully.",
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Booking not found."]);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
