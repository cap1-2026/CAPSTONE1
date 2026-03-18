<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Cache-Control, Pragma");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "POST required"]);
    exit();
}

include "db.php";

$conn->query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tenant_signature VARCHAR(500) DEFAULT NULL");

$booking_id     = isset($_POST['booking_id'])     ? intval($_POST['booking_id'])     : 0;
$tenant_id      = isset($_POST['tenant_id'])      ? intval($_POST['tenant_id'])      : 0;
$signature_data = isset($_POST['signature_data']) ? trim($_POST['signature_data'])   : '';

if (!$booking_id || !$tenant_id) {
    echo json_encode(["status" => "error", "message" => "booking_id and tenant_id required"]);
    exit();
}
if (empty($signature_data)) {
    echo json_encode(["status" => "error", "message" => "signature_data required"]);
    exit();
}

// Verify booking belongs to this tenant
$check = $conn->prepare("SELECT id FROM bookings WHERE id = ? AND tenant_id = ?");
$check->bind_param("ii", $booking_id, $tenant_id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Booking not found or unauthorized"]);
    $check->close(); $conn->close(); exit();
}
$check->close();

// Validate SVG
if (strpos($signature_data, '<svg') === false) {
    echo json_encode(["status" => "error", "message" => "Invalid signature data"]);
    $conn->close(); exit();
}

// ── 1. Save raw SVG ──────────────────────────────────────────────────────────
$svgDir = __DIR__ . "/uploads/signatures/";
if (!is_dir($svgDir)) mkdir($svgDir, 0775, true);

$svgFilename = "sig_{$booking_id}_" . time() . ".svg";
$svgDest     = $svgDir . $svgFilename;
$svgPath     = "uploads/signatures/{$svgFilename}";

if (file_put_contents($svgDest, $signature_data) === false) {
    echo json_encode(["status" => "error", "message" => "Failed to save signature"]);
    $conn->close(); exit();
}

