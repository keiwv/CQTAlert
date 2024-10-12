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
        event.preventDefault(); 
        const file = document.getElementById("inputArchivo").files[0];
        const formData = new FormData();
        formData.append("archivo", file);

        fetch("http://localhost:3000/upload", {
            method: "POST",
            body: formData,
        })
            .then((response) => response.text())
            .then((data) => {
                console.log(data); 
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
    muestras = []; 
    desviacionesEstandar = []; 

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

    actualizarGrafico();
}

document
    .getElementById("comenzarMuestreo")
    .addEventListener("click", function () {
        this.disabled = true;

        const tabla = document
            .getElementById("tablaDatos")
            .getElementsByTagName("tbody")[0];
        const tablaResultados = document
            .getElementById("tablaResultados")
            .getElementsByTagName("tbody")[0];

        const filasExistentes = tabla.rows.length;

        numeroDeMuestra = filasExistentes;

        document.getElementById("siguienteObservacion").disabled = false;
        document.getElementById("anteriorObservacion").disabled = false;

        if (!firstRow) {
            firstRow = true;
        } else {
            currentSelectedID++;
        }

        filaActual = tabla.insertRow();
        filaActual.insertCell().textContent = numeroDeMuestra; 

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
        nuevaFilaResultados.insertCell().textContent = `Muestra ${numeroDeMuestra}`; 
        nuevaFilaResultados.insertCell().textContent = "0"; 
        nuevaFilaResultados.insertCell().textContent = "0"; 

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
            
            document.getElementById(
                `observacion${currentSelectedID}`
            ).disabled = true;
            currentSelectedID++;
            document.getElementById(
                `observacion${currentSelectedID}`
            ).disabled = false;
            console.log(currentSelectedID);
        } else {
            document.getElementById(
                `observacion${currentSelectedID}`
            ).disabled = true;
            document.getElementById("siguienteObservacion").disabled = true;
            alert("Muestra preguarda");

            const valoresObservaciones = [];
            for (let i = 1; i <= 5; i++) {
                const observacion = document.getElementById(
                    `observacion${MaxRowCellID - (6 - i)}`
                ).value;
                if (!isNaN(observacion) && observacion !== "") {
                    valoresObservaciones.push(parseFloat(observacion));
                }
            }

            const promedio = calcularPromedio(valoresObservaciones);
            const desviacionEstandar = calcularDesviacionEstandar(
                valoresObservaciones,
                promedio
            );


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
                ).disabled = false; 
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
                ).disabled = true; 
                currentSelectedID--;
                document.getElementById(
                    `observacion${currentSelectedID}`
                ).disabled = false; 
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
    // Cambiar aquí para usar n - 1
    return Math.sqrt(sumaDiferenciasCuadradas / (valores.length - 1));
}

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


document.getElementById("guardarMuestra").addEventListener("click", function () {
    
    const valoresObservaciones = [];
    for (let i = 1; i <= 5; i++) {
        const observacion = document.getElementById(
            `observacion${MaxRowCellID - (6 - i)}`
        ).value;
        if (!isNaN(observacion) && observacion !== "") {
            valoresObservaciones.push(parseFloat(observacion));
        }
    }

    if (valoresObservaciones.length === 0) {
        alert("No hay observaciones para guardar.");
        return;
    }

    const dataToSave = {
        muestra: numeroDeMuestra,
        observaciones: valoresObservaciones,
    };

    fetch("http://localhost:3000/guardarMuestra", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
    })
        .then((response) => response.text())
        .then((data) => {
            console.log(data); 
            alert("Muestra guardada correctamente.");
        })
        .catch((error) => {
            console.error("Error al guardar la muestra:", error);
        });
});


/* LOG IN */
document.getElementById("loginButton").addEventListener("click", function() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username == 'admin' && password == '12345') {
        localStorage.setItem('loggedIn', 'true');
        window.location.href = "admin-index.html";
    } else {
        alert("El usuario no existe, intenta de nuevo.");
    }
});
