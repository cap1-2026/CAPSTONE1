<?php

$host = "localhost";
$user = "root";
$password = "";
$database = "apartment_system";

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    header("Content-Type: application/json");
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

?>