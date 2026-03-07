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

if (!$data || !isset($data->owner_id) || !isset($data->property_name)) {
    echo json_encode(["status"=>"error", "message"=>"Missing required fields"]);
    exit();
}

$owner_id = $data->owner_id;
$name = $data->property_name;
$address = $data->address ?? '';
$property_type = $data->property_type ?? 'Apartment';
$rooms = $data->rooms ?? 1;
$room_size = $data->room_size ?? '';
$max = $data->max_occupants ?? 1;
$amenities = $data->amenities ?? '';
$price = $data->price ?? 0;
$deposit = $data->deposit ?? 0;
$rules = $data->rules ?? '';

// Use prepared statement
$stmt = $conn->prepare("INSERT INTO properties (owner_id, name, address, property_type, rooms, room_size, max_occupants, amenities, price, deposit, rules) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("issssissdds", $owner_id, $name, $address, $property_type, $rooms, $room_size, $max, $amenities, $price, $deposit, $rules);

if($stmt->execute()){
    echo json_encode([
        "status"=>"success",
        "property_id"=>$stmt->insert_id,
        "message"=>"Property added successfully"
    ]);
}else{
    echo json_encode([
        "status"=>"error",
        "message"=>"Failed to add property: " . $conn->error
    ]);
}

$stmt->close();
$conn->close();
?>