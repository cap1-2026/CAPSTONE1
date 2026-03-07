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

if (!$data || !isset($data->email) || !isset($data->password)) {
    echo json_encode(["status"=>"error", "message"=>"Missing credentials"]);
    exit();
}

$email = $data->email;
$password = $data->password;

// Use prepared statement
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if($result->num_rows > 0){
    $row = $result->fetch_assoc();
    
    if(password_verify($password, $row['password'])){
        echo json_encode([
            "status"=>"success",
            "role"=>$row['role'],
            "user_id"=>$row['id'],
            "fullname"=>$row['fullname'],
            "email"=>$row['email']
        ]);
    }else{
        echo json_encode(["status"=>"error", "message"=>"Invalid password"]);
    }
}else{
    echo json_encode(["status"=>"error", "message"=>"Email not found"]);
}

$stmt->close();
$conn->close();
?>