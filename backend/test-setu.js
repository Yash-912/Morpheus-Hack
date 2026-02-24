require('dotenv').config();
const axios = require('axios');

const SETU_API_URL = process.env.SETU_API_URL || 'https://dg-sandbox.setu.co';
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_PRODUCT_INSTANCE_ID = process.env.SETU_PRODUCT_INSTANCE_ID;

const client = axios.create({
    baseURL: SETU_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'x-client-id': SETU_CLIENT_ID,
        'x-client-secret': SETU_CLIENT_SECRET,
        'x-product-instance-id': SETU_PRODUCT_INSTANCE_ID
    },
});

async function test() {
    const id = "8f492ac8-9c8a-4de3-be9c-ed8aee7a6226"; // From user's log
    const path = `/api/digilocker/${id}/document`;

    const payloadsToTest = [
        { docType: "ADHAR", format: "json" }
    ];

    for (const payload of payloadsToTest) {
        console.log(`\nTesting POST ${path} with payload:`, payload);
        try {
            const res = await client.post(path, payload);
            console.log(`✅ SUCCESS [${res.status}]:`, JSON.stringify(res.data).substring(0, 300)); // Only print a bit
            break;
        } catch (err) {
            console.log(`❌ FAILED [${err.response?.status || 'Unknown'}]:`, err.response?.data?.error?.detail || err.response?.data || err.message);
        }
    }
}

test();
