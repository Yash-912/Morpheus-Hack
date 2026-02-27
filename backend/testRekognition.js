const fs = require('fs');
const { rekognitionClient } = require('./config/aws');
const { IndexFacesCommand, DetectFacesCommand } = require('@aws-sdk/client-rekognition');
require('dotenv').config();

const COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID || 'gigpay-faces-dev';

async function testRekognition() {
    const imageBuffer = fs.readFileSync('./test-photo.jpg');

    console.log('1. Testing DetectFaces (Liveness equivalent)...');
    try {
        const detectCommand = new DetectFacesCommand({
            Image: { Bytes: imageBuffer },
            Attributes: ['ALL'],
        });
        const detectResult = await rekognitionClient.send(detectCommand);
        console.log(`Found ${detectResult.FaceDetails?.length} faces.`);
        if (detectResult.FaceDetails?.length > 0) {
            console.log('Face 1 EyesOpen:', detectResult.FaceDetails[0].EyesOpen);
            console.log('Face 1 Confidence:', detectResult.FaceDetails[0].Confidence);
        }
    } catch (err) {
        console.error('DetectFaces Error:', err);
    }

    console.log('\n2. Testing IndexFaces (Enrollment equivalent)...');
    try {
        const indexCommand = new IndexFacesCommand({
            CollectionId: COLLECTION_ID,
            Image: { Bytes: imageBuffer },
            ExternalImageId: 'test-user',
            DetectionAttributes: ['ALL'],
            MaxFaces: 1, // Only index the largest face
            QualityFilter: 'AUTO',
        });
        const indexResult = await rekognitionClient.send(indexCommand);
        console.log(`Indexed ${indexResult.FaceRecords?.length} faces.`);
    } catch (err) {
        console.error('IndexFaces Error:', err);
    }
}

testRekognition();
