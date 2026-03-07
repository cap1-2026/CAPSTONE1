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

if (!$data || !isset($data->booking_id) || !isset($data->amount)) {
    echo json_encode(["status"=>"error", "message"=>"Missing required fields"]);
    exit();
}

$booking_id = $data->booking_id;
$amount = $data->amount;
$method = $data->method ?? 'cash';

// Generate unique transaction ID
$transaction = "TXN" . time() . rand(1000, 9999);

// Use prepared statement
$stmt = $conn->prepare("INSERT INTO payments (booking_id, amount, method, transaction_id, status, created_at) VALUES (?, ?, ?, ?, 'paid', NOW())");
$stmt->bind_param("idss", $booking_id, $amount, $method, $transaction);

if($stmt->execute()){
    echo json_encode([
        "status"=>"success",
        "message"=>"Payment processed successfully",
        "transaction_id"=>$transaction,
        "amount"=>$amount
    ]);
}else{
    echo json_encode([
        "status"=>"error",
        "message"=>"Payment failed: " . $conn->error
    ]);
}

$stmt->close();
$conn->close();
?>