<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "db.php";

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->booking_id)) {
    echo json_encode(["status"=>"error", "message"=>"Missing booking ID"]);
    exit();
}

$booking_id = $data->booking_id;
$action = $data->action ?? 'approved'; // Can be 'approved' or 'rejected'

// Validate action
if (!in_array($action, ['approved', 'rejected'])) {
    echo json_encode(["status"=>"error", "message"=>"Invalid action"]);
    exit();
}

// Use prepared statement
$stmt = $conn->prepare("UPDATE bookings SET status = ? WHERE id = ?");
$stmt->bind_param("si", $action, $booking_id);

if($stmt->execute()){
    if($stmt->affected_rows > 0) {
        echo json_encode([
            "status"=>"success",
            "message"=>"Booking {$action} successfully",
            "booking_status"=>$action
        ]);
    } else {
        echo json_encode(["status"=>"error", "message"=>"Booking not found"]);
    }
}else{
    echo json_encode([
        "status"=>"error",
        "message"=>"Failed to update booking: " . $conn->error
    ]);
}

$stmt->close();
$conn->close();
?>