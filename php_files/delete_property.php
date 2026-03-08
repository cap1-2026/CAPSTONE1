<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "db.php";


// Accept property_id from JSON or POST

$rawBody = file_get_contents("php://input");
$data = json_decode($rawBody);
$property_id = null;
if ($data && isset($data->property_id)) {
    $property_id = $data->property_id;
} elseif (isset($_POST['property_id'])) {
    $property_id = $_POST['property_id'];
} elseif (isset($_REQUEST['property_id'])) {
    $property_id = $_REQUEST['property_id'];
}
if (!$property_id) {
    // Fallback: try to extract property_id from raw body if JSON decode fails
    if (preg_match('/"property_id"\s*:\s*(\d+)/', $rawBody, $matches)) {
        $property_id = intval($matches[1]);
    }
}
if (!$property_id) {
    echo json_encode([
        "status"=>"error",
        "message"=>"Missing property ID",
        "debug_raw_body"=>$rawBody,
        "debug_post"=>$_POST,
        "debug_request"=>$_REQUEST,
        "debug_json_type"=>gettype($data),
        "debug_json"=>$data
    ]);
    exit();
}

try {
    // Delete all bookings for this property
    $stmt = $conn->prepare("DELETE FROM bookings WHERE property_id = ?");
    $stmt->bind_param("i", $property_id);
    $stmt->execute();
    $stmt->close();

    // Delete the property
    $stmt = $conn->prepare("DELETE FROM properties WHERE id = ?");
    $stmt->bind_param("i", $property_id);
    if($stmt->execute()){
        if($stmt->affected_rows > 0) {
            echo json_encode([
                "status"=>"success",
                "message"=>"Property and related bookings deleted successfully"
            ]);
        } else {
            echo json_encode(["status"=>"error", "message"=>"Property not found"]);
        }
    } else {
        echo json_encode([
            "status"=>"error",
            "message"=>"Failed to delete property: " . $conn->error
        ]);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["status"=>"error", "message"=>"Error: " . $e->getMessage()]);
}

$conn->close();
?>