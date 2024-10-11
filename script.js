let numeroDeMuestra = 0;
let filaActual = null;
let MaxRowCellID = 1;
let currentSelectedID = 1;

let tempcurrentSelectedID = 0;
let wasLoadedDocument = false;
let firstRow = false;

let filaActualResultados = null;
let desviacionesEstandar = [];
let muestras = [];
let chart;

document
    .getElementById("uploadForm")
    .addEventListener("submit", function (event) {
        event.preventDefault(); // Evita que el formulario se envíe
        const file = document.getElementById("inputArchivo").files[0];
        const formData = new FormData();
        formData.append("archivo", file);

        fetch("http://localhost:3000/upload", {
            method: "POST",
            body: formData,
        })
            .then((response) => response.text())
            .then((data) => {
                console.log(data); // Aquí manejas la respuesta del servidor
            })
            .catch((error) => {
                console.error("Error al subir el archivo:", error);
            });
    });

function mostrarDatosEnTabla(data) {
    const tabla = document
        .getElementById("tablaDatos")
        .getElementsByTagName("tbody")[0];
    const tablaResultados = document
        .getElementById("tablaResultados")
        .getElementsByTagName("tbody")[0];

    tabla.innerHTML = "";
    tablaResultados.innerHTML = "";
    muestras = []; // Reset the sample names
    desviacionesEstandar = []; // Reset the standard deviation values

    data.forEach((fila, index) => {
        if (fila.length > 0) {
            const nuevaFila = tabla.insertRow();
            let valoresNumericos = [];

            fila.forEach((celda, i) => {
                if (!isNaN(celda) && i < 6) {
                    const nuevaCelda = nuevaFila.insertCell();
                    nuevaCelda.textContent = celda;
                    valoresNumericos.push(parseFloat(celda));
                }
            });

            if (valoresNumericos.length > 0) {
                const promedio = calcularPromedio(valoresNumericos);
                const desviacionEstandar = calcularDesviacionEstandar(
                    valoresNumericos,
                    promedio
                );

                // Add the sample name and standard deviation to the arrays
                muestras.push(`Muestra ${index}`);
                desviacionesEstandar.push(desviacionEstandar.toFixed(2));

                const nuevaFilaResultados = tablaResultados.insertRow();
                nuevaFilaResultados.insertCell().textContent = `Muestra ${index}`;
                nuevaFilaResultados.insertCell().textContent =
                    promedio.toFixed(2);
                nuevaFilaResultados.insertCell().textContent =
                    desviacionEstandar.toFixed(2);
            }
        }
    });

    // Update the chart with the new data
    actualizarGrafico();
}

document
    .getElementById("comenzarMuestreo")
    .addEventListener("click", function () {
        // Deshabilitar el botón "Comenzar Muestreo"
        this.disabled = true;

        // Crear una nueva fila para capturar las observaciones
        const tabla = document
            .getElementById("tablaDatos")
            .getElementsByTagName("tbody")[0];
        const tablaResultados = document
            .getElementById("tablaResultados")
            .getElementsByTagName("tbody")[0];

        // Contar las filas existentes para determinar el número de muestra
        const filasExistentes = tabla.rows.length;

        // Incrementar el número de muestra basado en el número de filas
        numeroDeMuestra = filasExistentes;

        document.getElementById("siguienteObservacion").disabled = false;
        document.getElementById("anteriorObservacion").disabled = false;

        if (!firstRow) {
            firstRow = true;
        } else {
            currentSelectedID++;
        }

        // Insertar nueva fila al final de la tabla de observaciones
        filaActual = tabla.insertRow();
        filaActual.insertCell().textContent = numeroDeMuestra; // Columna MUESTRA

        // Insertar celdas para cada observación con inputs deshabilitados inicialmente
        for (let i = 1; i <= 5; MaxRowCellID++, i++) {
            const celda = filaActual.insertCell();
            celda.innerHTML = `<input type="text" disabled id="observacion${MaxRowCellID}">`;
        }

        // Habilitar el primer input de observación
        document.getElementById(
            `observacion${currentSelectedID}`
        ).disabled = false;

        // Insertar una nueva fila en la tabla de resultados (promedio y desviación estándar)
        const nuevaFilaResultados = tablaResultados.insertRow();
        nuevaFilaResultados.insertCell().textContent = `Muestra ${numeroDeMuestra}`; // Nombre de la muestra
        nuevaFilaResultados.insertCell().textContent = "0"; // Promedio inicial
        nuevaFilaResultados.insertCell().textContent = "0"; // Desviación estándar inicial

        console.log(numeroDeMuestra);
    });

