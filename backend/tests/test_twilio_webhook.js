const http = require('http');

const data = new URLSearchParams({
    From: 'whatsapp:+918128152039',
    Body: 'balance'
}).toString();

const options = {
    hostname: 'localhost',
    port: 5002,
    path: '/api/webhooks/whatsapp',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', chunk => console.log(`BODY: ${chunk}`));
});

req.on('error', e => console.error(`Error: ${e.message}`));
req.write(data);
req.end();
