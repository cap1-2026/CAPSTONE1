<?php
// Debug script to check login issues
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

// Check database connection
if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed: " . $conn->connect_error]));
}

// Get all users (for debugging only - remove in production!)
$result = $conn->query("SELECT id, fullname, email, role, created_at FROM users ORDER BY id DESC LIMIT 10");

$users = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

// Test password hashing
$testPassword = "password123";
$testHash = password_hash($testPassword, PASSWORD_DEFAULT);
$testVerify = password_verify($testPassword, $testHash);

echo json_encode([
    "status" => "success",
    "database_connected" => true,
    "total_users" => count($users),
    "recent_users" => $users,
    "password_test" => [
        "original" => $testPassword,
        "hashed" => $testHash,
        "verify_works" => $testVerify
    ]
], JSON_PRETTY_PRINT);

$conn->close();
?>
