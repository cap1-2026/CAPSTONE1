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

if (!$data || !isset($data->booking_id) || !isset($data->damage)) {
    echo json_encode(["status"=>"error", "message"=>"Missing required fields"]);
    exit();
}

$booking_id = $data->booking_id;
$damage = $data->damage;

if($damage == "no"){
    $status = "refund_tenant";
}else{
    $status = "transfer_owner";
}

// Use prepared statement
$stmt = $conn->prepare("UPDATE bookings SET escrow_status = ? WHERE id = ?");
$stmt->bind_param("si", $status, $booking_id);

if($stmt->execute()){
    if($stmt->affected_rows > 0) {
        echo json_encode([
            "status"=>"success",
            "escrow_status"=>$status,
            "message"=>"Escrow decision recorded"
        ]);
    } else {
        echo json_encode(["status"=>"error", "message"=>"Booking not found"]);
    }
}else{
    echo json_encode([
        "status"=>"error",
        "message"=>"Failed to update escrow: " . $conn->error
    ]);
}

$stmt->close();
$conn->close();
?>