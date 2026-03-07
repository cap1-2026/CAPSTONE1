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

// Get optional filters
$tenant_id = isset($_GET['tenant_id']) ? intval($_GET['tenant_id']) : null;
$owner_id = isset($_GET['owner_id']) ? intval($_GET['owner_id']) : null;
$booking_id = isset($_GET['booking_id']) ? intval($_GET['booking_id']) : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;

try {
    if ($booking_id) {
        // Get specific booking with property details
        $stmt = $conn->prepare("
            SELECT b.*, p.name as property_name, p.address as property_address, 
                   p.price as property_price, u.fullname as tenant_name
            FROM bookings b
            LEFT JOIN properties p ON b.property_id = p.id
            LEFT JOIN users u ON b.tenant_id = u.id
            WHERE b.id = ?
        ");
        $stmt->bind_param("i", $booking_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(["status"=>"success", "data"=>$result->fetch_assoc()]);
        } else {
            echo json_encode(["status"=>"error", "message"=>"Booking not found"]);
        }
        $stmt->close();
    } else if ($tenant_id) {
        // Get bookings by tenant
        $query = "
            SELECT b.*, p.name as property_name, p.address as property_address, 
                   p.price as property_price
            FROM bookings b
            LEFT JOIN properties p ON b.property_id = p.id
            WHERE b.tenant_id = ?
        ";
        
        if ($status) {
            $query .= " AND b.status = ?";
            $stmt = $conn->prepare($query . " AND b.status = ? ORDER BY b.id DESC");
            $stmt->bind_param("is", $tenant_id, $status);
        } else {
            $stmt = $conn->prepare($query . " ORDER BY b.id DESC");
            $stmt->bind_param("i", $tenant_id);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $rows = [];
        while($row = $result->fetch_assoc()){
            $rows[] = $row;
        }
        echo json_encode(["status"=>"success", "data"=>$rows]);
        $stmt->close();
    } else if ($owner_id) {
        // Get bookings for owner's properties
        $query = "
            SELECT b.*, p.name as property_name, p.address as property_address, 
                   p.price as property_price, u.fullname as tenant_name, u.email as tenant_email
            FROM bookings b
            LEFT JOIN properties p ON b.property_id = p.id
            LEFT JOIN users u ON b.tenant_id = u.id
            WHERE p.owner_id = ?
        ";
        
        if ($status) {
            $query .= " AND b.status = ?";
            $stmt = $conn->prepare($query . " ORDER BY b.id DESC");
            $stmt->bind_param("is", $owner_id, $status);
        } else {
            $stmt = $conn->prepare($query . " ORDER BY b.id DESC");
            $stmt->bind_param("i", $owner_id);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $rows = [];
        while($row = $result->fetch_assoc()){
            $rows[] = $row;
        }
        echo json_encode(["status"=>"success", "data"=>$rows]);
        $stmt->close();
    } else {
        // Get all bookings (admin)
        $query = "
            SELECT b.*, p.name as property_name, p.address as property_address,
                   u.fullname as tenant_name
            FROM bookings b
            LEFT JOIN properties p ON b.property_id = p.id
            LEFT JOIN users u ON b.tenant_id = u.id
            ORDER BY b.id DESC
        ";
        $result = $conn->query($query);
        
        $rows = [];
        while($row = $result->fetch_assoc()){
            $rows[] = $row;
        }
        echo json_encode(["status"=>"success", "data"=>$rows]);
    }
} catch (Exception $e) {
    echo json_encode(["status"=>"error", "message"=>"Database error: " . $e->getMessage()]);
}

$conn->close();
?>
