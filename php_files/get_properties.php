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

// Get optional filters from query parameters
$owner_id = isset($_GET['owner_id']) ? intval($_GET['owner_id']) : null;
$property_id = isset($_GET['property_id']) ? intval($_GET['property_id']) : null;

// Subquery to get the first uploaded image for each property
$image_subquery = "(SELECT image_path FROM property_images WHERE property_id = p.id ORDER BY id ASC LIMIT 1) AS first_image";

if ($property_id) {
    // Get specific property with its first image
    $stmt = $conn->prepare("SELECT p.*, $image_subquery FROM properties p WHERE p.id = ?");
    $stmt->bind_param("i", $property_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode(["status"=>"success", "data"=>$result->fetch_assoc()]);
    } else {
        echo json_encode(["status"=>"error", "message"=>"Property not found"]);
    }
    $stmt->close();
} else if ($owner_id) {
    // Get properties by owner with first image
    $stmt = $conn->prepare("SELECT p.*, $image_subquery FROM properties p WHERE p.owner_id = ?");
    $stmt->bind_param("i", $owner_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $rows = [];
    while($row = $result->fetch_assoc()){
        $rows[] = $row;
    }
    echo json_encode(["status"=>"success", "data"=>$rows]);
    $stmt->close();
} else {
    // Get all properties with first image
    $result = $conn->query("SELECT p.*, $image_subquery FROM properties p");

    $rows = [];
    while($row = $result->fetch_assoc()){
        $rows[] = $row;
    }
    echo json_encode(["status"=>"success", "data"=>$rows]);
}

$conn->close();
?>
