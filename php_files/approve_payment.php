<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

include "db.php";

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->booking_id) || !isset($data->action)) {
    echo json_encode(["status"=>"error", "message"=>"Missing required fields"]);
    exit();
}

$booking_id = (int)$data->booking_id;
$action = $data->action; // "approved" or "rejected"

if (!in_array($action, ['approved', 'rejected'])) {
    echo json_encode(["status"=>"error", "message"=>"Invalid action"]);
    exit();
}

$stmt = $conn->prepare("UPDATE bookings SET payment_status = ? WHERE id = ?");
$stmt->bind_param("si", $action, $booking_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode([
            "status"  => "success",
            "message" => "Payment " . $action,
            "payment_status" => $action,
        ]);
    } else {
        echo json_encode(["status"=>"error", "message"=>"Booking not found"]);
    }
} else {
    echo json_encode(["status"=>"error", "message"=>"Failed: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>
