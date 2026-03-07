# BACKEND SETUP INSTRUCTIONS

## Prerequisites
1. **XAMPP/WAMP** installed (includes Apache, MySQL, and PHP)
2. **MySQL database** running
3. **Apache server** running

## Setup Steps

### 1. Database Setup
1. Open **phpMyAdmin** (http://localhost/phpmyadmin)
2. Create a new database called `apartment_system`
3. Import the SQL file:
   - Click on the `apartment_system` database
   - Go to "Import" tab
   - Select `setup_database.sql` file
   - Click "Go" to create all tables

### 2. Configure Database Connection
1. Open `db.php` and verify the settings:
   ```php
   $host = "localhost";
   $user = "root";
   $password = "";  // Your MySQL password if set
   $database = "apartment_system";
   ```

### 3. Deploy PHP Files
**Option A: Using apartment_api folder**
1. Copy the entire `php_files` folder to:
   - XAMPP: `C:\xampp\htdocs\apartment_api\`
   - WAMP: `C:\wamp64\www\apartment_api\`

2. Rename `php_files` to `apartment_api` OR update your React Native app URLs

**Option B: Using different path**
1. Copy files to your desired location in htdocs/www
2. Update ALL API URLs in your React Native app to match

### 4. Create Uploads Directory
1. Inside your `apartment_api` folder, create an `uploads` folder
2. Set permissions (if on Linux/Mac): `chmod 777 uploads`

### 5. Test the Backend
1. Make sure Apache and MySQL are running
2. Open browser and test:
   - `http://localhost/apartment_api/register.php` - should show blank page (not 404)
   - `http://192.168.100.155/apartment_api/register.php` - should be accessible

### 6. Update React Native App URLs
Find your local IP:
- Windows: Open CMD and type `ipconfig` (look for IPv4 Address)
- Mac/Linux: Open Terminal and type `ifconfig` or `ip addr`

Update all fetch URLs in your React Native app:
```typescript
"http://YOUR_IP_ADDRESS/apartment_api/ENDPOINT.php"
```

Current IP in your code: `192.168.100.155`

## API Endpoints

### Authentication
- **POST** `/register.php` - Register new user
- **POST** `/login.php` - User login

### Properties
- **POST** `/add_property.php` - Add new property
- **GET** `/get_properties.php` - Get all properties
- **GET** `/get_properties.php?owner_id=1` - Get properties by owner
- **GET** `/get_properties.php?property_id=1` - Get specific property
- **POST** `/upload_images.php` - Upload property images

### Bookings
- **POST** `/book_room.php` - Create booking
- **POST** `/approve_booking.php` - Approve/reject booking
- **POST** `/verify_qr.php` - Verify QR code

### Payments
- **POST** `/payment.php` - Process payment
- **POST** `/escrow_decision.php` - Handle escrow decision

## Troubleshooting

### Error: "Cannot connect to server"
- Check if Apache is running in XAMPP/WAMP
- Verify your IP address is correct
- Make sure your phone and computer are on the same network
- Check Windows Firewall isn't blocking the connection

### Error: "Connection failed"
- Check MySQL is running
- Verify database credentials in `db.php`
- Make sure `apartment_system` database exists

### Error: 404 Not Found
- Verify files are in correct folder (htdocs/www/apartment_api/)
- Check Apache is running
- Verify the URL path matches your folder structure

### CORS Errors
- All files now have CORS headers enabled
- If still having issues, check browser console for specific errors

## Testing with Postman/Insomnia

**Test Register:**
```
POST http://localhost/apartment_api/register.php
Content-Type: application/json

{
  "fullname": "Test User",
  "address": "123 Test St",
  "contact": "09123456789",
  "email": "test@example.com",
  "password": "password123",
  "role": "tenant"
}
```

**Test Login:**
```
POST http://localhost/apartment_api/login.php
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

## Security Notes
- All PHP files now use **prepared statements** to prevent SQL injection
- Passwords are **hashed** with bcrypt
- **Email validation** is enabled
- **CORS headers** are set for cross-origin requests
- Input validation on all endpoints

## Sample Test Accounts
After running setup_database.sql:
- **Owner:** owner@test.com / password
- **Tenant:** tenant@test.com / password
