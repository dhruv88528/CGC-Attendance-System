const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system';

async function clearDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();

        console.log(`Found ${collections.length} collections to drop:`);

        for (const collection of collections) {
            console.log(`  - Dropping: ${collection.name}`);
            await mongoose.connection.db.dropCollection(collection.name);
        }

        console.log('\n✅ All collections dropped successfully!');
        console.log('Database is now empty and ready for fresh data.');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

clearDatabase();