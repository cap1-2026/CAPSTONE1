# QUICK FIX GUIDE - Make Everything Work

## STEP 1: Copy PHP Files to XAMPP

Your PHP files need to be in the correct XAMPP directory.

**Run these commands in PowerShell:**

```powershell
# Navigate to your project
cd C:\Users\Weslie\CAPSTONE1-1

# Copy all PHP files to XAMPP htdocs
Copy-Item -Path "php_files\*" -Destination "C:\xampp\htdocs\Caps\" -Recurse -Force

# Create uploads directory
New-Item -Path "C:\xampp\htdocs\Caps\uploads" -ItemType Directory -Force
```

## STEP 2: Start XAMPP Services

1. Open **XAMPP Control Panel**
2. Start **Apache** (for PHP)
3. Start **MySQL** (for database)

## STEP 3: Run Fix & Verify Script

Open in your browser:
```
http://192.168.100.7/Caps/fix_and_verify.php
```

OR

```
http://localhost/Caps/fix_and_verify.php
```

This will:
- ✅ Check MySQL connection
- ✅ Create database if missing
- ✅ Create all tables if missing
- ✅ Create uploads folder
- ✅ Verify password hashing works
- ✅ Show data counts

## STEP 4: Test Backend Connection

Open in your browser:
```
http://192.168.100.7/Caps/test.php
```

Should show: All systems working ✅

## STEP 5: Test Your App

1. **Start Expo:**
   ```bash
   npx expo start
   ```

2. **Try Registration:**
   - Open app
   - Select Tenant or Owner
   - Click "Don't have an account? Register"
   - Fill form and register
   - Should redirect to login page

3. **Try Login:**
   - Enter your email and password
   - Should login successfully

## TROUBLESHOOTING

**Problem: "Cannot connect to server"**
- Make sure XAMPP Apache and MySQL are running
- Check if `http://localhost/Caps/test.php` works in browser

**Problem: "Email already registered"**
- That email is already in database
- Use a different email OR clean database

**Problem: "Invalid password"**
- Make sure you're using the correct password
- Try registering a NEW account

**Problem: Files not found**
- Make sure PHP files are copied to `C:\xampp\htdocs\Caps\`
- Check the folder exists

## CLEAN START (Optional)

If you want to start fresh with clean database:

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Click on `apartment_system` database
3. Click "Drop" to delete it
4. Run fix_and_verify.php again (it will recreate everything)

## QUICK CHECK URLS

- Backend Test: http://192.168.100.7/Caps/test.php
- Fix & Verify: http://192.168.100.7/Caps/fix_and_verify.php
- Debug Login: http://192.168.100.7/Caps/debug_login.php
- phpMyAdmin: http://localhost/phpmyadmin
