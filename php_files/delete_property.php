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

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->property_id)) {
    echo json_encode(["status"=>"error", "message"=>"Missing property ID"]);
    exit();
}

$property_id = $data->property_id;

try {
    // Check if property has active bookings
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM bookings WHERE property_id = ? AND status IN ('pending', 'approved')");
    $stmt->bind_param("i", $property_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    if ($row['count'] > 0) {
        echo json_encode([
            "status"=>"error", 
            "message"=>"Cannot delete property with active bookings"
        ]);
        exit();
    }
    $stmt->close();
    
    // Delete the property
    $stmt = $conn->prepare("DELETE FROM properties WHERE id = ?");
    $stmt->bind_param("i", $property_id);
    
    if($stmt->execute()){
        if($stmt->affected_rows > 0) {
            echo json_encode([
                "status"=>"success",
                "message"=>"Property deleted successfully"
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