<?php
// Enable CORS for React Native
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "db.php";

$data = json_decode(file_get_contents("php://input"));

// Validate input
if (!$data || !isset($data->fullname) || !isset($data->email) || !isset($data->password) || !isset($data->address) || !isset($data->contact) || !isset($data->role)) {
    echo json_encode([
        "status"=>"error",
        "message"=>"Missing required fields"
    ]);
    exit();
}

$fullname = $data->fullname;
$address = $data->address;
$contact = $data->contact;
$email = $data->email;
$password = $data->password;
$role = $data->role;

// Validate email
if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
    echo json_encode(["status"=>"error","message"=>"Invalid Email"]);
    exit();
}

// Check if email already exists
$checkStmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$result = $checkStmt->get_result();

if($result->num_rows > 0){
    echo json_encode(["status"=>"error","message"=>"Email already registered"]);
    exit();
}
$checkStmt->close();

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Use prepared statement to prevent SQL injection
$stmt = $conn->prepare("INSERT INTO users (fullname, address, contact, email, password, role) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssss", $fullname, $address, $contact, $email, $hashedPassword, $role);

if($stmt->execute()){
    echo json_encode([
        "status"=>"success",
        "message"=>"Registration successful",
        "user_id" => $stmt->insert_id
    ]);
}else{
    echo json_encode([
        "status"=>"error",
        "message"=>"Registration failed: " . $conn->error
    ]);
}

$stmt->close();
$conn->close();

