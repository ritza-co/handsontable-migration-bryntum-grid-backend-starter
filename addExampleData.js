import { readFileSync } from 'fs';
import sequelize from './config/database.js';
import { Product } from './models/index.js';

async function setupDatabase() {
    try {
        // Drop the table if it exists
        await Product.drop();
        console.log('Existing tables dropped.');

        // Wait for all models to synchronize with the database
        await sequelize.sync({ force : true });
        console.log('Database synced.');

        // Now add example data
        await addExampleData();
    }
    catch (error) {
        console.error('Failed to setup database: ', error);
    }
}

async function addExampleData() {
    try {
    // Read and parse the JSON data
        const productsData = JSON.parse(readFileSync('example-data/products.json'));

        await sequelize.transaction(async(t) => {
            const products = await Product.bulkCreate(productsData, { transaction : t });

            return { products };
        });

        console.log('Products added to database successfully.');
    }
    catch (error) {
        console.error('Failed to add data to database due to an error: ', error);
    }
}

setupDatabase();