// ── 2. Fetch booking + property + tenant details ──────────────────────────────
$qs = $conn->prepare("
    SELECT b.move_in, b.lease_duration, b.occupants,
           p.name    AS property_name,
           p.address AS property_address,
           p.price   AS property_price,
           p.deposit AS property_deposit,
           p.type    AS property_type,
           u.fullname AS tenant_name
    FROM bookings b
    LEFT JOIN properties p ON b.property_id = p.id
    LEFT JOIN users u      ON b.tenant_id   = u.id
    WHERE b.id = ? AND b.tenant_id = ?
");
$qs->bind_param("ii", $booking_id, $tenant_id);
$qs->execute();
$info = $qs->get_result()->fetch_assoc();
$qs->close();

$finalPath = $svgPath; // fallback if GD fails

if ($info && function_exists('imagecreatetruecolor')) {

    $today       = date("F j, Y");
    $ref         = "PF-" . str_pad($booking_id, 6, "0", STR_PAD_LEFT);
    $tenantName  = $info['tenant_name']    ?? 'Tenant';
    $propName    = $info['property_name']  ?? '';
    $propAddr    = $info['property_address'] ?? '';
    $rent        = number_format((float)($info['property_price']   ?? 0));
    $deposit     = number_format((float)($info['property_deposit'] ?? $info['property_price'] ?? 0));
    $moveIn      = $info['move_in']        ?? '';
    $duration    = $info['lease_duration'] ?? '';
    $occupants   = ($info['occupants']     ?? 1);
    $propType    = strtolower($info['property_type'] ?? '');
    $isTransient = ($propType === 'transient');

    $cw = 880;   // canvas width
    $lp = 40;    // left padding
    $rp = 40;    // right padding
    $contentW = $cw - $lp - $rp;

    // ── Try to load TrueType fonts ─────────────────────────────────────────
    $ttfPaths = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ];
    $ttfBoldPaths = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/ArialBD.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ];
    $ttf  = null;
    $ttfB = null;
    foreach ($ttfPaths     as $fp) { if (file_exists($fp)) { $ttf  = $fp; break; } }
    foreach ($ttfBoldPaths as $fp) { if (file_exists($fp)) { $ttfB = $fp; break; } }
    if (!$ttfB) $ttfB = $ttf;
    $useTTF = ($ttf !== null);

    $fs      = 13;   // body font size
    $fsSect  = 11;   // section label font size
    $fsTitle = 22;   // main title font size

    // ── Word-wrap helper for TTF ───────────────────────────────────────────
    function ttfWrap($text, $font, $size, $maxW) {
        if (!$font) return [$text];
        $words = explode(' ', $text);
        $lines = []; $cur = '';
        foreach ($words as $w) {
            $test = ($cur === '') ? $w : "$cur $w";
            $bb   = imagettfbbox($size, 0, $font, $test);
            $tw   = abs($bb[4] - $bb[0]);
            if ($tw > $maxW && $cur !== '') {
                $lines[] = $cur; $cur = $w;
            } else {
                $cur = $test;
            }
        }
        if ($cur !== '') $lines[] = $cur;
        return $lines ?: [''];
    }

    // ── Signature scaling ─────────────────────────────────────────────────
    preg_match('/viewBox="0 0 ([\d.]+) ([\d.]+)"/', $signature_data, $vb);
    $svgW    = isset($vb[1]) ? (float)$vb[1] : 320;
    $svgH    = isset($vb[2]) ? (float)$vb[2] : 120;
    $sigDstW = $contentW;
    $scale   = $sigDstW / $svgW;
    $sigDstH = max(100, (int)($svgH * $scale));

    // ── Clause definitions (skip for transient) ──────────────────────────
    $clauses = [];
    if (!$isTransient) {
        $clauses = [
            ["1. RENTAL PAYMENT",
             "The LESSEE agrees to pay the monthly rent of \xe2\x82\xb1{$rent} on or before the 5th day of each calendar month. Late payments are subject to penalties as agreed upon by both parties. Repeated failure to pay on time may be grounds for termination of this agreement."],
            ["2. SECURITY DEPOSIT",
             "A security deposit of \xe2\x82\xb1{$deposit} is required upon move-in. It shall be refunded within 30 days after the lease ends, less deductions for unpaid rent or damages beyond normal wear and tear. The deposit may not be applied as payment for the last month's rent without the LESSOR's written consent."],
            ["3. USE OF PREMISES",
             "The property shall be used exclusively as a private residential dwelling for a maximum of {$occupants} occupant(s). Commercial activities and subletting are strictly prohibited without written consent from the LESSOR. Any unauthorized use may result in immediate termination of this agreement."],
            ["4. MAINTENANCE & REPAIRS",
             "The LESSEE shall keep the property clean and in good condition throughout the duration of the tenancy. Damage caused by the LESSEE's negligence shall be repaired at the LESSEE's expense. Normal wear and tear is accepted and shall not be charged against the security deposit."],
            ["5. ALTERATIONS",
             "The LESSEE shall not make any structural alterations or modifications to the property without prior written consent from the LESSOR. Any approved alterations shall become part of the property and shall not be removed upon vacating unless otherwise agreed in writing."],
            ["6. TERMINATION",
             "Either party may terminate this agreement with a minimum of 30 days written notice prior to the intended date of termination. Early termination by the LESSEE without proper notice may result in forfeiture of the security deposit. The LESSOR reserves the right to terminate this agreement immediately in cases of material breach by the LESSEE."],
            ["7. COMPLIANCE",
             "The LESSEE shall comply with all applicable laws, local ordinances, and property rules throughout the lease period. Illegal activities on the premises are grounds for immediate termination of this agreement. The LESSEE shall also respect the rights and comfort of neighboring tenants and residents."],
        ];
    }

    // ── Create a tall canvas (will be cropped later) ──────────────────────
    $img = imagecreatetruecolor($cw, 3000);

    $cWhite = imagecolorallocate($img, 255, 255, 255);
    $cBlue  = imagecolorallocate($img, 29,  78,  216); // #1D4ED8
    $cBlueL = imagecolorallocate($img, 191, 219, 254); // #BFDBFE
    $cSlate = imagecolorallocate($img, 15,  23,  42);  // #0F172A near-black
    $cGray6 = imagecolorallocate($img, 100, 116, 139); // #64748B
    $cGray3 = imagecolorallocate($img, 226, 232, 240); // #E2E8F0 dividers
    $cLight = imagecolorallocate($img, 241, 245, 249); // #F1F5F9 section bg
    $cSigBg = imagecolorallocate($img, 248, 250, 252); // #F8FAFC sig bg
    $cInk   = imagecolorallocate($img, 26,  26,  26);

    imagefill($img, 0, 0, $cWhite);

    $y = 0;

    // ── HEADER ────────────────────────────────────────────────────────────
    $headerH = 100;
    imagefilledrectangle($img, 0, $y, $cw, $y + $headerH, $cBlue);
    if ($useTTF) {
        $bb = imagettfbbox($fsTitle, 0, $ttfB, "LEASE AGREEMENT");
        $tw = abs($bb[4] - $bb[0]);
        imagettftext($img, $fsTitle, 0, (int)(($cw - $tw) / 2), $y + 44, $cWhite, $ttfB, "LEASE AGREEMENT");
        $sub = "$ref  •  $today";
        $bb2 = imagettfbbox($fsSect, 0, $ttf, $sub);
        $tw2 = abs($bb2[4] - $bb2[0]);
        imagettftext($img, $fsSect, 0, (int)(($cw - $tw2) / 2), $y + 70, $cBlueL, $ttf, $sub);
    } else {
        $label1 = "LEASE AGREEMENT";
        $tw1 = imagefontwidth(5) * strlen($label1);
        imagestring($img, 5, (int)(($cw - $tw1) / 2), $y + 38, $label1, $cWhite);
        $label2 = "$ref  -  $today";
        $tw2 = imagefontwidth(3) * strlen($label2);
        imagestring($img, 3, (int)(($cw - $tw2) / 2), $y + 65, $label2, $cBlueL);
    }
    $y += $headerH;

    // ── PREAMBLE ──────────────────────────────────────────────────────────
    $preamble = "This Lease Agreement is entered into on {$today} between the LESSOR (Property Owner) and the LESSEE (Tenant) named below, for the property described herein.";
    imagefilledrectangle($img, 0, $y, $cw, $y + 2, $cGray3);
    $y += 2;
    imagefilledrectangle($img, 0, $y, $cw, $y + 60, $cLight);
    if ($useTTF) {
        $lines = ttfWrap($preamble, $ttf, $fs - 1, $contentW);
        $py = $y + 18;
        foreach ($lines as $ln) {
            imagettftext($img, $fs - 1, 0, $lp, $py, $cGray6, $ttf, $ln);
            $py += 20;
        }
    } else {
        imagestring($img, 3, $lp, $y + 18, $preamble, $cGray6);
    }
    $y += 60;
    imagefilledrectangle($img, 0, $y, $cw, $y + 1, $cGray3);
    $y += 1;

    // ── Helper: draw section header ────────────────────────────────────────
    function drawSecH(&$img, &$y, $title, $cw, $lp, $cBlue, $cGray3, $cLight, $useTTF, $ttf, $ttfB, $fsSect) {
        imagefilledrectangle($img, 0, $y, $cw, $y + 34, $cLight);
        if ($useTTF) {
            imagettftext($img, $fsSect, 0, $lp, $y + 22, $cBlue, $ttfB, strtoupper($title));
        } else {
            imagestring($img, 2, $lp, $y + 11, strtoupper($title), $cBlue);
        }
        imageline($img, 0, $y + 34, $cw, $y + 34, $cGray3);
        $y += 34;
    }

    // ── Helper: draw field row ─────────────────────────────────────────────
    function drawRow(&$img, &$y, $label, $value, $cw, $lp, $cSlate, $cGray6, $cGray3, $useTTF, $ttf, $ttfB, $fs) {
        if ($useTTF) {
            imagettftext($img, $fs - 2, 0, $lp,       $y + 20, $cGray6, $ttf,  $label);
            imagettftext($img, $fs - 1, 0, $lp + 190, $y + 20, $cSlate, $ttfB, $value);
        } else {
            imagestring($img, 2, $lp,       $y + 9, $label, $cGray6);
            imagestring($img, 3, $lp + 190, $y + 9, $value, $cSlate);
        }
        imageline($img, $lp, $y + 30, $cw - $lp, $y + 30, $cGray3);
        $y += 30;
    }

    // ── PARTIES ───────────────────────────────────────────────────────────
    drawSecH($img, $y, "PARTIES TO THE AGREEMENT", $cw, $lp, $cBlue, $cGray3, $cLight, $useTTF, $ttf, $ttfB, $fsSect);
    drawRow($img, $y, "LESSEE (Tenant)", $tenantName, $cw, $lp, $cSlate, $cGray6, $cGray3, $useTTF, $ttf, $ttfB, $fs);
    $y += 16;

    // ── SUBJECT PROPERTY ──────────────────────────────────────────────────
    drawSecH($img, $y, "SUBJECT PROPERTY", $cw, $lp, $cBlue, $cGray3, $cLight, $useTTF, $ttf, $ttfB, $fsSect);
    drawRow($img, $y, "Property Name", $propName, $cw, $lp, $cSlate, $cGray6, $cGray3, $useTTF, $ttf, $ttfB, $fs);
    drawRow($img, $y, "Address",       $propAddr, $cw, $lp, $cSlate, $cGray6, $cGray3, $useTTF, $ttf, $ttfB, $fs);
    $y += 16;

    // ── LEASE TERMS ───────────────────────────────────────────────────────
    drawSecH($img, $y, "LEASE TERMS", $cw, $lp, $cBlue, $cGray3, $cLight, $useTTF, $ttf, $ttfB, $fsSect);
    drawRow($img, $y, "Move-in Date",     $moveIn,           $cw, $lp, $cSlate, $cGray6, $cGray3, $useTTF, $ttf, $ttfB, $fs);
    drawRow($img, $y, "Lease Duration",   $duration,         $cw, $lp, $cSlate, $cGray6, $cGray3, $useTTF, $ttf, $ttfB, $fs);
    drawRow($img, $y, "Monthly Rent",     (string)"₱{$rent}",           $cw, $lp, $cSlate, $cGray6, $cGray3, $useTTF, $ttf, $ttfB, $fs);
    drawRow($img, $y, "Security Deposit", (string)"₱{$deposit}",        $cw, $lp, $cSlate, $cGray6, $cGray3, $useTTF, $ttf, $ttfB, $fs);
    drawRow($img, $y, "No. of Occupants", "{$occupants} person(s)", $cw, $lp, $cSlate, $cGray6, $cGray3, $useTTF, $ttf, $ttfB, $fs);
    $y += 16;

    // ── TERMS AND CONDITIONS (skip for transient) ────────────────────────
    if (!$isTransient) {
        drawSecH($img, $y, "TERMS AND CONDITIONS", $cw, $lp, $cBlue, $cGray3, $cLight, $useTTF, $ttf, $ttfB, $fsSect);
        $clauseBodyW = $contentW - 20;
        foreach ($clauses as $cl) {
            if ($useTTF) {
                imagettftext($img, $fs - 1, 0, $lp, $y + 18, $cSlate, $ttfB, $cl[0]);
                $bodyLines = ttfWrap($cl[1], $ttf, $fs - 2, $clauseBodyW);
                $by = $y + 18;
                foreach ($bodyLines as $bl) {
                    $by += 19;
                    imagettftext($img, $fs - 2, 0, $lp + 20, $by, $cGray6, $ttf, $bl);
                }
                $y = $by + 16;
            } else {
                imagestring($img, 3, $lp, $y + 8, $cl[0], $cSlate);
                $y += 22;
                $bodyChunks = explode("\n", wordwrap($cl[1], 118, "\n", true));
                foreach ($bodyChunks as $bl) {
                    imagestring($img, 2, $lp + 20, $y, $bl, $cGray6);
                    $y += 15;
                }
                $y += 8;
            }
        }
        $y += 16;
    }
    imagefilledrectangle($img, 0, $y, $cw, $y + 1, $cGray3);
    $y += 1;

    // ── SIGNATURE LABEL BAR ───────────────────────────────────────────────
    $sigBarH = 50;
    imagefilledrectangle($img, 0, $y, $cw, $y + $sigBarH, $cLight);
    imageline($img, 0, $y,              $cw, $y,             $cGray3);
    imageline($img, 0, $y + $sigBarH,   $cw, $y + $sigBarH, $cGray3);
    $sigLabel = "TENANT'S DIGITAL SIGNATURE";
    if ($useTTF) {
        $bb = imagettfbbox($fsSect, 0, $ttfB, $sigLabel);
        $tw = abs($bb[4] - $bb[0]);
        imagettftext($img, $fsSect, 0, (int)(($cw - $tw) / 2), $y + 30, $cBlue, $ttfB, $sigLabel);
    } else {
        $tw = imagefontwidth(3) * strlen($sigLabel);
        imagestring($img, 3, (int)(($cw - $tw) / 2), $y + 18, $sigLabel, $cBlue);
    }
    $y += $sigBarH;

    // ── SIGNATURE AREA ────────────────────────────────────────────────────
    $sigImg = imagecreatetruecolor($sigDstW, $sigDstH);
    $sigBg2 = imagecolorallocate($sigImg, 248, 250, 252);
    $sigInk = imagecolorallocate($sigImg, 26,  26,  26);
    imagefill($sigImg, 0, 0, $sigBg2);

    preg_match_all('/ d="([^"]+)"/', $signature_data, $pathMatches);
    foreach ($pathMatches[1] as $d) {
        preg_match_all('/([ML])\s+([\d.+-]+)\s+([\d.+-]+)/', $d, $cmds, PREG_SET_ORDER);
        $px = null; $py2 = null;
        foreach ($cmds as $cmd) {
            $x  = (float)$cmd[2] * $scale;
            $ye = (float)$cmd[3] * $scale;
            if ($cmd[1] === 'L' && $px !== null) {
                for ($t = -1; $t <= 1; $t++) {
                    imageline($sigImg, (int)($px + $t), (int)$py2, (int)($x + $t), (int)$ye, $sigInk);
                    imageline($sigImg, (int)$px, (int)($py2 + $t), (int)$x, (int)($ye + $t), $sigInk);
                }
            }
            $px = $x; $py2 = $ye;
        }
    }

    imagecopy($img, $sigImg, $lp, $y, 0, 0, $sigDstW, $sigDstH);
    imagerectangle($img, $lp, $y, $lp + $sigDstW, $y + $sigDstH, $cGray3);
    imagedestroy($sigImg);

    // ── Save signature-only image (large, clear — for owner review) ───────
    $soW     = 800;
    $soH     = 300;
    $soImg   = imagecreatetruecolor($soW, $soH);
    $soBg    = imagecolorallocate($soImg, 255, 255, 255);
    $soInk   = imagecolorallocate($soImg, 26,  26,  26);
    $soGrid  = imagecolorallocate($soImg, 226, 232, 240);
    imagefill($soImg, 0, 0, $soBg);
    // light horizontal guideline
    imageline($soImg, 20, (int)($soH * 0.72), $soW - 20, (int)($soH * 0.72), $soGrid);

    $pad     = 28;
    $soSX    = ($soW - $pad * 2) / $svgW;
    $soSY    = ($soH - $pad * 2) / $svgH;
    $soScale = min($soSX, $soSY);
    $soXOff  = (int)(($soW - $svgW * $soScale) / 2);
    $soYOff  = (int)(($soH - $svgH * $soScale) / 2);

    foreach ($pathMatches[1] as $d) {
        preg_match_all('/([ML])\s+([\d.+-]+)\s+([\d.+-]+)/', $d, $soCmds, PREG_SET_ORDER);
        $sox = null; $soy = null;
        foreach ($soCmds as $cmd) {
            $x2  = (float)$cmd[2] * $soScale + $soXOff;
            $ye2 = (float)$cmd[3] * $soScale + $soYOff;
            if ($cmd[1] === 'L' && $sox !== null) {
                for ($t = -1; $t <= 1; $t++) {
                    imageline($soImg, (int)($sox + $t), (int)$soy,  (int)($x2 + $t), (int)$ye2, $soInk);
                    imageline($soImg, (int)$sox, (int)($soy + $t),  (int)$x2, (int)($ye2 + $t), $soInk);
                }
            }
            $sox = $x2; $soy = $ye2;
        }
    }
    imagerectangle($soImg, 0, 0, $soW - 1, $soH - 1, $soGrid);
    imagejpeg($soImg, $svgDir . "sig_only_{$booking_id}.jpg", 95);
    imagedestroy($soImg);

    $y += $sigDstH + 40;

    // ── CROP to actual content height ─────────────────────────────────────
    if (function_exists('imagecrop')) {
        $cropped = imagecrop($img, ['x' => 0, 'y' => 0, 'width' => $cw, 'height' => $y]);
        if ($cropped !== false) {
            imagedestroy($img);
            $img = $cropped;
        }
    }

    // ── SAVE composite JPG ────────────────────────────────────────────────
    $signedDir = __DIR__ . '/uploads/signed_contracts/';
    if (!is_dir($signedDir)) mkdir($signedDir, 0775, true);

    $signedName = "signed_{$booking_id}_" . time() . ".jpg";
    if (imagejpeg($img, $signedDir . $signedName, 92)) {
        $finalPath = "uploads/signed_contracts/{$signedName}";
    }
    imagedestroy($img);
}

// ── 3. Update DB ─────────────────────────────────────────────────────────────
$stmt = $conn->prepare("UPDATE bookings SET tenant_signature = ?, contract_status = 'submitted' WHERE id = ? AND tenant_id = ?");
$stmt->bind_param("sii", $finalPath, $booking_id, $tenant_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode([
        "status"     => "success",
        "message"    => "Signature submitted successfully",
        "path"       => $finalPath,
        "composited" => ($finalPath !== $svgPath),
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to update booking"]);
}

$stmt->close();
$conn->close();
?>
