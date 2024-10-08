let numeroDeMuestra = 0;
let filaActual = null;
let MaxRowCellID = 1;
let currentSelectedID = 1;

let tempcurrentSelectedID = 0;
let wasLoadedDocument = false;
let firstRow = false;


document.getElementById("inputArchivo").addEventListener("change", function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Asumimos que los datos están en la primera hoja
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Convertimos los datos de la hoja a JSON
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            header: 1,
        });

        // Mostrar los datos en la tabla y actualizar número de muestra
        mostrarDatosEnTabla(jsonData);
        numeroDeMuestra = jsonData.length; // Actualizar la cantidad de muestras
        
    };

    reader.readAsArrayBuffer(file);
});

function mostrarDatosEnTabla(data) {
    const tabla = document.getElementById("tablaDatos").getElementsByTagName("tbody")[0];

    // Limpiar cualquier dato anterior en la tabla
    tabla.innerHTML = "";

    // Recorrer las filas y agregarlas a la tabla
    data.forEach((fila, index) => {
        if (fila.length > 0) {
            const nuevaFila = tabla.insertRow();
            fila.forEach((celda, i) => {
                if (!isNaN(celda) && i < 6) {
                    // Llenar las observaciones
                    const nuevaCelda = nuevaFila.insertCell();
                    nuevaCelda.textContent = celda;
                }
            });
            wasLoadedDocument = true; 
        }
    });
}

document.getElementById("comenzarMuestreo").addEventListener("click", function () {
    // Deshabilitar el botón "Comenzar Muestreo"
    this.disabled = true;

    // Crear una nueva fila para capturar las observaciones
    const tabla = document.getElementById("tablaDatos").getElementsByTagName("tbody")[0];

    // Contar las filas existentes para determinar el número de muestra
    const filasExistentes = tabla.rows.length;

    // Incrementar el número de muestra basado en el número de filas
    numeroDeMuestra = filasExistentes;

    document.getElementById("siguienteObservacion").disabled = false;
    document.getElementById("anteriorObservacion").disabled = false;

    if (!firstRow)
    {
        firstRow = true;
    }
    else
    {
        currentSelectedID++;
    }

    filaActual = tabla.insertRow(); // Insertar nueva fila al final
    filaActual.insertCell().textContent = numeroDeMuestra; // Columna MUESTRA

    // Insertar celdas para cada observación con inputs deshabilitados inicialmente
    for (let i = 1; i <= 5; MaxRowCellID++, i++) {
        const celda = filaActual.insertCell();
        celda.innerHTML = `<input type="text" disabled id="observacion${MaxRowCellID}">`;
    }

    let str = 'observacion' + currentSelectedID;
    // Habilitar el primer input de observación
    document.getElementById(str).disabled = false;
    console.log(currentSelectedID);
});

// Evento para manejar el siguiente paso de observación
document.getElementById("siguienteObservacion").addEventListener("click", function () {
    if (currentSelectedID == 0)
    {
        currentSelectedID++;
    }

    if (currentSelectedID < MaxRowCellID - 1) {
        // Deshabilitar la observación actual y habilitar la siguiente
        document.getElementById(`observacion${currentSelectedID}`).disabled = true;
        currentSelectedID++;
        document.getElementById(`observacion${currentSelectedID}`).disabled = false;
        console.log(currentSelectedID);
    } else {
        // Al llegar a la observación 5, guardar automáticamente
        document.getElementById(`observacion${currentSelectedID}`).disabled = true;
        document.getElementById("siguienteObservacion").disabled = true;
        alert("Muestra guardada automáticamente.");

        // Habilitar de nuevo el botón "Comenzar Muestreo"
        document.getElementById("comenzarMuestreo").disabled = false;
        filaActual = null;
    }

    tempcurrentSelectedID = currentSelectedID;
});

document.getElementById("anteriorObservacion").addEventListener("click", function () {
    if (filaActual == null) {
        console.log("JOINED 1")
        console.log("MaxRowCellID " + (MaxRowCellID - 1));
        console.log("tempcurrentSelectedID: "+ tempcurrentSelectedID);
        if (currentSelectedID > 0) { 
            if (!(currentSelectedID == MaxRowCellID - 1))
            {
                currentSelectedID++;
                document.getElementById(`observacion${currentSelectedID}`).disabled = true;
                currentSelectedID--;
            }

            document.getElementById(`observacion${currentSelectedID}`).disabled = false; // Enable the previous observation
            document.getElementById("siguienteObservacion").disabled = false;
            console.log(currentSelectedID);
            currentSelectedID--;
        }
    } else {
        if (currentSelectedID > 0) { 
            document.getElementById(`observacion${currentSelectedID}`).disabled = true; // Disable current observation
            currentSelectedID--; 
            document.getElementById(`observacion${currentSelectedID}`).disabled = false; // Enable the previous observation
        } else {
            console.log("LEAVE");
        }
    }
});