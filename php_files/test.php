<?php
// Test endpoint to verify backend is working
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Test database connection
include "db.php";

$tests = [];

// 1. Test PHP version
$tests['php_version'] = [
    'status' => 'success',
    'value' => phpversion(),
    'message' => 'PHP is running'
];

// 2. Test database connection
if ($conn->connect_error) {
    $tests['database'] = [
        'status' => 'error',
        'message' => 'Database connection failed: ' . $conn->connect_error
    ];
} else {
    $tests['database'] = [
        'status' => 'success',
        'message' => 'Database connected successfully'
    ];
    
    // 3. Test if tables exist
    $tables = ['users', 'properties', 'bookings', 'payments', 'property_images'];
    $existing_tables = [];
    $missing_tables = [];
    
    foreach ($tables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        if ($result && $result->num_rows > 0) {
            $existing_tables[] = $table;
        } else {
            $missing_tables[] = $table;
        }
    }
    
    $tests['tables'] = [
        'status' => empty($missing_tables) ? 'success' : 'warning',
        'existing' => $existing_tables,
        'missing' => $missing_tables,
        'message' => empty($missing_tables) ? 'All tables exist' : 'Some tables are missing'
    ];
    
    // 4. Count users
    $result = $conn->query("SELECT COUNT(*) as count FROM users");
    if ($result) {
        $row = $result->fetch_assoc();
        $tests['users_count'] = [
            'status' => 'success',
            'count' => $row['count'],
            'message' => 'Users table accessible'
        ];
    }
}

// 5. Test file write permissions
$upload_dir = "uploads/";
if (!file_exists($upload_dir)) {
    @mkdir($upload_dir, 0777, true);
}

if (is_writable($upload_dir)) {
    $tests['uploads_directory'] = [
        'status' => 'success',
        'message' => 'Uploads directory is writable'
    ];
} else {
    $tests['uploads_directory'] = [
        'status' => 'warning',
        'message' => 'Uploads directory may not be writable'
    ];
}

// 6. Get server info
$tests['server_info'] = [
    'status' => 'info',
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'server_ip' => $_SERVER['SERVER_ADDR'] ?? 'Unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown'
];

echo json_encode([
    'status' => 'success',
    'message' => 'Backend API is running',
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => $tests
], JSON_PRETTY_PRINT);

if (isset($conn)) {
    $conn->close();
}
?>
