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

// If approving, check for date overlaps
if ($action === 'approved') {
    // Get the booking details (property_id, move_in, duration)
    $checkStmt = $conn->prepare("SELECT property_id, move_in, duration FROM bookings WHERE id = ?");
    $checkStmt->bind_param("i", $booking_id);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(["status"=>"error", "message"=>"Booking not found"]);
        $checkStmt->close();
        $conn->close();
        exit();
    }
    
    $booking = $result->fetch_assoc();
    $property_id = $booking['property_id'];
    $move_in = $booking['move_in'];
    $duration = $booking['duration'];
    $checkStmt->close();
    
    // Calculate end date (move_in + duration months)
    $move_in_date = new DateTime($move_in);
    $move_out_date = clone $move_in_date;
    $move_out_date->modify("+{$duration} months");
    
    // Check for overlapping approved bookings for the same property
    $overlapStmt = $conn->prepare("
        SELECT id, move_in, duration, full_name 
        FROM bookings 
        WHERE property_id = ? 
        AND status = 'approved' 
        AND id != ?
    ");
    $overlapStmt->bind_param("ii", $property_id, $booking_id);
    $overlapStmt->execute();
    $overlapResult = $overlapStmt->get_result();
    
    // Check each approved booking for date overlap
    while ($existingBooking = $overlapResult->fetch_assoc()) {
        $existing_move_in = new DateTime($existingBooking['move_in']);
        $existing_move_out = clone $existing_move_in;
        $existing_move_out->modify("+{$existingBooking['duration']} months");
        
        // Check if date ranges overlap
        // Overlap occurs if: start1 < end2 AND start2 < end1
        if ($move_in_date < $existing_move_out && $existing_move_in < $move_out_date) {
            echo json_encode([
                "status"=>"error", 
                "message"=>"Cannot approve: This property is already booked from " . 
                    $existing_move_in->format('Y-m-d') . " to " . 
                    $existing_move_out->format('Y-m-d') . " by " . 
                    $existingBooking['full_name'] . ". Please reject this booking or contact the tenant to reschedule."
            ]);
            $overlapStmt->close();
            $conn->close();
            exit();
        }
    }
    $overlapStmt->close();
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