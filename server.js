const express = require("express");
const cors = require("cors");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

const accountSid = process.env.ACCOUNTID;
const authToken = process.env.AUTHTOKEN;
const client = require("twilio")(accountSid, authToken);

const app = express();
const PORT = 3000;

let UCL = 0.051;
let UC = 0.0244;
let LCL = 0;

app.use(express.json());

app.use(cors());

const MAINFILE = "data/datos.xlsx";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function calcularDesviacionMuestral(numeros) {
    if (numeros.length < 2) {
        return 0;
    }
    const media = numeros.reduce((acc, curr) => acc + curr, 0) / numeros.length;
    const sumaDiferenciasCuadrado = numeros.reduce(
        (acc, curr) => acc + Math.pow(curr - media, 2),
        0
    );
    return Math.sqrt(sumaDiferenciasCuadrado / (numeros.length - 1)); // Dividir por (n - 1) para la desviación muestral
}

app.post("/guardarMuestra", (req, res) => {
    const { observaciones } = req.body;

    const filePath = path.join(__dirname, MAINFILE);

    let existingWorkbook;
    if (fs.existsSync(filePath)) {
        existingWorkbook = xlsx.readFile(filePath);
    } else {
        existingWorkbook = xlsx.utils.book_new();
    }

    const sheetName = existingWorkbook.SheetNames[0] || "Hoja1";
    let existingSheet = existingWorkbook.Sheets[sheetName];

    const existingData = existingSheet
        ? xlsx.utils.sheet_to_json(existingSheet)
        : [];

    const maxExistingSample = existingData.length
        ? Math.max(...existingData.map((row) => row.Muestra))
        : 0;

    const newEntry = {
        Muestra: maxExistingSample + 1,
        ...observaciones.reduce((acc, obs, index) => {
            acc[`Observacion ${index + 1}`] = obs;
            return acc;
        }, {}),
    };

    const updatedData = [...existingData, newEntry];

    const newSheet = xlsx.utils.json_to_sheet(updatedData);

    if (!existingWorkbook.Sheets[sheetName]) {
        xlsx.utils.book_append_sheet(existingWorkbook, newSheet, sheetName);
    } else {
        existingWorkbook.Sheets[sheetName] = newSheet;
    }

    xlsx.writeFile(existingWorkbook, filePath);

    const observacionesNumericas = observaciones.map((obs) => parseFloat(obs));

    const desviacionMuestral = calcularDesviacionMuestral(
        observacionesNumericas
    );

    if (desviacionMuestral > UCL) {
        client.messages
            .create({
                body: `La muestra añadida en la línea ${maxExistingSample + 1} ha sobrepasado el UCL`,
                from: process.env.TWILIO_FROM,
                to: process.env.TWILIO_TO,
            })
            .then((message) => console.log(message.sid));
        
        client.messages
            .create({
                body: `La muestra añadida en la línea ${maxExistingSample + 1} ha sobrepasado el UCL`,
                from: process.env.TWILIO_FROM,
                to: process.env.TWILIO_TOS,
            })
            .then((message) => console.log(message.sid));
    }
    
    if (desviacionMuestral < LCL) {
        client.messages
            .create({
                body: `La muestra añadida en la línea ${maxExistingSample + 1} es menor que el LCL`,
                from: process.env.TWILIO_FROM,
                to: process.env.TWILIO_TO,
            })
            .then((message) => console.log(message.sid));
        
        client.messages
            .create({
                body: `La muestra añadida en la línea ${maxExistingSample + 1} es menor que el LCL`,
                from: process.env.TWILIO_FROM,
                to: process.env.TWILIO_TOS,
            })
            .then((message) => console.log(message.sid));
    }

    res.json({
        message: "Muestra guardada exitosamente en el archivo Excel.",
        desviacionMuestral: desviacionMuestral, // Devolver también la desviación muestral en la respuesta
    });
});

app.delete("/data", (req, res) => {
    const filePath = path.join(__dirname, MAINFILE);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "El archivo no existe." });
    }

    // Eliminar el archivo
    fs.unlink(filePath, (err) => {
        if (err) {
            return res
                .status(500)
                .json({ error: "Error al eliminar el archivo." });
        }
        res.send("Archivo eliminado exitosamente.");
    });
});

app.post("/upload", upload.single("archivo"), (req, res) => {
    const uploadedFile = req.file;

    const existingFilePath = path.join(__dirname, MAINFILE);

    if (!fs.existsSync(existingFilePath)) {
        fs.writeFileSync(existingFilePath, uploadedFile.buffer);
        return res.send("Archivo subido y creado con éxito.");
    }

    const existingWorkbook = xlsx.readFile(existingFilePath);
    const newWorkbook = xlsx.read(uploadedFile.buffer);

    const existingSheet =
        existingWorkbook.Sheets[existingWorkbook.SheetNames[0]];
    const newSheet = newWorkbook.Sheets[newWorkbook.SheetNames[0]];

    const existingData = xlsx.utils.sheet_to_json(existingSheet);
    const newData = xlsx.utils.sheet_to_json(newSheet);

    const maxExistingSample = existingData.length
        ? Math.max(...existingData.map((row) => row.Muestra))
        : 0;

    const newDataAdjusted = newData.map((row, index) => ({
        ...row,
        Muestra: maxExistingSample + index + 1,
    }));

    const concatenatedData = existingData.concat(newDataAdjusted);

    const newSheetMerged = xlsx.utils.json_to_sheet(concatenatedData);

    const newWorkbookMerged = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbookMerged, newSheetMerged, "Hoja1");

    xlsx.writeFile(newWorkbookMerged, existingFilePath);

    res.send("Archivo subido y concatenado con éxito.");
});

app.get("/datos", (req, res) => {
    const filePath = path.join(__dirname, MAINFILE);

    if (!fs.existsSync(filePath)) {
        return res
            .status(404)
            .json({ error: "El archivo de datos no existe." });
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
