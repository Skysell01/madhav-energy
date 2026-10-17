/**
 * ==============================================================================
 * MADHAVBAUG ENERGY & FOCUS™ - GOOGLE APPS SCRIPT WEBHOOK CODE
 * ==============================================================================
 * Setup Steps:
 * 1. Open your Google Sheet where you want to collect leads/orders.
 * 2. Click "Extensions" (एक्सटेंशन) -> "Apps Script".
 * 3. Delete any default code and paste this entire code.
 * 4. Click "Save" (सेव).
 * 5. Click "Deploy" (डिप्लॉय) -> "New deployment" (नया डिप्लॉयमेंट).
 * 6. Under 'Select type' (गियर आइकन), choose "Web app".
 * 7. Set Description: "Madhavbaug Energy & Focus Leads Webhook".
 * 8. "Execute as": Choose "Me" (आपका ईमेल).
 * 9. "Who has access": Choose "Anyone" (जरूरी: Anyone चुनना है ताकि फॉर्म डेटा आ सके).
 * 10. Click "Deploy" and Authorize Google Permissions.
 * 11. Copy the "Web App URL" (ends with /exec) and send it here.
 * ==============================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // 10 seconds lock to prevent race conditions during high traffic
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rawData = e.postData.contents;
    var data;

    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      data = e.parameter;
    }

    // Auto-create Header Row if Sheet is blank
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp (तारीख व समय)",
        "Order ID (ऑर्डर नंबर)",
        "Name (ग्राहक का नाम)",
        "Contact Number (मोबाइल नंबर)",
        "Delivery Address (पता)",
        "City (शहर)",
        "State (राज्य)",
        "Pincode (पिनकोड)",
        "Selected Package (पैकेज)",
        "Price (कीमत)",
        "Payment Mode (भुगतान मोड)",
        "Source Page URL (पेज लिंक)"
      ]);

      // Style header row
      var headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setBackground("#E11D48"); // Energy Berry color
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // Extract lead fields
    var timestamp = data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    var orderId = data.orderId || ("MDB-NRG-" + Math.floor(10000 + Math.random() * 90000));
    var name = data.name || "";
    var contact = data.contact || data.phone || "";
    var address = data.address || "-";
    var city = data.city || "-";
    var state = data.state || "-";
    var pincode = data.pincode || "-";
    var packageTitle = data.package || "-";
    var price = data.price || "-";
    var paymentMode = data.paymentMode || "Cash On Delivery (COD)";
    var pageUrl = data.pageUrl || "-";

    // Format contact with leading apostrophe so Google Sheets doesn't strip zero or format as scientific notation
    var contactFormatted = "'" + contact;

    // Append new lead row
    sheet.appendRow([
      timestamp,
      orderId,
      name,
      contactFormatted,
      address,
      city,
      state,
      pincode,
      packageTitle,
      price,
      paymentMode,
      pageUrl
    ]);

    // Return success JSON
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", orderId: orderId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "active", message: "Madhavbaug Energy & Focus Webhook is Live!" }))
    .setMimeType(ContentService.MimeType.JSON);
}
