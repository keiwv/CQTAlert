const express = require('express');
const multer = require('multer'); // For handling file uploads
const path = require('path');
const fs = require('fs'); // To handle file system operations
const cors = require('cors');
const app = express();
const port = 3000;


app.use(cors());
// Configuration of multer to store files on disk
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        // Create the directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir); // Save files to the "uploads" directory
    },
    filename: (req, file, cb) => {
        // Save the file with the original filename
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Middleware to serve static files like HTML, CSS, and JS
app.use(express.static('public'));

// Route to receive the Excel file and save it
app.post('/upload', upload.single('archivo'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file was uploaded.');
    }

    // The file has been saved to the "uploads" folder
    res.send('File uploaded and saved successfully.');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