document
    .getElementById("siguienteObservacion")
    .addEventListener("click", function () {
        let value = document.getElementById(
            `observacion${currentSelectedID}`
        ).value;

        if (isNaN(value)) {
            alert("Elige un valor válido");
            return;
        }

        if (currentSelectedID == 0) {
            currentSelectedID++;
        }

        if (currentSelectedID < MaxRowCellID - 1) {
            // Deshabilitar la observación actual y habilitar la siguiente
            document.getElementById(
                `observacion${currentSelectedID}`
            ).disabled = true;
            currentSelectedID++;
            document.getElementById(
                `observacion${currentSelectedID}`
            ).disabled = false;
            console.log(currentSelectedID);
        } else {
            // Al llegar a la observación 5, guardar automáticamente
            document.getElementById(
                `observacion${currentSelectedID}`
            ).disabled = true;
            document.getElementById("siguienteObservacion").disabled = true;
            alert("Muestra guardada automáticamente.");

            // Obtener los valores de las observaciones de la fila actual
            const valoresObservaciones = [];
            for (let i = 1; i <= 5; i++) {
                const observacion = document.getElementById(
                    `observacion${MaxRowCellID - (6 - i)}`
                ).value;
                if (!isNaN(observacion) && observacion !== "") {
                    valoresObservaciones.push(parseFloat(observacion));
                }
            }

            // Calcular el promedio y la desviación estándar
            const promedio = calcularPromedio(valoresObservaciones);
            const desviacionEstandar = calcularDesviacionEstandar(
                valoresObservaciones,
                promedio
            );

            // Actualizar la fila correspondiente en la tabla de resultados
            const tablaResultados = document
                .getElementById("tablaResultados")
                .getElementsByTagName("tbody")[0];

            let filaResultado = null;

            if (wasLoadedDocument) {
                muestras.push(`Muestra ${numeroDeMuestra - 1}`);
                filaResultado = tablaResultados.rows[numeroDeMuestra - 1];
            } else {
                muestras.push(`Muestra ${numeroDeMuestra}`);
                filaResultado = tablaResultados.rows[numeroDeMuestra];
            }

            desviacionesEstandar.push(desviacionEstandar);
            filaResultado.cells[1].textContent = promedio.toFixed(2);
            filaResultado.cells[2].textContent = desviacionEstandar.toFixed(2);

            // Habilitar de nuevo el botón "Comenzar Muestreo"
            document.getElementById("comenzarMuestreo").disabled = false;
            filaActual = null;

            actualizarGrafico();
        }

        tempcurrentSelectedID = currentSelectedID;
    });

document
    .getElementById("anteriorObservacion")
    .addEventListener("click", function () {
        if (filaActual == null) {
            console.log("JOINED 1");
            console.log("MaxRowCellID " + (MaxRowCellID - 1));
            console.log("tempcurrentSelectedID: " + tempcurrentSelectedID);
            if (currentSelectedID > 0) {
                if (!(currentSelectedID == MaxRowCellID - 1)) {
                    currentSelectedID++;
                    document.getElementById(
                        `observacion${currentSelectedID}`
                    ).disabled = true;
                    currentSelectedID--;
                }

                document.getElementById(
                    `observacion${currentSelectedID}`
                ).disabled = false; // Enable the previous observation
                document.getElementById(
                    "siguienteObservacion"
                ).disabled = false;
                console.log(currentSelectedID);
                currentSelectedID--;
            }
        } else {
            if (currentSelectedID > 0) {
                document.getElementById(
                    `observacion${currentSelectedID}`
                ).disabled = true; // Disable current observation
                currentSelectedID--;
                document.getElementById(
                    `observacion${currentSelectedID}`
                ).disabled = false; // Enable the previous observation
            } else {
                console.log("LEAVE");
            }
        }
    });

function calcularPromedio(valores) {
    const suma = valores.reduce((acc, val) => acc + val, 0);
    return suma / valores.length;
}

function calcularDesviacionEstandar(valores, promedio) {
    const sumaDiferenciasCuadradas = valores.reduce(
        (acc, val) => acc + Math.pow(val - promedio, 2),
        0
    );
    return Math.sqrt(sumaDiferenciasCuadradas / valores.length);
}

// Function to update the chart with new data
function actualizarGrafico() {
    const ctx = document
        .getElementById("graficoDesviacionEstandar")
        .getContext("2d");

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: muestras,
            datasets: [
                {
                    label: "Desviación Estándar",
                    data: desviacionesEstandar,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                    fill: false,
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}
