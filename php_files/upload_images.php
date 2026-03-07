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

if (!isset($_POST['property_id']) || !isset($_FILES['image'])) {
    echo json_encode(["status"=>"error", "message"=>"Missing required fields"]);
    exit();
}

$property_id = intval($_POST['property_id']);
$targetDir = "uploads/";

// Create uploads directory if it doesn't exist
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$fileName = basename($_FILES["image"]["name"]);
$imageFileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
$targetFile = $targetDir . time() . "_" . uniqid() . "." . $imageFileType;

// Validate file is an image
$check = getimagesize($_FILES["image"]["tmp_name"]);
if($check === false) {
    echo json_encode(["status"=>"error", "message"=>"File is not an image"]);
    exit();
}

// Check file size (limit to 5MB)
if ($_FILES["image"]["size"] > 5000000) {
    echo json_encode(["status"=>"error", "message"=>"File is too large (max 5MB)"]);
    exit();
}

// Allow certain file formats
if(!in_array($imageFileType, ["jpg", "jpeg", "png", "gif"])) {
    echo json_encode(["status"=>"error", "message"=>"Only JPG, JPEG, PNG & GIF files allowed"]);
    exit();
}

if(move_uploaded_file($_FILES["image"]["tmp_name"], $targetFile)){
    // Use prepared statement
    $stmt = $conn->prepare("INSERT INTO property_images(property_id, image_path) VALUES(?, ?)");
    $stmt->bind_param("is", $property_id, $targetFile);
    
    if($stmt->execute()){
        echo json_encode([
            "status"=>"success",
            "message"=>"Image uploaded successfully",
            "image_path"=>$targetFile
        ]);
    }else{
        echo json_encode([
            "status"=>"error",
            "message"=>"Failed to save image: " . $conn->error
        ]);
    }
    $stmt->close();
}else{
    echo json_encode(["status"=>"error", "message"=>"Failed to upload file"]);
}

$conn->close();
?>