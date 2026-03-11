#!/usr/bin/env pwsh

Write-Host "=== Email Server Endpoint Tests ===" -ForegroundColor Cyan
Write-Host ""

$testResults = @{passed = @(); failed = @()}
$testSubject = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
$testEmail = "testuser@example.com"

# Test 1: Send email via SMTP
Write-Host "Test 1: Send email via SMTP..." -NoNewline
try {
    $output = node -e "
        const nodemailer = require('nodemailer');
        const t = nodemailer.createTransport({
            host: 'localhost',
            port: 2525,
            secure: false,
            ignoreTLS: true
        });
        t.sendMail({
            from: 'alice@example.com',
            to: '$testEmail',
            subject: '$testSubject',
            text: 'automated test email'
        })
        .then(info => console.log('success'))
        .catch(err => {
            console.error(err.message);
            process.exit(1);
        });
    " 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " PASS" -ForegroundColor Green
        $testResults.passed += "SMTP: Send email"
    } else {
        Write-Host " FAIL" -ForegroundColor Red
        $testResults.failed += "SMTP: Send email - $output"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $testResults.failed += "SMTP: Send email - $($_.Exception.Message)"
}

Start-Sleep -Seconds 2

# Test 2: GET /inbox/:email
Write-Host "Test 2: GET /inbox/$testEmail..." -NoNewline
try {
    $inbox = Invoke-RestMethod -Uri "http://localhost:3000/inbox/$testEmail" -Method Get -ErrorAction Stop
    if ($inbox.success -and $inbox.count -gt 0) {
        Write-Host " PASS (found $($inbox.count) emails)" -ForegroundColor Green
        $testResults.passed += "GET /inbox/:email"
    } else {
        Write-Host " FAIL (empty inbox)" -ForegroundColor Red
        $testResults.failed += "GET /inbox/:email - inbox empty"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $testResults.failed += "GET /inbox/:email - $($_.Exception.Message)"
}

# Test 3: Find email by subject
Write-Host "Test 3: Find email by subject..." -NoNewline
try {
    $testMail = $inbox.data | Where-Object { $_.subject -eq $testSubject } | Select-Object -First 1
    if ($testMail) {
        Write-Host " PASS (ID: $($testMail._id))" -ForegroundColor Green
        $testResults.passed += "Find email in inbox"
        $mailId = $testMail._id
    } else {
        Write-Host " FAIL (not found)" -ForegroundColor Red
        $testResults.failed += "Find email - subject not found in inbox"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $testResults.failed += "Find email - $($_.Exception.Message)"
}

# Test 4: GET /mail/:id
Write-Host "Test 4: GET /mail/$mailId..." -NoNewline
try {
    $mail = Invoke-RestMethod -Uri "http://localhost:3000/mail/$mailId" -Method Get -ErrorAction Stop
    if ($mail.subject -eq $testSubject) {
        Write-Host " PASS" -ForegroundColor Green
        Write-Host "        Subject: $($mail.subject)"
        Write-Host "        From: $($mail.from)"
        Write-Host "        To: $($mail.to)"
        $testResults.passed += "GET /mail/:id"
    } else {
        Write-Host " FAIL (wrong email)" -ForegroundColor Red
        $testResults.failed += "GET /mail/:id - wrong subject"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $testResults.failed += "GET /mail/:id - $($_.Exception.Message)"
}

# Test 5: DELETE /mail/:id
Write-Host "Test 5: DELETE /mail/$mailId..." -NoNewline
try {
    $deleted = Invoke-RestMethod -Uri "http://localhost:3000/mail/$mailId" -Method Delete -ErrorAction Stop
    if ($deleted.message -eq "Email deleted successfully") {
        Write-Host " PASS" -ForegroundColor Green
        $testResults.passed += "DELETE /mail/:id"
    } else {
        Write-Host " FAIL" -ForegroundColor Red
        $testResults.failed += "DELETE /mail/:id - unexpected response"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $testResults.failed += "DELETE /mail/:id - $($_.Exception.Message)"
}

# Test 6: Verify 404 after delete
Write-Host "Test 6: GET /mail/$mailId after delete (expect 404)..." -NoNewline
try {
    Invoke-RestMethod -Uri "http://localhost:3000/mail/$mailId" -Method Get -ErrorAction Stop
    Write-Host " FAIL (expected 404)" -ForegroundColor Red
    $testResults.failed += "GET after DELETE - did not return 404"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host " PASS (404)" -ForegroundColor Green
        $testResults.passed += "GET /mail/:id returns 404 after delete"
    } else {
        Write-Host " FAIL (status: $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
        $testResults.failed += "GET after DELETE - wrong status"
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $($testResults.passed.Count)" -ForegroundColor Green
Write-Host "Failed: $($testResults.failed.Count)" -ForegroundColor $(if ($testResults.failed.Count -eq 0) { 'Green' } else { 'Red' })

if ($testResults.passed.Count -gt 0) {
    Write-Host ""
    Write-Host "Passed tests:" -ForegroundColor Green
    $testResults.passed | ForEach-Object { Write-Host "  [PASS] $_" }
}

if ($testResults.failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Failed tests:" -ForegroundColor Red
    $testResults.failed | ForEach-Object { Write-Host "  [FAIL] $_" }
}

Write-Host ""
$exitCode = if ($testResults.failed.Count -eq 0) { 0 } else { 1 }
Write-Host "Exit code: $exitCode" -ForegroundColor $(if ($exitCode -eq 0) { 'Green' } else { 'Red' })
exit $exitCode
