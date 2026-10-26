const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Cutoff = require('./model/cutoffSchema');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/MahaEngineeringCET';
const jsonFolder = './json';

async function seedDatabase() {
    try {
        console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB successfully.');

        const files = fs.readdirSync(jsonFolder)
            .filter(f => f.endsWith('.json') && !f.includes('failed'))
            .sort();

        console.log(`Found ${files.length} cutoff files to import.`);

        for (const file of files) {
            const filePath = path.join(jsonFolder, file);
            console.log(`Importing: ${file} ...`);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            // Upsert based on academic_year and round
            await Cutoff.findOneAndUpdate(
                { academic_year: data.academic_year, round: data.round },
                data,
                { upsert: true, new: true }
            );

            console.log(`✓ Imported ${file} (${data.total_records} records)`);
        }

        console.log('\nAll cutoff documents successfully seeded into MongoDB!');
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

seedDatabase();
