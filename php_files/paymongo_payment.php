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

// Parse input data FIRST
$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->booking_id) || !isset($data->amount)) {
    echo json_encode(["status"=>"error", "message"=>"Missing required fields (booking_id, amount)"]);
    exit();
}

// FAKE PAYMENT MODE - Always enabled for testing
// Mock mode: Create a test payment record and return success
$booking_id = intval($data->booking_id);
$amount = floatval($data->amount);
$transaction_id = "FAKE_PM_" . $booking_id . "_" . time();
$checkout_url = "https://fake-checkout.paymongo.test/complete";
$session_id = "cs_fake_" . time();

try {
    // Insert fake payment record
    $stmt = $conn->prepare("
        INSERT INTO payments (booking_id, amount, method, transaction_id, status, checkout_url, session_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        checkout_url = VALUES(checkout_url),
        session_id = VALUES(session_id),
        status = VALUES(status),
        updated_at = NOW()
    ");

    $method = "fake_paymongo";
    $status = "paid"; // Mark as paid for testing

    $stmt->bind_param("idsssss", $booking_id, $amount, $method, $transaction_id, $status, $checkout_url, $session_id);

    if ($stmt->execute()) {
        // Also update booking payment status to allow proceeding
        $update_booking = $conn->prepare("UPDATE bookings SET payment_status = 'pending_owner_approval' WHERE id = ?");
        $update_booking->bind_param("i", $booking_id);
        $update_booking->execute();
        $update_booking->close();

        echo json_encode([
            "status" => "success",
            "checkout_url" => $checkout_url,
            "session_id" => $session_id,
            "transaction_id" => $transaction_id,
            "message" => "Fake payment completed successfully - you can proceed to next step",
            "is_mock" => true,
            "fake_mode" => true
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Failed to create fake payment record: " . $stmt->error
        ]);
    }

    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Fake payment setup failed: " . $e->getMessage()
    ]);
}

$conn->close();
?>