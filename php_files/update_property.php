<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "db.php";

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->property_id)) {
    echo json_encode(["status"=>"error", "message"=>"Missing property ID"]);
    exit();
}

$property_id = $data->property_id;

// Build dynamic update query
$updates = [];
$params = [];
$types = "";

if (isset($data->property_name)) {
    $updates[] = "name = ?";
    $params[] = $data->property_name;
    $types .= "s";
}
if (isset($data->address)) {
    $updates[] = "address = ?";
    $params[] = $data->address;
    $types .= "s";
}
if (isset($data->property_type)) {
    $updates[] = "property_type = ?";
    $params[] = $data->property_type;
    $types .= "s";
}
if (isset($data->rooms)) {
    $updates[] = "rooms = ?";
    $params[] = $data->rooms;
    $types .= "i";
}
if (isset($data->room_size)) {
    $updates[] = "room_size = ?";
    $params[] = $data->room_size;
    $types .= "s";
}
if (isset($data->max_occupants)) {
    $updates[] = "max_occupants = ?";
    $params[] = $data->max_occupants;
    $types .= "i";
}
if (isset($data->amenities)) {
    $updates[] = "amenities = ?";
    $params[] = $data->amenities;
    $types .= "s";
}
if (isset($data->price)) {
    $updates[] = "price = ?";
    $params[] = $data->price;
    $types .= "d";
}
if (isset($data->deposit)) {
    $updates[] = "deposit = ?";
    $params[] = $data->deposit;
    $types .= "d";
}
if (isset($data->rules)) {
    $updates[] = "rules = ?";
    $params[] = $data->rules;
    $types .= "s";
}
if (isset($data->status)) {
    $updates[] = "status = ?";
    $params[] = $data->status;
    $types .= "s";
}

if (empty($updates)) {
    echo json_encode(["status"=>"error", "message"=>"No fields to update"]);
    exit();
}

$sql = "UPDATE properties SET " . implode(", ", $updates) . " WHERE id = ?";
$params[] = $property_id;
$types .= "i";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);

if($stmt->execute()){
    if($stmt->affected_rows > 0) {
        echo json_encode([
            "status"=>"success",
            "message"=>"Property updated successfully"
        ]);
    } else {
        echo json_encode(["status"=>"info", "message"=>"No changes made or property not found"]);
    }
} else {
    echo json_encode([
        "status"=>"error",
        "message"=>"Failed to update property: " . $conn->error
    ]);
}

$stmt->close();
$conn->close();
?>
