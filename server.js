import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';
import { Product } from './models/index.js';
import process from 'process';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors(
    {
        origin : 'http://localhost:8080'
    }
));

app.use(express.json());

const initializeDatabase = async() => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully');
    }
    catch (error) {
        console.error('Unable to connect to database:', error);
    }
};

// Handsontable endpoints
app.get('/api/products', async(req, res) => {
    try {
        const products = await Product.findAll({
          order: [['index', 'ASC']]
        });
        res.status(200).json({ products });
    }
    catch (error) {
        console.error({ error });
        res.status(500).json({
            success : false,
            message : 'There was an error loading the products data.'
        });
    }
});

app.patch('/api/products/save', async(req, res) => {
    try {
        const { changes } = req.body;

        if (!changes || changes.length === 0) {
            return res.status(200).json({ success: true, message: 'No changes to save' });
        }

        // Process each change
        for (const change of changes) {
            const [row, prop, oldValue, newValue] = change;

            // Get the product ID for this row (row index + 1 assuming sequential IDs)
            const products = await Product.findAll({ order: [['id', 'ASC']] });
            const product = products[row];

            if (product) {
                // Map column names to database fields
                // Column 0: ID (hidden), Column 1: index
                const columnMap = {
                    1: 'index',
                    2: 'companyName',
                    3: 'country',
                    4: 'productName',
                    5: 'sellDate',
                    6: 'orderId',
                    7: 'inStock',
                    8: 'qty'
                };

                const fieldName = columnMap[prop];

                if (fieldName) {
                    await product.update({ [fieldName]: newValue });
                }
            }
        }

        res.status(200).json({ success: true, message: 'Data saved successfully' });
    }
    catch (error) {
        console.error({ error });
        res.status(500).json({
            success : false,
            message : 'There was an error saving the data.'
        });
    }
});

app.patch('/api/products/bulk-update', async(req, res) => {
    try {
        const { updates } = req.body;

        if (!updates || updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No updates provided' });
        }

        // Use a transaction for atomicity
        await sequelize.transaction(async (t) => {
            // Update each product by ID
            for (const update of updates) {
                const { id, ...fields } = update;
                await Product.update(fields, {
                    where: { id },
                    transaction: t
                });
            }
        });

        res.status(200).json({
            success: true,
            message: `Updated ${updates.length} product${updates.length > 1 ? 's' : ''}`,
            updatedCount: updates.length
        });
    }
    catch (error) {
        console.error({ error });
        res.status(500).json({
            success : false,
            message : 'There was an error updating the products.'
        });
    }
});

app.post('/api/products/create', async(req, res) => {
    try {
        const { products } = req.body;

        if (!products || products.length === 0) {
            return res.status(400).json({ success: false, message: 'No products provided' });
        }

        // Create new products
        const createdProducts = await Product.bulkCreate(products);

        res.status(201).json({
            success: true,
            message: `Created ${createdProducts.length} product${createdProducts.length > 1 ? 's' : ''}`,
            products: createdProducts
        });
    }
    catch (error) {
        console.error({ error });
        res.status(500).json({
            success : false,
            message : 'There was an error creating the products.'
        });
    }
});

app.delete('/api/products/delete', async(req, res) => {
    try {
        const { ids } = req.query;

        if (!ids) {
            return res.status(400).json({ success: false, message: 'No product IDs provided' });
        }

        // Parse IDs from comma-separated string
        const idArray = ids.split(',').map(id => parseInt(id, 10));

        // Delete products by their IDs
        const deletedCount = await Product.destroy({
            where: {
                id: idArray
            }
        });

        res.status(200).json({
            success: true,
            message: `Deleted ${deletedCount} product${deletedCount > 1 ? 's' : ''}`,
            deletedCount
        });
    }
    catch (error) {
        console.error({ error });
        res.status(500).json({
            success : false,
            message : 'There was an error deleting the products.'
        });
    }
});

app.listen(PORT, async() => {
    await initializeDatabase();
    console.log(`Server running on http://localhost:${PORT}`);
});