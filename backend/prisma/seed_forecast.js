const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Find the primary user (the one we fixed the GigScore for recently, or just the first user)
    let user = await prisma.user.findFirst({
        orderBy: { gigScore: 'desc' }
    });

    if (!user) {
        console.error('No users found in database. Please register a user first.');
        process.exit(1);
    }

    console.log(`Starting forecast seed for user: ${user.name || user.phone} (${user.id})`);

    // Path to the CSV file
    const csvPath = path.join(__dirname, '../data/sample_earnings_60days.csv');
    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found at ${csvPath}`);
        process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    let insertedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;

        const row = {};
        headers.forEach((h, index) => {
            row[h] = values[index];
        });

        const dateStr = row['date'];
        const dt = new Date(dateStr);
        if (isNaN(dt.getTime())) {
            console.warn(`Skipping invalid date row ${i}: ${row['date']}`);
            continue;
        }

        const net = parseFloat(row['net_earnings']) || 0;
        const inc = parseFloat(row['incentives_earned']) || 0;
        const total = net + inc;

        await prisma.forecastData.upsert({
            where: {
                userId_date: {
                    userId: user.id,
                    date: dt,
                }
            },
            update: {
                worked: parseInt(row['worked']) || 0,
                rainfallMm: parseFloat(row['rainfall_mm']) || 0,
                tempCelsius: parseFloat(row['temp_celsius']) || 0,
                averageRating: parseFloat(row['average_rating']) || 0,
                incentivesEarned: inc,
                netEarnings: net,
                efficiencyRatio: parseFloat(row['efficiency_ratio']) || 0,
                totalEarnings: total,
            },
            create: {
                userId: user.id,
                date: dt,
                worked: parseInt(row['worked']) || 0,
                rainfallMm: parseFloat(row['rainfall_mm']) || 0,
                tempCelsius: parseFloat(row['temp_celsius']) || 0,
                averageRating: parseFloat(row['average_rating']) || 0,
                incentivesEarned: inc,
                netEarnings: net,
                efficiencyRatio: parseFloat(row['efficiency_ratio']) || 0,
                totalEarnings: total,
            }
        });

        insertedCount++;
    }

    console.log(`✅ successfully seeded ${insertedCount} forecast_data rows formatted via the ML CSV.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
