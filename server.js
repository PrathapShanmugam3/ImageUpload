const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');

const app = express();
const port = 10000;

app.use(cors());
app.use(bodyParser.json());

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

const db = mysql.createConnection({
    host: "datacode-brinkc-0f04.k.aivencloud.com",
    user: "avnadmin",
    password: "AVNS_LW-VAXMR2lhfn-4QiyF",
    database: "defaultdb",
    port: 22335
});

db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Connected to MySQL server....");
        createDatabaseAndTables();
    }
});

const createDatabaseAndTables = () => {
    db.query('CREATE DATABASE IF NOT EXISTS defaultdb', (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Database 'defaultdb' created or already exists");
            db.query('USE defaultdb');
            db.query(`CREATE TABLE IF NOT EXISTS product_img (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_name VARCHAR(255),
                content VARCHAR(1000),
                price INT,
                image MEDIUMBLOB
            )`, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Table 'product_img' created or already exists");
                }
            });
        }
    });
};

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { product_name, content, price, category } = req.body;
        const imageBuffer = req.file.buffer;

        if (!category) {
            return res.status(400).json({ error: 'Category is missing in the request body' });
        }

        // Check if the table exists, and create it if not
        const tableExistsQuery = `SELECT 1 FROM information_schema.tables WHERE table_schema = 'defaultdb' AND table_name = ? LIMIT 1`;
        const tableExists = await queryAsync(tableExistsQuery, [category]);

        if (tableExists.length === 0) {
            // Table doesn't exist, create it
            const createTableQuery = `CREATE TABLE ${category} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_name VARCHAR(255),
                content VARCHAR(1000),
                price INT,
                image MEDIUMBLOB
            )`;
            await queryAsync(createTableQuery);
        }

        // Insert the image into the dynamically determined table
        const insertQuery = `INSERT INTO ${category} (product_name, content, price, image) VALUES (?, ?, ?, ?)`;
        await queryAsync(insertQuery, [product_name, content, price, imageBuffer]);
        
        console.log('Image uploaded and stored in the database'); 
        res.status(200).json({ message: 'Image uploaded successfully!' });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to promisify database queries
function queryAsync(sql, args) {
    return new Promise((resolve, reject) => {
        db.query(sql, args, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

app.get('/getAll', async (req, res) => {
    try {
        db.query('SELECT * FROM mobile', async (error, result, fields) => {
            if (error) {
                console.error('Error fetching data:', error);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                const formattedResult = result.map(item => ({
                    ...item,
                    image: bufferToBase64(item.image)
                }));
                res.json(formattedResult);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const bufferToBase64 = (buffer) => {
    return buffer.toString('base64');
};

app.get('/image/:id', (req, res) => {
    const imageId = req.params.id;

    db.query('SELECT image FROM mobile WHERE id = ?', [imageId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error retrieving image');
        }

        if (result.length === 0) {
            return res.status(404).send('Image not found');
        }

        const imageBuffer = result[0].image;
        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': imageBuffer.length
        });
        res.end(imageBuffer);
    });
});

//GET ALL IQOO PHONE IMAGES 
app.get('/getAl', async (req, res) => {
    try {
        db.query('SELECT * FROM mobileiqoo', async (error, result, fields) => {
            if (error) {
                console.error('Error fetching data:', error);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                const formattedResult = result.map(item => ({
                    ...item,
                    image: bufferToBase64(item.image)
                }));
                res.json(formattedResult);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/iqoo/:id', (req, res) => {
    const imageId = req.params.id;

    db.query('SELECT image FROM mobileiqoo WHERE id = ?', [imageId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error retrieving image');
        }

        if (result.length === 0) {
            return res.status(404).send('Image not found');
        }

        const imageBuffer = result[0].image;
        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': imageBuffer.length
        });
        res.end(imageBuffer);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
