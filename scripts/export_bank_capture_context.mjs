// Create a sandbox session only. Does not submit a card or charge a payment.
import { readFile, mkdir, writeFile, chmod } from 'node:fs/promises';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { parseEnv } from 'node:util';
import { resolve } from 'node:path';

const config = parseEnv(await readFile(new URL('../.env', import.meta.url), 'utf8'));
const host = 'apitest.cybersource.com';
if (config.CYBERSOURCE_BASE_URL !== `https://${host}`) throw new Error('Sandbox configuration required');
for (const key of ['CYBERSOURCE_MERCHANT_ID', 'CYBERSOURCE_KEY_ID', 'CYBERSOURCE_SECRET_KEY']) {
  if (!config[key]) throw new Error(`Missing ${key}`);
}
const path = '/uc/v1/sessions';
const reference = `MC-BANK-3DS-${randomUUID().slice(0, 8).toUpperCase()}`;
const request = {
  targetOrigins: ['https://maiecouture.com'],
  ...(config.CYBERSOURCE_CLIENT_VERSION ? { clientVersion: config.CYBERSOURCE_CLIENT_VERSION } : {}),
  allowedCardNetworks: ['VISA', 'MASTERCARD'], allowedPaymentTypes: ['PANENTRY'],
  country: 'US', locale: 'en_US', buttonType: 'CHECKOUT',
  captureMandate: { billingType: 'FULL', requestEmail: false, requestPhone: false, requestShipping: false, showConfirmationStep: false },
  completeMandate: { type: 'CAPTURE', consumerAuthentication: '3DS', decisionManager: true },
  data: {
    orderInformation: {
      amountDetails: { totalAmount: '21.00', currency: 'USD' },
      billTo: {
        firstName: 'Sandbox', lastName: 'Review', address1: '1 Market Street', address2: 'Suite 2',
        locality: 'San Francisco', administrativeArea: 'CA', postalCode: '94105', country: 'US',
        email: 'bank-review@example.com', phoneNumber: '+14155550123',
      },
    },
    clientReferenceInformation: { code: reference },
  },
};
const body = JSON.stringify(request);
const date = new Date().toUTCString();
const digest = `SHA-256=${createHash('sha256').update(body).digest('base64')}`;
const signed = `host: ${host}\ndate: ${date}\nrequest-target: post ${path}\ndigest: ${digest}\nv-c-merchant-id: ${config.CYBERSOURCE_MERCHANT_ID}`;
const signature = createHmac('sha256', Buffer.from(config.CYBERSOURCE_SECRET_KEY, 'base64')).update(signed).digest('base64');
const response = await fetch(`https://${host}${path}`, {
  method: 'POST', signal: AbortSignal.timeout(30000),
  headers: {
    'Content-Type': 'application/json', Date: date, Digest: digest,
    'v-c-merchant-id': config.CYBERSOURCE_MERCHANT_ID,
    Signature: `keyid="${config.CYBERSOURCE_KEY_ID}", algorithm="HmacSHA256", headers="host date request-target digest v-c-merchant-id", signature="${signature}"`,
  }, body,
});
const responseBody = await response.text();
const directory = resolve('tmp/bank-review-2026-11-10');
await mkdir(directory, { recursive: true, mode: 0o700 });
await chmod(directory, 0o700);
const output = resolve(directory, 'capture-context-request-response.txt');
await writeFile(output, [
  'MAIE COUTURE - CYBERSOURCE SANDBOX CAPTURE CONTEXT',
  `Requested at: ${date}`, `Reference: ${reference}`,
  'Session creation test with synthetic billing data; no card submitted and no payment completed.',
  'Authentication credentials and signature headers are excluded.', '',
  `POST https://${host}${path}`, 'Content-Type: application/json', '',
  'REQUEST BODY (exact bytes sent)', body, '',
  `RESPONSE HTTP STATUS: ${response.status}`, 'RESPONSE BODY (as received)', responseBody, '',
].join('\n'), { mode: 0o600 });
await chmod(output, 0o600);
console.log(JSON.stringify({ sandbox: true, reference, http: response.status, output, responseBytes: Buffer.byteLength(responseBody) }));
if (!response.ok) process.exitCode = 1;
