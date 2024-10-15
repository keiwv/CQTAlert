let UCL = 0.051;
let UC = 0.0244;
let LCL = 0;

/* VERIFY LOGIN */

if (!localStorage.getItem('loggedIn'))
{
    alert("Inicia sesión primero:)");
    window.location.href = 'index.html';
}

document.getElementById('logoutButton').addEventListener('click', function() {
    localStorage.removeItem('loggedIn'); 
    window.location.href = 'index.html'; 
});


document.addEventListener("DOMContentLoaded", function () {
    function cargarDatos() {
        fetch("datos")
            .then((response) => response.json())
            .then((data) => {
                const tbody = document.querySelector("#tablaDatos tbody");
                const resultadosBody = document.querySelector(
                    "#tablaResultadosBody"
                );

                tbody.innerHTML = "";
                resultadosBody.innerHTML = "";

                const calculos = [];
                const etiquetas = []; 
                const _desviacionEstandar = []; 

                // Iterate over the data and create table rows
                data.forEach((row) => {
                    const tr = document.createElement("tr");

                    // Assuming sample names are in `row.Muestra`
                    tr.innerHTML = `
                        <td>${row.Muestra}</td>
                        <td>${row["Observacion 1"] || ""}</td>
                        <td>${row["Observacion 2"] || ""}</td>
                        <td>${row["Observacion 3"] || ""}</td>
                        <td>${row["Observacion 4"] || ""}</td>
                        <td>${row["Observacion 5"] || ""}</td>
                    `;

                    tbody.appendChild(tr);
        
                    const observaciones = [
                        parseFloat(row["Observacion 1"]) || 0,
                        parseFloat(row["Observacion 2"]) || 0,
                        parseFloat(row["Observacion 3"]) || 0,
                        parseFloat(row["Observacion 4"]) || 0,
                        parseFloat(row["Observacion 5"]) || 0,
                    ];

                    const promedio =
                        observaciones.reduce((sum, value) => sum + value, 0) /
                        observaciones.length;

                    // Calculate sample standard deviation
                    const desviacionEstandar = Math.sqrt(
                        observaciones.reduce(
                            (sum, value) => sum + Math.pow(value - promedio, 2),
                            0
                        ) /
                            (observaciones.length - 1)
                    );

                    calculos.push({
                        muestra: row.Muestra,
                        promedio: promedio.toFixed(2),
                        desviacionEstandar: desviacionEstandar.toFixed(10),
                    });

                    // Add to labels and standard deviations for the chart
                    etiquetas.push(row.Muestra);
                    _desviacionEstandar.push(desviacionEstandar.toFixed(10)); 
                });

                // Insert calculations into the results table
                calculos.forEach((calc) => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${calc.muestra}</td>
                        <td>${calc.promedio}</td>
                        <td>${calc.desviacionEstandar}</td>
                    `;
                    resultadosBody.appendChild(tr);
                });

                // Create the chart
                crearGrafica(etiquetas, _desviacionEstandar);
            })
            .catch((error) =>
                console.error("Error al obtener los datos:", error)
            );
    }

    // Load data when the page opens
    cargarDatos();

    function crearGrafica(etiquetas, _desviacionEstandar) {
        const ctx = document.getElementById("miGrafica").getContext("2d");

        window.miGrafica = new Chart(ctx, {
            type: "line",
            data: {
                labels: etiquetas,
                datasets: [
                    {
                        label: "Desviación Estándar",
                        data: _desviacionEstandar.map((num) => parseFloat(num)),
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Desviación Estándar",
                        },
                        min: 0, 
                        max: Math.max(UCL, UC) + 0.1, 
                    },
                },
                plugins: {
                    annotation: {
                        annotations: {
                            lcl: {
                                type: "line",
                                yMin: LCL,
                                yMax: LCL,
                                borderColor: "red",
                                borderWidth: 2,
                                label: {
                                    enabled: true,
                                    content: "LCL",
                                    position: "end",
                                },
                            },
                            ucl: {
                                type: "line",
                                yMin: UCL,
                                yMax: UCL,
                                borderColor: "blue",
                                borderWidth: 2,
                                label: {
                                    enabled: true,
                                    content: "UCL",
                                    position: "end",
                                },
                            },
                            uc: {
                                type: "line",
                                yMin: UC,
                                yMax: UC,
                                borderColor: "gray",
                                borderWidth: 2,
                                label: {
                                    enabled: true,
                                    content: "UC",
                                    position: "end",
                                },
                            },
                        },
                    },
                },
            },
        });
    }
});


document.getElementById('deleteFile').addEventListener('click', function() {
    fetch('data', {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            console.log("Eliminado exitosamente");
        } else {
            response.json().then(data => {
                console.log("El archivo no existe o hay un problema con el servidor.");
            });
        }
    })
    .catch(error => {
        alert('Error de red: ' + error);
    });
});