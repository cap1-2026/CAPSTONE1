<?php
// Check bookings table structure
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

// Get table structure
$result = $conn->query("DESCRIBE bookings");

$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row;
}

// Check required columns
$requiredColumns = [
    'id', 'tenant_id', 'property_id', 
    'full_name', 'email', 'phone', 'current_address',
    'id_type', 'id_number', 'id_image_path',
    'emergency_contact_name', 'emergency_contact_phone',
    'move_in', 'lease_duration', 'duration'
];

$existingColumns = array_column($columns, 'Field');
$missingColumns = array_diff($requiredColumns, $existingColumns);
$hasAllColumns = empty($missingColumns);

echo json_encode([
    "status" => $hasAllColumns ? "success" : "error",
    "message" => $hasAllColumns ? "Bookings table has all required columns" : "Missing columns in bookings table",
    "existing_columns" => $existingColumns,
    "missing_columns" => array_values($missingColumns),
    "all_column_details" => $columns
], JSON_PRETTY_PRINT);

$conn->close();
?>
