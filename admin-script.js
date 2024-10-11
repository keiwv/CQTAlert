document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("loadDataBtn").addEventListener("click", function() {
        fetch('http://localhost:3000/datos') // Cambia la URL si es necesario
            .then(response => response.json())
            .then(data => {
                const tbody = document.querySelector("#tablaDatos tbody");
                const resultadosBody = document.querySelector("#tablaResultadosBody");

                // Limpiar el contenido anterior de la tabla
                tbody.innerHTML = "";
                resultadosBody.innerHTML = "";

                // Array para almacenar promedios y desviaciones estándar de cada muestra
                const calculos = [];
                const etiquetas = []; // Para almacenar las etiquetas (nombres de las muestras)
                const _desviacionEstandar = []; // Para almacenar los promedios

                // Iterar sobre los datos y crear filas de la tabla
                data.forEach(row => {
                    const tr = document.createElement("tr");

                    // Asumiendo que `Muestra 1`, `Muestra 2`, ... están en row
                    tr.innerHTML = `
                        <td>${row.Muestra}</td>
                        <td>${row["Observacion 1"] || ""}</td>
                        <td>${row["Observacion 2"] || ""}</td>
                        <td>${row["Observacion 3"] || ""}</td>
                        <td>${row["Observacion 4"] || ""}</td>
                        <td>${row["Observacion 5"] || ""}</td>
                    `;

                    tbody.appendChild(tr);

                    // Extraer las observaciones como un array de números
                    const observaciones = [
                        parseFloat(row["Observacion 1"]) || 0,
                        parseFloat(row["Observacion 2"]) || 0,
                        parseFloat(row["Observacion 3"]) || 0,
                        parseFloat(row["Observacion 4"]) || 0,
                        parseFloat(row["Observacion 5"]) || 0
                    ];

                    // Cálculo del promedio
                    const promedio = observaciones.reduce((sum, value) => sum + value, 0) / observaciones.length;

                    // Cálculo de la desviación estándar muestral
                    const desviacionEstandar = Math.sqrt(
                        observaciones.reduce((sum, value) => sum + Math.pow(value - promedio, 2), 0) / (observaciones.length - 1)
                    );

                    // Almacenar el cálculo en el array
                    calculos.push({
                        muestra: row.Muestra,
                        promedio: promedio.toFixed(2), // Limitar a 2 decimales
                        desviacionEstandar: desviacionEstandar.toFixed(5) // Aquí ya no hay error
                    });

                    // Agregar a etiquetas y promedios para la gráfica
                    etiquetas.push(row.Muestra);
                    _desviacionEstandar.push(desviacionEstandar.toFixed(2)); // Usar desviacionEstandar
                });

                // Insertar los cálculos en la tabla de resultados
                calculos.forEach(calc => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${calc.muestra}</td>
                        <td>${calc.promedio}</td>
                        <td>${calc.desviacionEstandar}</td>
                    `;
                    resultadosBody.appendChild(tr);
                });

                // Crear la gráfica
                crearGrafica(etiquetas, _desviacionEstandar);
            })
            .catch(error => console.error('Error al obtener los datos:', error));
    });

    function crearGrafica(etiquetas, _desviacionEstandar) {
        const ctx = document.getElementById('miGrafica').getContext('2d');
        
        window.miGrafica = new Chart(ctx, {
            type: 'line', // Cambia el tipo de gráfica si lo deseas
            data: {
                labels: etiquetas,
                datasets: [{
                    label: 'Desviacion Estandar',
                    data: _desviacionEstandar,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
});
