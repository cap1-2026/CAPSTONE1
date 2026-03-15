<?php
// MySQL Connection Configuration
$host = "localhost";
$user = "root";
$password = "";
$database = "apartment_system";
$port = 3307;

// Enable error reporting
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Create connection
$conn = new mysqli($host, $user, $password, $database, $port);

// Set character set to utf8mb4 for full Unicode support
$conn->set_charset('utf8mb4');

// Helper function for prepared statements
function db_prepare($conn, $query) {
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    return $stmt;
}
