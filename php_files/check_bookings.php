<?php
// Check bookings in database
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

// Get all bookings
$result = $conn->query("SELECT * FROM bookings ORDER BY id DESC LIMIT 5");

$bookings = [];
while ($row = $result->fetch_assoc()) {
    $bookings[] = $row;
}

// Get count
$countResult = $conn->query("SELECT COUNT(*) as total FROM bookings");
$count = $countResult->fetch_assoc()['total'];

echo json_encode([
    "status" => "success",
    "total_bookings" => $count,
    "latest_bookings" => $bookings,
    "message" => "Retrieved " . count($bookings) . " most recent bookings"
], JSON_PRETTY_PRINT);

$conn->close();
?>
