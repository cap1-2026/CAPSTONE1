<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
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

try {
    // First check if booking exists and get its status
    $stmt = $conn->prepare("SELECT status FROM bookings WHERE id = ?");
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(["status"=>"error", "message"=>"Booking not found"]);
        exit();
    }
    
    $booking = $result->fetch_assoc();
    $stmt->close();
    
    // Delete the booking
    $stmt = $conn->prepare("DELETE FROM bookings WHERE id = ?");
    $stmt->bind_param("i", $booking_id);
    
    if($stmt->execute()){
        if($stmt->affected_rows > 0) {
            echo json_encode([
                "status"=>"success",
                "message"=>"Booking cancelled successfully"
            ]);
        } else {
            echo json_encode(["status"=>"error", "message"=>"Failed to cancel booking"]);
        }
    } else {
        echo json_encode([
            "status"=>"error",
            "message"=>"Database error: " . $conn->error
        ]);
    }
    
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["status"=>"error", "message"=>"Error: " . $e->getMessage()]);
}

$conn->close();
?>
