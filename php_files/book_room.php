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

// Handle multipart/form-data
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['tenant_id']) && isset($_POST['property_id'])) {
    $tenant_id = $_POST['tenant_id'];
    $property_id = $_POST['property_id'];
    $full_name = $_POST['full_name'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $current_address = $_POST['current_address'];
    $id_type = $_POST['id_type'];
    $id_number = $_POST['id_number'];
    $emergency_contact_name = $_POST['emergency_contact_name'] ?? '';
    $emergency_contact_phone = $_POST['emergency_contact_phone'] ?? '';
    $move_in = $_POST['move_in'] ?? date('Y-m-d');
    // Convert MM/DD/YYYY to YYYY-MM-DD for MySQL
    if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $move_in, $m)) {
        $move_in = "{$m[3]}-{$m[1]}-{$m[2]}";
    }
    $lease_duration = $_POST['lease_duration'] ?? '12 months';
    $duration = intval($_POST['duration'] ?? 12);
    $occupants = intval($_POST['occupants'] ?? 1);
    $special_request = $_POST['special_request'] ?? '';

    // Handle image upload
    $id_image_path = '';
    if (isset($_FILES['id_image']) && $_FILES['id_image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        $ext = pathinfo($_FILES['id_image']['name'], PATHINFO_EXTENSION);
        $fileName = 'id_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
        if (move_uploaded_file($_FILES['id_image']['tmp_name'], $uploadDir . $fileName)) {
            $id_image_path = 'uploads/' . $fileName;
        }
    }

    try {
        $stmt = $conn->prepare("
            INSERT INTO bookings (
                tenant_id, property_id, full_name, email, phone, current_address,
                id_type, id_number, id_image_path, emergency_contact_name, emergency_contact_phone,
                move_in, lease_duration, duration, occupants, special_request, status
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, 'pending'
            )
        ");

        $stmt->bind_param(
            "iisssssssssssiis",
            $tenant_id, $property_id, $full_name, $email, $phone, $current_address,
            $id_type, $id_number, $id_image_path, $emergency_contact_name, $emergency_contact_phone,
            $move_in, $lease_duration, $duration, $occupants, $special_request
        );

        $stmt->execute();
        $booking_id = $stmt->insert_id;
        $stmt->close();
        $conn->close();

        echo json_encode([
            "status" => "success",
            "message" => "Booking created successfully! Your booking is now pending approval.",
            "booking_id" => $booking_id,
            "data" => [
                "booking_id" => $booking_id,
                "tenant_name" => $full_name,
                "property_id" => $property_id,
                "move_in" => $move_in,
                "lease_duration" => $lease_duration,
                "id_image_path" => $id_image_path
            ]
        ]);
    } catch (Exception $e) {
        echo json_encode([
            "status" => "error",
            "message" => "Failed to create booking: " . $e->getMessage()
        ]);
    }
    exit();
}

echo json_encode(["status" => "error", "message" => "Invalid request or missing fields."]);
exit();
?>
