const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testImport() {
    try {
        const xmlPath = path.join(__dirname, 'test_import.xml');
        const xmlData = fs.readFileSync(xmlPath, 'utf8');

        console.log('Sending import request...');
        const response = await axios.post('http://localhost:3001/api/import/clients', {
            xmlData
        });

        console.log('Response:', response.data);
    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

testImport();
