require('dotenv').config();
const { prisma } = require('./config/database');
const CopilotService = require('./services/copilot.service');

async function testCopilot() {
    console.log('--- GIG COPILOT TEST SCRIPT ---');
    try {
        // 1. Move your demo user to the Hot Zone center so they are within 5km
        // Using phone +918425930564 from the earlier webhook logs
        await prisma.user.updateMany({
            where: { phone: '+918425930564' },
            data: {
                homeLat: 19.0761,
                homeLng: 72.8778,
                whatsappOptIn: true,
                isActive: true
            }
        });
        console.log('✅ Demo user location updated to be inside the ML surging Hot Zone.');

        // 2. Trigger the cron job logic manually
        const result = await CopilotService.checkHotZonesAndAlert();
        console.log('\nCopilot Result:', result);

        console.log('\n✅ Test complete! Check your WhatsApp.');
    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testCopilot();
