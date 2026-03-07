<?php
// Comprehensive Fix & Verify Script
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$results = [];

// 1. Test Database Connection
$host = "localhost";
$user = "root";
$password = "";
$database = "apartment_system";

$conn = new mysqli($host, $user, $password);

if ($conn->connect_error) {
    $results['step1_connection'] = [
        'status' => 'error',
        'message' => 'Cannot connect to MySQL: ' . $conn->connect_error
    ];
    echo json_encode($results, JSON_PRETTY_PRINT);
    exit();
}

$results['step1_connection'] = [
    'status' => 'success',
    'message' => 'MySQL connection successful'
];

// 2. Check if database exists, create if not
$db_check = $conn->query("SHOW DATABASES LIKE '$database'");
if ($db_check->num_rows == 0) {
    // Database doesn't exist, create it
    if ($conn->query("CREATE DATABASE `$database`")) {
        $results['step2_database'] = [
            'status' => 'created',
            'message' => "Database '$database' created successfully"
        ];
    } else {
        $results['step2_database'] = [
            'status' => 'error',
            'message' => 'Failed to create database: ' . $conn->error
        ];
    }
} else {
    $results['step2_database'] = [
        'status' => 'exists',
        'message' => "Database '$database' already exists"
    ];
}

// Select the database
$conn->select_db($database);

// 3. Check and create tables if needed
$tables_sql = [
    'users' => "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        address TEXT,
        contact VARCHAR(50),
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('owner', 'tenant') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
    )",
    'properties' => "CREATE TABLE IF NOT EXISTS properties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        rooms INT DEFAULT 1,
        room_size VARCHAR(100),
        max_occupants INT DEFAULT 1,
        amenities TEXT,
        price DECIMAL(10, 2) DEFAULT 0.00,
        deposit DECIMAL(10, 2) DEFAULT 0.00,
        rules TEXT,
        status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_owner (owner_id),
        INDEX idx_status (status)
    )",
    'property_images' => "CREATE TABLE IF NOT EXISTS property_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        image_path VARCHAR(500) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        INDEX idx_property (property_id)
    )",
    'bookings' => "CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        property_id INT NOT NULL,
        move_in DATE NOT NULL,
        duration INT DEFAULT 1,
        occupants INT DEFAULT 1,
        special_request TEXT,
        status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
        escrow_status ENUM('pending', 'refund_tenant', 'transfer_owner') DEFAULT 'pending',
        qr_code VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        INDEX idx_tenant (tenant_id),
        INDEX idx_property (property_id),
        INDEX idx_status (status),
        INDEX idx_qr (qr_code)
    )",
    'payments' => "CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        method ENUM('cash', 'gcash', 'bank_transfer', 'card') DEFAULT 'cash',
        transaction_id VARCHAR(255) UNIQUE,
        status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        INDEX idx_booking (booking_id),
        INDEX idx_transaction (transaction_id),
        INDEX idx_status (status)
    )"
];

$results['step3_tables'] = [];
foreach ($tables_sql as $table_name => $sql) {
    if ($conn->query($sql)) {
        $results['step3_tables'][$table_name] = [
            'status' => 'success',
            'message' => "Table '$table_name' is ready"
        ];
    } else {
        $results['step3_tables'][$table_name] = [
            'status' => 'error',
            'message' => 'Error: ' . $conn->error
        ];
    }
}

// 4. Check uploads directory
$upload_dir = "uploads/";
if (!file_exists($upload_dir)) {
    if (mkdir($upload_dir, 0777, true)) {
        $results['step4_uploads'] = [
            'status' => 'created',
            'message' => 'Uploads directory created'
        ];
    } else {
        $results['step4_uploads'] = [
            'status' => 'error',
            'message' => 'Failed to create uploads directory'
        ];
    }
} else {
    $results['step4_uploads'] = [
        'status' => 'exists',
        'message' => 'Uploads directory exists',
        'writable' => is_writable($upload_dir)
    ];
}

// 5. Count existing data
$counts = [];
$tables = ['users', 'properties', 'bookings', 'payments', 'property_images'];
foreach ($tables as $table) {
    $result = $conn->query("SELECT COUNT(*) as count FROM $table");
    if ($result) {
        $row = $result->fetch_assoc();
        $counts[$table] = $row['count'];
    }
}

$results['step5_data_counts'] = [
    'status' => 'success',
    'counts' => $counts,
    'message' => 'Database has ' . $counts['users'] . ' users, ' . 
                 $counts['properties'] . ' properties, ' . 
                 $counts['bookings'] . ' bookings'
];

// 6. Test password hashing
$test_password = "test123";
$test_hash = password_hash($test_password, PASSWORD_DEFAULT);
$test_verify = password_verify($test_password, $test_hash);

$results['step6_password_test'] = [
    'status' => $test_verify ? 'success' : 'error',
    'message' => $test_verify ? 'Password hashing works correctly' : 'Password hashing failed'
];

// Final Summary
$all_success = true;
foreach ($results as $step => $data) {
    if (is_array($data) && isset($data['status']) && $data['status'] === 'error') {
        $all_success = false;
        break;
    }
    if (is_array($data)) {
        foreach ($data as $sub) {
            if (is_array($sub) && isset($sub['status']) && $sub['status'] === 'error') {
                $all_success = false;
                break 2;
            }
        }
    }
}

$results['summary'] = [
    'overall_status' => $all_success ? 'success' : 'needs_attention',
    'message' => $all_success ? 'All systems operational!' : 'Some issues found, check details above',
    'backend_url' => 'http://192.168.100.7/Caps',
    'ready_to_use' => $all_success
];

echo json_encode($results, JSON_PRETTY_PRINT);

$conn->close();
?>
