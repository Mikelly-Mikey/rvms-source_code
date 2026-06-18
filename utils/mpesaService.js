const axios = require("axios");
require("dotenv").config();

/**
 * Validates a Kenyan phone number format.
 * Supports 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX
 */
function isValidPhone(phone) {
  const re = /^(?:254|\+254|0)?([71][0-9]{8})$/;
  return re.test(phone);
}

/**
 * Formats phone number to 2547XXXXXXXX format required by Safaricom
 */
function formatPhone(phone) {
  const re = /^(?:254|\+254|0)?([71][0-9]{8})$/;
  const match = phone.match(re);
  return match ? `254${match[1]}` : phone;
}

/**
 * Generates an OAuth access token from Safaricom Daraja API
 */
async function getAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const url = `${process.env.MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64",
  );

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
    });
    return response.data.access_token;
  } catch (error) {
    console.error(
      "M-Pesa Access Token Error:",
      error.response ? error.response.data : error.message,
    );
    throw new Error("Failed to authenticate with M-Pesa");
  }
}

/**
 * Initiates an M-Pesa STK Push (Lipa Na M-Pesa Online)
 */
async function initiateStkPush({ phone, amount, accountRef, description }) {
  const formattedPhone = formatPhone(phone);
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const shortCode = process.env.MPESA_SHORTCODE || "174379";
  const passkey = process.env.MPESA_PASSKEY;

  // Simulation Mode logic
  if (process.env.MPESA_MODE === "simulation") {
    console.log(
      `[M-PESA SIMULATOR] Initiating KES ${amount} STK Push for ${formattedPhone}`,
    );
    const checkoutRequestId = `ws_sim_${Math.random().toString(36).substring(2, 10)}`;

    return {
      success: true,
      simulated: true,
      checkoutRequestId,
      merchantRequestId: `sim_m_id_${Date.now()}`,
      phone: formattedPhone,
      customerMessage: "Success. Request accepted for processing (SIMULATED)",
    };
  }

  // Sandbox/Production Mode logic
  const accessToken = await getAccessToken();
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString(
    "base64",
  );
  const url = `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/query`;

  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: shortCode,
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountRef,
    TransactionDesc: description,
  };

  try {
    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    return {
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      phone: formattedPhone,
      customerMessage: response.data.CustomerMessage,
    };
  } catch (error) {
    console.error(
      "M-Pesa STK Push Error:",
      error.response ? error.response.data : error.message,
    );
    throw new Error(
      error.response?.data?.errorMessage || "M-Pesa STK push failed",
    );
  }
}

/**
 * Parses the callback data from Safaricom M-Pesa
 */
function parseCallback(body) {
  if (!body || !body.Body || !body.Body.stkCallback) {
    return null;
  }

  const callback = body.Body.stkCallback;
  const result = {
    checkoutRequestId: callback.CheckoutRequestID,
    merchantRequestId: callback.MerchantRequestID,
    resultCode: callback.ResultCode,
    resultDesc: callback.ResultDesc,
    success: callback.ResultCode === 0,
    receipt: null,
  };

  if (
    result.success &&
    callback.CallbackMetadata &&
    callback.CallbackMetadata.Item
  ) {
    const metadata = callback.CallbackMetadata.Item;
    const receiptItem = metadata.find(
      (item) => item.Name === "MpesaReceiptNumber",
    );
    if (receiptItem) {
      result.receipt = receiptItem.Value;
    }
  }

  return result;
}

module.exports = {
  isValidPhone,
  initiateStkPush,
  parseCallback,
};
