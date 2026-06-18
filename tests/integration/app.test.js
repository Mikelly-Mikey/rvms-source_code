const request = require('supertest');

describe('RVMS integration', () => {
  let app;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = require('../../server');
    await new Promise((resolve) => setTimeout(resolve, 1500));
  });

  test('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('GET / redirects unauthenticated users to login', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/);
  });

  test('GET /login renders login page', async () => {
    const res = await request(app).get('/login');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/login|Login|RVMS/i);
  });
});

describe('invoiceGenerator', () => {
  test('generateInvoiceData rejects missing booking', async () => {
    const { generateInvoiceData } = require('../../utils/invoiceGenerator');
    await expect(generateInvoiceData(999999)).rejects.toThrow('Booking not found');
  });
});
