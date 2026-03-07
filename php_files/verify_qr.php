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

if (!$data || !isset($data->qr_code)) {
    echo json_encode(["status"=>"error", "message"=>"Missing QR code"]);
    exit();
}

$qr = $data->qr_code;

// Use prepared statement
$stmt = $conn->prepare("SELECT * FROM bookings WHERE qr_code = ?");
$stmt->bind_param("s", $qr);
$stmt->execute();
$result = $stmt->get_result();

if($result->num_rows > 0){
    $booking = $result->fetch_assoc();
    echo json_encode([
        "status"=>"valid",
        "booking_id"=>$booking['id'],
        "property_id"=>$booking['property_id'],
        "message"=>"QR code is valid"
    ]);
}else{
    echo json_encode([
        "status"=>"invalid",
        "message"=>"QR code not found"
    ]);
}

$stmt->close();
$conn->close();
?>