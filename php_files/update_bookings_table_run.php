<?php
// Update bookings table structure
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

$results = [];

// Add columns one by one
$columns = [
    "ALTER TABLE bookings ADD COLUMN full_name VARCHAR(255) AFTER property_id",
    "ALTER TABLE bookings ADD COLUMN email VARCHAR(255) AFTER full_name",
    "ALTER TABLE bookings ADD COLUMN phone VARCHAR(50) AFTER email",
    "ALTER TABLE bookings ADD COLUMN current_address TEXT AFTER phone",
    "ALTER TABLE bookings ADD COLUMN id_type VARCHAR(100) AFTER current_address",
    "ALTER TABLE bookings ADD COLUMN id_number VARCHAR(100) AFTER id_type",
    "ALTER TABLE bookings ADD COLUMN id_image_path VARCHAR(500) AFTER id_number",
    "ALTER TABLE bookings ADD COLUMN emergency_contact_name VARCHAR(255) AFTER id_image_path",
    "ALTER TABLE bookings ADD COLUMN emergency_contact_phone VARCHAR(50) AFTER emergency_contact_name",
    "ALTER TABLE bookings ADD COLUMN lease_duration VARCHAR(50) AFTER emergency_contact_phone"
];

foreach ($columns as $sql) {
    if ($conn->query($sql) === TRUE) {
        $results[] = ["status" => "success", "query" => $sql];
    } else {
        // Check if error is because column already exists
        if (strpos($conn->error, "Duplicate column") !== false) {
            $results[] = ["status" => "skipped", "query" => $sql, "reason" => "Column already exists"];
        } else {
            $results[] = ["status" => "error", "query" => $sql, "error" => $conn->error];
        }
    }
}

// Count successes
$successCount = 0;
$skippedCount = 0;
$errorCount = 0;

foreach ($results as $result) {
    if ($result['status'] === 'success') $successCount++;
    if ($result['status'] === 'skipped') $skippedCount++;
    if ($result['status'] === 'error') $errorCount++;
}

echo json_encode([
    "status" => $errorCount > 0 ? "error" : "success",
    "message" => "Database update completed",
    "summary" => [
        "total" => count($columns),
        "success" => $successCount,
        "skipped" => $skippedCount,
        "errors" => $errorCount
    ],
    "details" => $results
], JSON_PRETTY_PRINT);

$conn->close();
?>
