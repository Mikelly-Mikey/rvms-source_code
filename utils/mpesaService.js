const axios = require('axios');

// M-Pesa (Safaricom Daraja) helper.
//
// Two modes, controlled by MPESA_MODE:
//   - 'simulation' (default): no real Safaricom credentials needed. An STK push is
//     recorded as pending and the Safaricom callback is emulated by POSTing to our
//     own callback URL after a short delay, mimicking the real Daraja flow.
//   - 'sandbox': performs a real Daraja sandbox STK push using the configured
//     credentials (MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE,
//     MPESA_PASSKEY). Safaricom then calls MPESA_CALLBACK_URL directly.
//
// In both modes the rest of the app only deals with our normalized callback shape,
// so switching to a real integration later requires no controller changes.

const MODE = (process.env.MPESA_MODE || 'simulation').toLowerCase();
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY || '';
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const BASE_URL = process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const CALLBACK_URL =
  process.env.MPESA_CALLBACK_URL || `${APP_URL}/payments/mpesa/callback`;
// How long the simulated customer "takes" to enter their PIN, in ms.
const SIM_DELAY_MS = parseInt(process.env.MPESA_SIM_DELAY_MS || '4000', 10);

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function randomId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${rand}`;
}

function generateReceipt() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Normalize a Kenyan phone number to the 2547XXXXXXXX format Daraja expects.
function normalizePhone(phone) {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('0')) p = `254${p.slice(1)}`;
  else if (p.startsWith('7') || p.startsWith('1')) p = `254${p}`;
  else if (p.startsWith('254')) p = p;
  return p;
}

function isValidPhone(phone) {
  return /^254[17]\d{8}$/.test(normalizePhone(phone));
}

// --- Sandbox (real Daraja) helpers -----------------------------------------

async function getAccessToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const { data } = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return data.access_token;
}

async function sandboxStkPush({ phone, amount, accountRef, description }) {
  const token = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${ts}`).toString('base64');
  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: normalizePhone(phone),
      PartyB: SHORTCODE,
      PhoneNumber: normalizePhone(phone),
      CallBackURL: CALLBACK_URL,
      AccountReference: accountRef,
      TransactionDesc: description || 'RVMS Payment'
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    customerMessage: data.CustomerMessage
  };
}

// --- Simulation helpers ----------------------------------------------------

// Emulate Safaricom calling our callback URL after the customer acts.
function scheduleSimulatedCallback({ merchantRequestId, checkoutRequestId, amount, phone }) {
  setTimeout(async () => {
    const succeeds = true; // happy-path simulation; failures can be forced via the UI
    const body = {
      Body: {
        stkCallback: {
          MerchantRequestID: merchantRequestId,
          CheckoutRequestID: checkoutRequestId,
          ResultCode: succeeds ? 0 : 1032,
          ResultDesc: succeeds
            ? 'The service request is processed successfully.'
            : 'Request cancelled by user',
          CallbackMetadata: succeeds
            ? {
                Item: [
                  { Name: 'Amount', Value: Math.round(amount) },
                  { Name: 'MpesaReceiptNumber', Value: generateReceipt() },
                  { Name: 'PhoneNumber', Value: Number(normalizePhone(phone)) },
                  { Name: 'TransactionDate', Value: Number(timestamp()) }
                ]
              }
            : undefined
        }
      }
    };
    try {
      await axios.post(CALLBACK_URL, body, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Simulated M-Pesa callback failed:', err.message);
    }
  }, SIM_DELAY_MS);
}

// Public: initiate an STK push. Returns identifiers used to track the request.
async function initiateStkPush({ phone, amount, accountRef, description }) {
  if (!isValidPhone(phone)) {
    throw new Error('Invalid phone number. Use format 07XXXXXXXX or 2547XXXXXXXX.');
  }
  const normalizedPhone = normalizePhone(phone);

  if (MODE === 'sandbox') {
    const result = await sandboxStkPush({
      phone: normalizedPhone,
      amount,
      accountRef,
      description
    });
    return { ...result, phone: normalizedPhone, simulated: false };
  }

  // simulation mode
  const merchantRequestId = randomId('SIM-MR');
  const checkoutRequestId = randomId('SIM-CR');
  scheduleSimulatedCallback({
    merchantRequestId,
    checkoutRequestId,
    amount,
    phone: normalizedPhone
  });
  return {
    merchantRequestId,
    checkoutRequestId,
    phone: normalizedPhone,
    customerMessage:
      'Success. An STK push has been sent to the phone (simulated). ' +
      'Awaiting confirmation...',
    simulated: true
  };
}

// Public: parse Safaricom's (or our simulated) callback into a normalized result.
function parseCallback(body) {
  const cb = body && body.Body && body.Body.stkCallback;
  if (!cb) return null;
  const result = {
    merchantRequestId: cb.MerchantRequestID,
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: cb.ResultCode,
    resultDesc: cb.ResultDesc,
    success: cb.ResultCode === 0,
    amount: null,
    receipt: null,
    phone: null,
    transactionDate: null
  };
  const items =
    cb.CallbackMetadata && Array.isArray(cb.CallbackMetadata.Item)
      ? cb.CallbackMetadata.Item
      : [];
  items.forEach((item) => {
    switch (item.Name) {
      case 'Amount':
        result.amount = item.Value;
        break;
      case 'MpesaReceiptNumber':
        result.receipt = item.Value;
        break;
      case 'PhoneNumber':
        result.phone = item.Value;
        break;
      case 'TransactionDate':
        result.transactionDate = item.Value;
        break;
      default:
        break;
    }
  });
  return result;
}

module.exports = {
  MODE,
  initiateStkPush,
  parseCallback,
  normalizePhone,
  isValidPhone
};
