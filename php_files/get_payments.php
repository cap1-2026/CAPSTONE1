<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "db.php";

// Get optional filters
$booking_id = isset($_GET['booking_id']) ? intval($_GET['booking_id']) : null;
$payment_id = isset($_GET['payment_id']) ? intval($_GET['payment_id']) : null;
$tenant_id = isset($_GET['tenant_id']) ? intval($_GET['tenant_id']) : null;

try {
    if ($payment_id) {
        // Get specific payment
        $stmt = $conn->prepare("
            SELECT p.*, b.property_id, b.tenant_id, b.full_name as tenant_name,
                   pr.name as property_name
            FROM payments p
            LEFT JOIN bookings b ON p.booking_id = b.id
            LEFT JOIN properties pr ON b.property_id = pr.id
            WHERE p.id = ?
        ");
        $stmt->bind_param("i", $payment_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(["status"=>"success", "data"=>$result->fetch_assoc()]);
        } else {
            echo json_encode(["status"=>"error", "message"=>"Payment not found"]);
        }
        $stmt->close();
    } else if ($booking_id) {
        // Get payments by booking
        $stmt = $conn->prepare("SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC");
        $stmt->bind_param("i", $booking_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $rows = [];
        while($row = $result->fetch_assoc()){
            $rows[] = $row;
        }
        echo json_encode(["status"=>"success", "data"=>$rows]);
        $stmt->close();
    } else if ($tenant_id) {
        // Get payments by tenant
        $stmt = $conn->prepare("
            SELECT p.*, b.property_id, pr.name as property_name, pr.address as property_address
            FROM payments p
            LEFT JOIN bookings b ON p.booking_id = b.id
            LEFT JOIN properties pr ON b.property_id = pr.id
            WHERE b.tenant_id = ?
            ORDER BY p.created_at DESC
        ");
        $stmt->bind_param("i", $tenant_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $rows = [];
        while($row = $result->fetch_assoc()){
            $rows[] = $row;
        }
        echo json_encode(["status"=>"success", "data"=>$rows]);
        $stmt->close();
    } else {
        // Get all payments
        $sql = "
            SELECT p.*, b.full_name as tenant_name, b.property_id,
                   pr.name as property_name
            FROM payments p
            LEFT JOIN bookings b ON p.booking_id = b.id
            LEFT JOIN properties pr ON b.property_id = pr.id
            ORDER BY p.created_at DESC
        ";
        $result = $conn->query($sql);
        
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
