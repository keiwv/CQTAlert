document
    .getElementById("inputArchivo")
    .addEventListener("change", function (event) {
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

            // Llamar a la función para mostrar los datos en la tabla
            mostrarDatosEnTabla(jsonData);
        };

        reader.readAsArrayBuffer(file);
    });

function mostrarDatosEnTabla(data) {
    const tabla = document
        .getElementById("tablaDatos")
        .getElementsByTagName("tbody")[0];

    // Limpiar cualquier dato anterior en la tabla
    tabla.innerHTML = "";

    // Recorrer las filas y agregarlas a la tabla
    data.forEach((fila) => {
        // Evitar filas vacías
        if (fila.length > 0) {
            const nuevaFila = tabla.insertRow();

            // Insertar solo las celdas que contengan números
            fila.forEach((celda) => {
                if (!isNaN(celda)) {
                    // Verificar si la celda es un número
                    const nuevaCelda = nuevaFila.insertCell();
                    nuevaCelda.textContent = celda;
                }
            });
        }
    });
}
