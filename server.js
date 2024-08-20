const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');

const app = express();
const port = 10000;

app.use(cors());
app.use(bodyparser.json())
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

const db = mysql.createConnection({
    host: "datacode-brinkc-0f04.k.aivencloud.com",
    user: "avnadmin",
    password: "AVNS_LW-VAXMR2lhfn-4QiyF",
    database:"defaultdb",
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
        const { product_name, content, price, category } = req.body;
        const imageBuffer = req.file.buffer;

        if (!category) {
            return res.status(400).json({ error: 'Category is missing in the request body' });
        }

        // Check if the table exists, and create it if not
        const tableExistsQuery = `SELECT 1 FROM information_schema.tables WHERE table_schema = 'images' AND table_name = ? LIMIT 1`;
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
        images
        console.log('Image uploaded and stored in the database'); 
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
    db.query('SELECT * FROM mobile', async (error, result, fields) => {
        if (error) {
            console.error('Error fetching data:', error);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            const formattedResult = result.map(item => ({
                ...item,
                image: bufferToBase64(item.image)
            }));
            //console.log('Formatted Result:');
            res.json(formattedResult);
        }
    });
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
    db.query('SELECT * FROM mobileiqoo', async (error, result, fields) => {
        if (error) {
            console.error('Error fetching data:', error);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            const formattedResult = result.map(item => ({
                ...item,
                image: bufferToBase64(item.image)
            }));
            //console.log('Formatted Result:');
            res.json(formattedResult);
        }
    });
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

// app.delete('/delete/:id',(req,res)=>{

//     const {id}=req.params;

//     db.query('delete from mobile where id=?',[id],(error,result,field)=>{
//         if(error){
//             res.send("Error Deleting");
//         }else{
//             res.send("Delete Success");
//         }
//     })
    
// })

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
