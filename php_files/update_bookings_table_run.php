<?php
// Update bookings table structure
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

// Disable strict mysqli exceptions so duplicate-column errors don't crash the script
mysqli_report(MYSQLI_REPORT_OFF);

$results = [];

$columns = [
    "full_name"               => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) AFTER property_id",
    "email"                   => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email VARCHAR(255) AFTER full_name",
    "phone"                   => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone VARCHAR(50) AFTER email",
    "current_address"         => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS current_address TEXT AFTER phone",
    "id_type"                 => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_type VARCHAR(100) AFTER current_address",
    "id_number"               => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_number VARCHAR(100) AFTER id_type",
    "id_image_path"           => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_image_path VARCHAR(500) AFTER id_number",
    "emergency_contact_name"  => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255) AFTER id_image_path",
    "emergency_contact_phone" => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50) AFTER emergency_contact_name",
    "lease_duration"          => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lease_duration VARCHAR(50) AFTER emergency_contact_phone",
    "move_in"                 => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS move_in DATE AFTER lease_duration",
    "duration"                => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration INT DEFAULT 12 AFTER move_in",
    "occupants"               => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS occupants INT DEFAULT 1 AFTER duration",
    "special_request"         => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_request TEXT AFTER occupants",
    "contract_status"         => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contract_status VARCHAR(20) DEFAULT 'none' AFTER special_request",
    "contract_face_photo"     => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contract_face_photo VARCHAR(500) DEFAULT '' AFTER contract_status",
    "contract_id_photo"       => "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contract_id_photo VARCHAR(500) DEFAULT '' AFTER contract_face_photo",
];

foreach ($columns as $col => $sql) {
    try {
        $ok = $conn->query($sql);
        if ($ok) {
            $results[] = ["status" => "success", "column" => $col];
        } else {
            $err = $conn->error;
            if (stripos($err, "Duplicate column") !== false) {
                $results[] = ["status" => "skipped", "column" => $col, "reason" => "Already exists"];
            } else {
                $results[] = ["status" => "error", "column" => $col, "error" => $err];
            }
        }
    } catch (Throwable $e) {
        $msg = $e->getMessage();
        if (stripos($msg, "Duplicate column") !== false) {
            $results[] = ["status" => "skipped", "column" => $col, "reason" => "Already exists"];
        } else {
            $results[] = ["status" => "error", "column" => $col, "error" => $msg];
        }
    }
}

$successCount = 0;
$skippedCount = 0;
$errorCount   = 0;

foreach ($results as $r) {
    if ($r['status'] === 'success') $successCount++;
    if ($r['status'] === 'skipped') $skippedCount++;
    if ($r['status'] === 'error')   $errorCount++;
}

echo json_encode([
    "status"  => $errorCount > 0 ? "partial_error" : "success",
    "message" => "Migration completed",
    "summary" => [
        "total"   => count($columns),
        "added"   => $successCount,
        "skipped" => $skippedCount,
        "errors"  => $errorCount,
    ],
    "details" => $results,
], JSON_PRETTY_PRINT);

$conn->close();
?>
