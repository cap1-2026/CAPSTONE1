<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

include "db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['booking_id'])) {
    echo json_encode(["status" => "error", "message" => "Invalid request."]);
    exit();
}

$booking_id = intval($_POST['booking_id']);

$uploadDir = __DIR__ . '/uploads/contracts/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

// Handle face photo
$face_path = '';
if (isset($_FILES['face_photo']) && $_FILES['face_photo']['error'] === UPLOAD_ERR_OK) {
    $ext  = pathinfo($_FILES['face_photo']['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $name = 'face_' . $booking_id . '_' . time() . '.' . $ext;
    if (move_uploaded_file($_FILES['face_photo']['tmp_name'], $uploadDir . $name)) {
        $face_path = 'uploads/contracts/' . $name;
    }
}

// Handle ID photo
$id_path = '';
if (isset($_FILES['id_photo']) && $_FILES['id_photo']['error'] === UPLOAD_ERR_OK) {
    $ext  = pathinfo($_FILES['id_photo']['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $name = 'idp_' . $booking_id . '_' . time() . '.' . $ext;
    if (move_uploaded_file($_FILES['id_photo']['tmp_name'], $uploadDir . $name)) {
        $id_path = 'uploads/contracts/' . $name;
    }
}

try {
    $stmt = $conn->prepare("
        UPDATE bookings
        SET contract_status = 'submitted',
            contract_face_photo = ?,
            contract_id_photo   = ?
        WHERE id = ?
    ");
    $stmt->bind_param("ssi", $face_path, $id_path, $booking_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(["status" => "success", "message" => "Contract submitted for owner review."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Booking not found."]);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
