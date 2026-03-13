<?php
// MySQL Connection Configuration - MAXIMIZED SETTINGS
$host = "localhost";
$user = "root";
$password = "";
$database = "apartment_system";
$port = 3307; // Your MySQL is running on port 3307

// Connection timeout and retry settings
$maxRetries = 3;
$retryDelay = 1; // seconds
$connectionTimeout = 10; // seconds

// Initialize connection variable
$conn = null;

// Retry connection logic for resilience
for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
    try {
        // Create optimized MySQLi connection
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

        // Initialize connection
        $conn = mysqli_init();

        if (!$conn) {
            throw new Exception("mysqli_init failed");
        }

        // MAXIMIZED CONNECTION OPTIONS
        // Enable persistent connections for better performance
        $conn->options(MYSQLI_OPT_CONNECT_TIMEOUT, $connectionTimeout);

        // Read/Write timeout (only if supported by this PHP version)
        if (defined('MYSQLI_OPT_READ_TIMEOUT')) {
            $conn->options(MYSQLI_OPT_READ_TIMEOUT, 30);
        }
        if (defined('MYSQLI_OPT_WRITE_TIMEOUT')) {
            $conn->options(MYSQLI_OPT_WRITE_TIMEOUT, 30);
        }

        // Enable compression for faster data transfer
        if (defined('MYSQLI_OPT_COMPRESS')) {
            $conn->options(MYSQLI_OPT_COMPRESS, 1);
        }

        // Enable local infile if needed
        if (defined('MYSQLI_OPT_LOCAL_INFILE')) {
            $conn->options(MYSQLI_OPT_LOCAL_INFILE, 1);
        }

        // Set init command to optimize connection
        $conn->options(MYSQLI_INIT_COMMAND, "SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");

        // Real connect with error handling
        if (!$conn->real_connect($host, $user, $password, $database, $port)) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }

        // Connection successful - optimize further
        // Set character set to utf8mb4 for full Unicode support (emojis, etc.)
        $conn->set_charset('utf8mb4');

        // PERFORMANCE OPTIMIZATIONS
        // Disable autocommit for better transaction control (commit manually when needed)
        $conn->autocommit(TRUE); // Keep autocommit ON for API calls, change to FALSE for batch operations

        // Set session variables for optimal performance
        $conn->query("SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
        $conn->query("SET SESSION time_zone='+00:00'"); // UTC timezone
        $conn->query("SET SESSION interactive_timeout=600"); // 10 minutes
        $conn->query("SET SESSION wait_timeout=600"); // 10 minutes

        // Connection successful, break retry loop
        break;

    } catch (Exception $e) {
        $lastError = $e->getMessage();

        if ($attempt < $maxRetries) {
            // Wait before retrying
            sleep($retryDelay);
            continue;
        } else {
            // Max retries reached, return error
            header("Content-Type: application/json");
            echo json_encode([
                "status" => "error",
                "message" => "Database connection failed after $maxRetries attempts: " . $lastError
            ]);
            exit();
        }
    }
}

// Verify connection is established
if (!$conn || $conn->connect_error) {
    header("Content-Type: application/json");
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . ($conn ? $conn->connect_error : "Connection initialization failed")
    ]);
    exit();
}

// Helper function for prepared statements (prevents SQL injection)
function db_prepare($conn, $query) {
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    return $stmt;
}

// Helper function for transactions
function db_begin_transaction($conn) {
    return $conn->begin_transaction();
}

function db_commit($conn) {
    return $conn->commit();
}

function db_rollback($conn) {
    return $conn->rollback();
}

// Connection successful
// $conn is now ready for use with maximum optimization

?>