const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
app.use(express.json());

app.use(cors());

const MAINFILE = "data/datos.xlsx";


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/guardarMuestra", (req, res) => {
    const { observaciones } = req.body;

    const filePath = path.join(__dirname, MAINFILE);

    let existingWorkbook;
    if (fs.existsSync(filePath)) {
        existingWorkbook = xlsx.readFile(filePath);
    } else {
        existingWorkbook = xlsx.utils.book_new();
    }

    const sheetName = existingWorkbook.SheetNames[0] || 'Hoja1';
    let existingSheet = existingWorkbook.Sheets[sheetName];

    const existingData = existingSheet ? xlsx.utils.sheet_to_json(existingSheet) : [];

  
    const maxExistingSample = existingData.length ? Math.max(...existingData.map(row => row.Muestra)) : 0;

    const newEntry = {
        Muestra: maxExistingSample + 1, 
        ...observaciones.reduce((acc, obs, index) => {
            acc[`Observacion ${index + 1}`] = obs; 
            return acc;
        }, {})
    };

    const updatedData = [...existingData, newEntry];

    const newSheet = xlsx.utils.json_to_sheet(updatedData);

    if (!existingWorkbook.Sheets[sheetName]) {
        xlsx.utils.book_append_sheet(existingWorkbook, newSheet, sheetName);
    } else {
        existingWorkbook.Sheets[sheetName] = newSheet; 
    }

    xlsx.writeFile(existingWorkbook, filePath);

    res.send("Muestra guardada exitosamente en el archivo Excel.");
});



app.post('/upload', upload.single('archivo'), (req, res) => {
    const uploadedFile = req.file;

    const existingFilePath = path.join(__dirname, MAINFILE);

    if (!fs.existsSync(existingFilePath)) {
        fs.writeFileSync(existingFilePath, uploadedFile.buffer);
        return res.send('Archivo subido y creado con éxito.');
    }

    const existingWorkbook = xlsx.readFile(existingFilePath);
    const newWorkbook = xlsx.read(uploadedFile.buffer);

    const existingSheet = existingWorkbook.Sheets[existingWorkbook.SheetNames[0]];
    const newSheet = newWorkbook.Sheets[newWorkbook.SheetNames[0]];

    const existingData = xlsx.utils.sheet_to_json(existingSheet);
    const newData = xlsx.utils.sheet_to_json(newSheet);

    const maxExistingSample = existingData.length ? Math.max(...existingData.map(row => row.Muestra)) : 0;

    const newDataAdjusted = newData.map((row, index) => ({
        ...row,
        Muestra: maxExistingSample + index + 1 
    }));

    const concatenatedData = existingData.concat(newDataAdjusted);

    const newSheetMerged = xlsx.utils.json_to_sheet(concatenatedData);

    const newWorkbookMerged = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbookMerged, newSheetMerged, 'Hoja1');

    xlsx.writeFile(newWorkbookMerged, existingFilePath);

    res.send('Archivo subido y concatenado con éxito.');
});

app.get('/datos', (req, res) => {
    const filePath = path.join(__dirname, MAINFILE);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'El archivo de datos no existe.' });
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir la hoja a un JSON para enviarla como respuesta
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    res.json(jsonData);
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});


