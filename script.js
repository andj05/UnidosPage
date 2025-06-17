
        // Configuración de Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyARK4R62bM5hO7chCgg8syZHVQq7ZTGdAg",
            authDomain: "softball-stats-c786a.firebaseapp.com",
            databaseURL: "https://softball-stats-c786a-default-rtdb.firebaseio.com",
            projectId: "softball-stats-c786a",
            storageBucket: "softball-stats-c786a.firebasestorage.app",
            messagingSenderId: "587645625152",
            appId: "1:587645625152:web:89bcc8b309cec0dc2b50a5",
            measurementId: "G-TBQ7SJZQQ4"
        };

        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        // Variables globales
        let jugadores = [];
        let juegos = [];
        let estadisticas = [];
        let posiciones = [];
        let equiposContrarios = [];

        // Función para mostrar secciones
        function showSection(sectionId) {
            // Ocultar todas las secciones
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });

            // Mostrar la sección seleccionada
            document.getElementById(sectionId).classList.add('active');

            // Actualizar botones de navegación
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
        }

        // Función para cargar datos iniciales
        async function cargarDatosIniciales() {
            try {
                // Cargar posiciones
                await cargarPosiciones();

                // Cargar equipos contrarios
                await cargarEquiposContrarios();

                // Cargar jugadores
                await cargarJugadores();

                // Cargar juegos
                await cargarJuegos();

                // Cargar estadísticas
                await cargarEstadisticas();

                // Actualizar dashboard
                actualizarDashboard();

            } catch (error) {
                console.error('Error cargando datos iniciales:', error);
            }
        }

        // Función para cargar posiciones
        async function cargarPosiciones() {
            try {
                const posicionesSnapshot = await db.collection('posiciones').get();
                posiciones = posicionesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Si no hay posiciones, crear las básicas
                if (posiciones.length === 0) {
                    const posicionesBasicas = [
                        { nombre: 'Pitcher', descripcion: 'Lanzador' },
                        { nombre: 'Catcher', descripcion: 'Receptor' },
                        { nombre: 'Primera Base', descripcion: 'Primera base' },
                        { nombre: 'Segunda Base', descripcion: 'Segunda base' },
                        { nombre: 'Tercera Base', descripcion: 'Tercera base' },
                        { nombre: 'Short Stop', descripcion: 'Parador en corto' },
                        { nombre: 'Left Field', descripcion: 'Jardín izquierdo' },
                        { nombre: 'Center Field', descripcion: 'Jardín central' },
                        { nombre: 'Right Field', descripcion: 'Jardín derecho' },
                        { nombre: 'Utility', descripcion: 'Utilidad' }
                    ];

                    for (const posicion of posicionesBasicas) {
                        const docRef = await db.collection('posiciones').add(posicion);
                        posiciones.push({ id: docRef.id, ...posicion });
                    }
                }

                // Actualizar select de posiciones
                const selectPosicion = document.getElementById('posicion-primaria');
                selectPosicion.innerHTML = '<option value="">Seleccionar posición</option>';
                posiciones.forEach(posicion => {
                    const option = document.createElement('option');
                    option.value = posicion.id;
                    option.textContent = posicion.nombre;
                    selectPosicion.appendChild(option);
                });

            } catch (error) {
                console.error('Error cargando posiciones:', error);
            }
        }

        async function cargarEquiposContrarios() {
            try {
                const equiposSnapshot = await db.collection('equipos-contrarios').get();
                equiposContrarios = equiposSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Actualizar select de equipos
                actualizarSelectEquipos();

            } catch (error) {
                console.error('Error cargando equipos contrarios:', error);
            }
        }

        // Función para actualizar el select de equipos
        function actualizarSelectEquipos() {
            const selectEquipo = document.getElementById('equipo-contrario');
            selectEquipo.innerHTML = `
        <option value="">Seleccionar equipo existente</option>
        <option value="nuevo">➕ Agregar nuevo equipo</option>
    `;

            equiposContrarios.forEach(equipo => {
                const option = document.createElement('option');
                option.value = equipo.id;
                option.textContent = `${equipo.nombre} (${equipo.ciudad || 'Sin ciudad'})`;
                selectEquipo.appendChild(option);
            });
        }

        // Event listeners para el manejo de equipos
        document.addEventListener('DOMContentLoaded', function () {
            // Mostrar/ocultar campos de nuevo equipo
            document.getElementById('equipo-contrario').addEventListener('change', function () {
                const nuevoEquipoFields = document.getElementById('nuevo-equipo-fields');
                if (this.value === 'nuevo') {
                    nuevoEquipoFields.style.display = 'block';
                    document.getElementById('nombre-nuevo-equipo').focus();
                } else {
                    nuevoEquipoFields.style.display = 'none';
                    limpiarCamposNuevoEquipo();
                }
            });

            // Agregar nuevo equipo
            document.getElementById('btn-agregar-equipo').addEventListener('click', async function () {
                const nombre = document.getElementById('nombre-nuevo-equipo').value.trim();
                const ciudad = document.getElementById('ciudad-nuevo-equipo').value.trim();

                if (!nombre) {
                    mostrarAlerta('Por favor ingresa el nombre del equipo', 'error');
                    return;
                }

                try {
                    // Verificar si el equipo ya existe
                    const equipoExistente = equiposContrarios.find(e =>
                        e.nombre.toLowerCase() === nombre.toLowerCase()
                    );

                    if (equipoExistente) {
                        mostrarAlerta('Ya existe un equipo con ese nombre', 'error');
                        return;
                    }

                    const nuevoEquipo = {
                        nombre: nombre,
                        ciudad: ciudad || 'No especificada',
                        fechaCreacion: firebase.firestore.Timestamp.now()
                    };

                    // Guardar en Firebase
                    const docRef = await db.collection('equipos-contrarios').add(nuevoEquipo);

                    // Agregar a la lista local
                    equiposContrarios.push({ id: docRef.id, ...nuevoEquipo });

                    // Actualizar select
                    actualizarSelectEquipos();

                    // Seleccionar el nuevo equipo automáticamente
                    document.getElementById('equipo-contrario').value = docRef.id;

                    // Ocultar campos y limpiar
                    document.getElementById('nuevo-equipo-fields').style.display = 'none';
                    limpiarCamposNuevoEquipo();

                    mostrarAlerta(`Equipo "${nombre}" agregado exitosamente`, 'success');

                } catch (error) {
                    console.error('Error agregando equipo:', error);
                    mostrarAlerta('Error al agregar el equipo', 'error');
                }
            });

            // Cancelar agregar equipo
            document.getElementById('btn-cancelar-equipo').addEventListener('click', function () {
                document.getElementById('equipo-contrario').value = '';
                document.getElementById('nuevo-equipo-fields').style.display = 'none';
                limpiarCamposNuevoEquipo();
            });

            // Botón para gestionar equipos (abrir modal o sección)
            document.getElementById('btn-gestionar-equipos').addEventListener('click', function () {
                mostrarModalGestionEquipos();
            });
        });

        // Función para limpiar campos de nuevo equipo
        function limpiarCamposNuevoEquipo() {
            document.getElementById('nombre-nuevo-equipo').value = '';
            document.getElementById('ciudad-nuevo-equipo').value = '';
        }

        // Función para mostrar modal de gestión de equipos
        function mostrarModalGestionEquipos() {
            // Crear modal dinámicamente
            const modal = document.createElement('div');
            modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 1000; display: flex; 
        justify-content: center; align-items: center;
    `;

            modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">Gestionar Equipos Contrarios</h3>
                <button id="cerrar-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">✗</button>
            </div>
            <div id="lista-equipos-modal" style="margin-bottom: 1rem;">
                ${equiposContrarios.map(equipo => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #eee;">
                        <span><strong>${equipo.nombre}</strong> - ${equipo.ciudad}</span>
                        <button onclick="eliminarEquipo('${equipo.id}')" style="background: #dc3545; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer;">Eliminar</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

            document.body.appendChild(modal);

            // Cerrar modal
            modal.querySelector('#cerrar-modal').addEventListener('click', function () {
                document.body.removeChild(modal);
            });

            // Cerrar al hacer clic fuera
            modal.addEventListener('click', function (e) {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        }

        // Función para eliminar equipo
        async function eliminarEquipo(equipoId) {
            if (!confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
                return;
            }

            try {
                await db.collection('equipos-contrarios').doc(equipoId).delete();
                equiposContrarios = equiposContrarios.filter(e => e.id !== equipoId);
                actualizarSelectEquipos();
                mostrarAlerta('Equipo eliminado exitosamente', 'success');

                // Cerrar modal si está abierto
                const modal = document.querySelector('div[style*="position: fixed"]');
                if (modal) {
                    document.body.removeChild(modal);
                }

            } catch (error) {
                console.error('Error eliminando equipo:', error);
                mostrarAlerta('Error al eliminar el equipo', 'error');
            }
        }


        // Función para cargar jugadores
        async function cargarJugadores() {
            try {
                const jugadoresSnapshot = await db.collection('jugadores').get();
                jugadores = jugadoresSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Actualizar tabla de jugadores
                const tbody = document.getElementById('lista-jugadores');
                if (jugadores.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No hay jugadores registrados</td></tr>';
                } else {
                    tbody.innerHTML = jugadores.map(jugador => {
                        const posicion = posiciones.find(p => p.id === jugador.posicionPrimariaId);
                        return `
                            <tr>
                                <td><strong>#${jugador.numeroJugador}</strong></td>
                                <td>${jugador.nombre} ${jugador.apellido}</td>
                                <td>${posicion ? posicion.nombre : 'N/A'}</td>
                                <td>${jugador.telefono || 'N/A'}</td>
                                <td>${jugador.email || 'N/A'}</td>
                                <td>
                                    <button class="btn-secondary" onclick="editarJugador('${jugador.id}')">Editar</button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }

                // Actualizar selects de jugadores
                actualizarSelectsJugadores();

            } catch (error) {
                console.error('Error cargando jugadores:', error);
            }
        }

        // Función para actualizar selects de jugadores
        function actualizarSelectsJugadores() {
            const selectJugador = document.getElementById('jugador-estadistica');
            selectJugador.innerHTML = '<option value="">Seleccionar jugador</option>';
            jugadores.forEach(jugador => {
                const option = document.createElement('option');
                option.value = jugador.id;
                option.textContent = `#${jugador.numeroJugador} - ${jugador.nombre} ${jugador.apellido}`;
                selectJugador.appendChild(option);
            });
        }

        // Función para cargar juegos
        async function cargarJuegos() {
            try {
                const juegosSnapshot = await db.collection('juegos').orderBy('fecha', 'desc').get();
                juegos = juegosSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Actualizar tabla de juegos
                const tbody = document.getElementById('lista-juegos');
                if (juegos.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No hay juegos registrados</td></tr>';
                } else {
                    tbody.innerHTML = juegos.map(juego => {
                        const equipo = equiposContrarios.find(e => e.id === juego.equipoContrarioId);
                        const resultado = juego.carrerasYayeros > juego.carrerasContrario ? 'Victoria' : 'Derrota';
                        const resultadoColor = resultado === 'Victoria' ? 'color: #28a745; font-weight: bold;' : 'color: #dc3545; font-weight: bold;';

                        return `
                            <tr>
                                <td>${new Date(juego.fecha.toDate()).toLocaleDateString()}</td>
                                <td>${equipo ? equipo.nombre : 'N/A'}</td>
                                <td style="${resultadoColor}">${juego.carrerasYayeros} - ${juego.carrerasContrario} (${resultado})</td>
                                <td>${juego.ubicacion}</td>
                                <td>${juego.esLocal ? 'Local' : 'Visitante'}</td>
                                <td>
                                    <button class="btn-secondary" onclick="verDetallesJuego('${juego.id}')">Ver</button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }

                // Actualizar select de juegos para estadísticas
                const selectJuego = document.getElementById('juego-estadistica');
                selectJuego.innerHTML = '<option value="">Seleccionar juego</option>';
                juegos.forEach(juego => {
                    const equipo = equiposContrarios.find(e => e.id === juego.equipoContrarioId);
                    const fecha = new Date(juego.fecha.toDate()).toLocaleDateString();
                    const option = document.createElement('option');
                    option.value = juego.id;
                    option.textContent = `${fecha} vs ${equipo ? equipo.nombre : 'N/A'}`;
                    selectJuego.appendChild(option);
                });

            } catch (error) {
                console.error('Error cargando juegos:', error);
            }
        }

        // Función para cargar estadísticas
        async function cargarEstadisticas() {
            try {
                const estadisticasSnapshot = await db.collection('estadisticas-bateo').get();
                estadisticas = estadisticasSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

            } catch (error) {
                console.error('Error cargando estadísticas:', error);
            }
        }

        // Función para actualizar dashboard
        function actualizarDashboard() {
            // Total jugadores
            document.getElementById('total-jugadores').textContent = jugadores.length;

            // Total juegos
            document.getElementById('total-juegos').textContent = juegos.length;

            // Total victorias
            const victorias = juegos.filter(juego => juego.carrerasYayeros > juego.carrerasContrario).length;
            document.getElementById('total-victorias').textContent = victorias;

            // Calcular promedio del equipo
            if (estadisticas.length > 0) {
                const totalTurnos = estadisticas.reduce((sum, est) => sum + (est.turnosAlBate || 0), 0);
                const totalHits = estadisticas.reduce((sum, est) => sum + (est.hits || 0), 0);
                const promedioEquipo = totalTurnos > 0 ? (totalHits / totalTurnos).toFixed(3) : '.000';
                document.getElementById('promedio-equipo').textContent = promedioEquipo;
            }

            // Actualizar tabla de líderes
            actualizarLideresBateo();
        }

        // Función para actualizar líderes de bateo
        function actualizarLideresBateo() {
            const tbody = document.getElementById('lideres-bateo');

            if (estadisticas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No hay estadísticas registradas</td></tr>';
                return;
            }

            // Agrupar estadísticas por jugador
            const estadisticasPorJugador = {};
            estadisticas.forEach(est => {
                if (!estadisticasPorJugador[est.jugadorId]) {
                    estadisticasPorJugador[est.jugadorId] = {
                        turnosAlBate: 0,
                        hits: 0,
                        homeRuns: 0,
                        rbi: 0
                    };
                }
                estadisticasPorJugador[est.jugadorId].turnosAlBate += est.turnosAlBate || 0;
                estadisticasPorJugador[est.jugadorId].hits += est.hits || 0;
                estadisticasPorJugador[est.jugadorId].homeRuns += est.homeRuns || 0;
                estadisticasPorJugador[est.jugadorId].rbi += est.rbi || 0;
            });

            // Convertir a array y calcular promedios
            const lideres = Object.keys(estadisticasPorJugador).map(jugadorId => {
                const jugador = jugadores.find(j => j.id === jugadorId);
                const stats = estadisticasPorJugador[jugadorId];
                const promedio = stats.turnosAlBate > 0 ? (stats.hits / stats.turnosAlBate).toFixed(3) : '.000';

                return {
                    jugador: jugador ? `${jugador.nombre} ${jugador.apellido}` : 'N/A',
                    promedio: promedio,
                    homeRuns: stats.homeRuns,
                    rbi: stats.rbi,
                    hits: stats.hits
                };
            });

            // Ordenar por promedio de bateo
            lideres.sort((a, b) => parseFloat(b.promedio) - parseFloat(a.promedio));

            // Mostrar top 5
            const top5 = lideres.slice(0, 5);
            tbody.innerHTML = top5.map(lider => `
                <tr>
                    <td>${lider.jugador}</td>
                    <td><strong>${lider.promedio}</strong></td>
                    <td>${lider.homeRuns}</td>
                    <td>${lider.rbi}</td>
                    <td>${lider.hits}</td>
                </tr>
            `).join('');
        }

        // Event listeners para formularios
        document.getElementById('form-jugador').addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const jugadorData = {
                    numeroJugador: parseInt(document.getElementById('numero-jugador').value),
                    nombre: document.getElementById('nombre-jugador').value,
                    apellido: document.getElementById('apellido-jugador').value,
                    posicionPrimariaId: document.getElementById('posicion-primaria').value,
                    telefono: document.getElementById('telefono-jugador').value,
                    email: document.getElementById('email-jugador').value,
                    fechaIngreso: firebase.firestore.Timestamp.now(),
                    activo: true
                };

                await db.collection('jugadores').add(jugadorData);

                // Mostrar mensaje de éxito
                mostrarAlerta('Jugador registrado exitosamente', 'success');

                // Limpiar formulario
                document.getElementById('form-jugador').reset();

                // Recargar jugadores
                await cargarJugadores();
                actualizarDashboard();

            } catch (error) {
                console.error('Error registrando jugador:', error);
                mostrarAlerta('Error al registrar jugador', 'error');
            }
        });

        document.getElementById('form-juego').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const fechaInput = document.getElementById('fecha-juego').value;
        const [año, mes, dia] = fechaInput.split('-');
        const fechaCorrecta = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));

        const juegoData = {
            fecha: firebase.firestore.Timestamp.fromDate(fechaCorrecta),
            
            equipoContrarioId: document.getElementById('equipo-contrario').value,
            carrerasYayeros: parseInt(document.getElementById('carreras-yayeros').value),
            carrerasContrario: parseInt(document.getElementById('carreras-contrario').value),
            ubicacion: document.getElementById('ubicacion-juego').value,
            esLocal: document.getElementById('es-local').value === 'true',
            ganado: parseInt(document.getElementById('carreras-yayeros').value) > parseInt(document.getElementById('carreras-contrario').value),
            innings: 7
        };

        await db.collection('juegos').add(juegoData);

        mostrarAlerta('Juego registrado exitosamente', 'success');
        document.getElementById('form-juego').reset();

        await cargarJuegos();
        actualizarDashboard();

    } catch (error) {
        console.error('Error registrando juego:', error);
        mostrarAlerta('Error al registrar juego', 'error');
    }
});

        document.getElementById('form-estadisticas').addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const estadisticaData = {
                    jugadorId: document.getElementById('jugador-estadistica').value,
                    juegoId: document.getElementById('juego-estadistica').value,
                    turnosAlBate: parseInt(document.getElementById('turnos-bate').value),
                    hits: parseInt(document.getElementById('hits').value),
                    dobles: parseInt(document.getElementById('dobles').value),
                    triples: parseInt(document.getElementById('triples').value),
                    homeRuns: parseInt(document.getElementById('homeruns').value),
                    rbi: parseInt(document.getElementById('rbi').value),
                    sencillos: parseInt(document.getElementById('hits').value) -
                        parseInt(document.getElementById('dobles').value) -
                        parseInt(document.getElementById('triples').value) -
                        parseInt(document.getElementById('homeruns').value)
                };

                await db.collection('estadisticas-bateo').add(estadisticaData);

                mostrarAlerta('Estadísticas registradas exitosamente', 'success');
                document.getElementById('form-estadisticas').reset();

                await cargarEstadisticas();
                actualizarDashboard();

            } catch (error) {
                console.error('Error registrando estadísticas:', error);
                mostrarAlerta('Error al registrar estadísticas', 'error');
            }
        });

        // Función para mostrar alertas
        function mostrarAlerta(mensaje, tipo) {
            const alertaExistente = document.querySelector('.alert');
            if (alertaExistente) {
                alertaExistente.remove();
            }

            const alerta = document.createElement('div');
            alerta.className = `alert alert-${tipo}`;
            alerta.textContent = mensaje;

            document.querySelector('.container').insertBefore(alerta, document.querySelector('.container').firstChild);

            setTimeout(() => {
                alerta.remove();
            }, 5000);
        }
        //Ojo : Hay qye terminar eso 
        // Funciones placeholder para acciones adicionales
        function editarJugador(jugadorId) {
            // Implementar edición de jugador
            console.log('Editar jugador:', jugadorId);
        }

        // Función para mostrar la ventana de selección de jugadores
function mostrarModalSeleccionJugador() {
    const modalHTML = `
        <div id="modal-seleccion-jugador" class="modal-overlay" onclick="cerrarModalSeleccion(event)">
            <div class="modal-detalle modal-seleccion-grande">
                <div class="modal-header-detalle">
                    <div class="titulo-juego">
                        <h2>👥 Seleccionar Jugador</h2>
                        <p>Elige un jugador para ver sus estadísticas completas</p>
                    </div>
                    <button class="btn-cerrar" onclick="cerrarModalSeleccion()">&times;</button>
                </div>
                
                <div class="contenido-modal contenido-seleccion">
                    <div id="lista-jugadores-modal" class="lista-jugadores-mejorada">
                        <div class="loading-jugadores">
                            <div class="spinner-small"></div>
                            <p>Cargando jugadores...</p>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer-detalle">
                    <button onclick="cerrarModalSeleccion()" class="btn-cerrar-modal">
                        <span>✗</span> Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    cargarJugadoresEnModal();
}

// Función para cargar la lista de jugadores en el modal
async function cargarJugadoresEnModal() {
    try {
        console.log('Intentando cargar jugadores...');
        const jugadoresSnapshot = await db.collection('jugadores').get();
        console.log('Jugadores encontrados:', jugadoresSnapshot.size);
        
        const listaContainer = document.getElementById('lista-jugadores-modal');
        
        if (jugadoresSnapshot.empty) {
            console.log('No hay jugadores en la base de datos');
            listaContainer.innerHTML = `
                <div class="no-datos-mejorado">
                    <h4>📭 No hay jugadores registrados</h4>
                    <p>Agrega jugadores desde la sección de Roster para poder ver sus estadísticas.</p>
                </div>
            `;
            return;
        }
        
        // Cargar posiciones para mostrar el nombre de la posición
        const posicionesSnapshot = await db.collection('posiciones').get();
        const posicionesMap = {};
        posicionesSnapshot.forEach(doc => {
            posicionesMap[doc.id] = doc.data().nombre;
        });
        
        // Agrupar jugadores por posición
        const jugadoresPorPosicion = {};
        jugadoresSnapshot.forEach(doc => {
            const jugador = doc.data();
            const nombrePosicion = jugador.posicionPrimariaId ? 
                posicionesMap[jugador.posicionPrimariaId] || 'Sin posición' : 
                'Sin posición';
            
            if (!jugadoresPorPosicion[nombrePosicion]) {
                jugadoresPorPosicion[nombrePosicion] = [];
            }
            
            jugadoresPorPosicion[nombrePosicion].push({
                id: doc.id,
                ...jugador,
                posicionNombre: nombrePosicion
            });
        });
        
        // Generar HTML agrupado por posición
        let jugadoresHTML = '';
        
        Object.keys(jugadoresPorPosicion).sort().forEach(posicion => {
            const jugadoresPosicion = jugadoresPorPosicion[posicion];
            
            jugadoresHTML += `
                <div class="position-group">
                    <div class="position-header">
                        <div class="position-title">${posicion}</div>
                    </div>
            `;
            
            jugadoresPosicion.forEach(jugador => {
                const nombreCompleto = jugador.apellido ? 
                    `${jugador.nombre} ${jugador.apellido}` : 
                    jugador.nombre;
                
                jugadoresHTML += `
                    <div class="player-card-new" onclick="mostrarEstadisticasJugador('${jugador.id}', '${nombreCompleto}')">
                        <div class="player-info-new">
                            <div class="player-number-new">#${jugador.numeroJugador || '??'}</div>
                            <div class="player-details-new">
                                <div class="player-name-new">
                                    👤 ${nombreCompleto}
                                </div>
                                <div class="player-position-new">${posicion}</div>
                            </div>
                            <button class="stats-button-new" onclick="event.stopPropagation(); mostrarEstadisticasJugador('${jugador.id}', '${nombreCompleto}')">
                                Ver Stats
                            </button>
                        </div>
                    </div>
                `;
            });
            
            jugadoresHTML += `</div>`;
        });
        
        listaContainer.innerHTML = jugadoresHTML;
        console.log('HTML de jugadores generado');
    } catch (error) {
        console.error('Error al cargar jugadores:', error);
        const listaContainer = document.getElementById('lista-jugadores-modal');
        if (listaContainer) {
            listaContainer.innerHTML = `
                <div class="error-mejorado">
                    <h4>❌ Error al cargar jugadores</h4>
                    <p>${error.message}</p>
                    <button onclick="cargarJugadoresEnModal()" class="btn-ver" style="margin-top: 1rem;">
                        🔄 Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Función para mostrar las estadísticas completas de un jugador
async function mostrarEstadisticasJugador(jugadorId, nombreJugador) {
    try {
        // Cerrar el modal de selección
        cerrarModalSeleccion();
        
        // Mostrar loading
        mostrarLoading();
        
        // Obtener todas las estadísticas del jugador
        const estadisticasSnapshot = await db.collection('estadisticas-bateo')
            .where('jugadorId', '==', jugadorId)
            .get();
        
        if (estadisticasSnapshot.empty) {
            cerrarLoading();
            mostrarMensaje('Este jugador no tiene estadísticas registradas', 'info');
            return;
        }
        
        // Obtener los datos de los juegos para cada estadística usando tu lógica
        const estadisticasConJuegos = [];
        let totales = {
            juegos: 0,
            turnosAlBate: 0,
            hits: 0,
            sencillos: 0,
            dobles: 0,
            triples: 0,
            homeRuns: 0,
            rbi: 0
        };
        
        for (const doc of estadisticasSnapshot.docs) {
            const estadistica = { id: doc.id, ...doc.data() };
            
            // Obtener datos del juego
            const juegoDoc = await db.collection('juegos').doc(estadistica.juegoId).get();
            
            if (juegoDoc.exists) {
                const juego = juegoDoc.data();
                
                // Obtener nombre del equipo contrario
                let nombreEquipoContrario = 'Contrario';
                if (juego.equipoContrarioId) {
                    const equipoDoc = await db.collection('equipos-contrarios').doc(juego.equipoContrarioId).get();
                    if (equipoDoc.exists) {
                        nombreEquipoContrario = equipoDoc.data().nombre;
                    }
                }
                
                estadisticasConJuegos.push({
                    ...estadistica,
                    juego: juego,
                    fecha: juego.fecha,
                    equipoContrario: nombreEquipoContrario,
                    turnosAlBate: estadistica.turnosAlBate || 0,
                    hits: estadistica.hits || 0,
                    sencillos: estadistica.sencillos || 0,
                    dobles: estadistica.dobles || 0,
                    triples: estadistica.triples || 0,
                    homeRuns: estadistica.homeRuns || 0,
                    rbi: estadistica.rbi || 0
                });
                
                // Sumar a los totales
                totales.juegos++;
                totales.turnosAlBate += estadistica.turnosAlBate || 0;
                totales.hits += estadistica.hits || 0;
                totales.sencillos += estadistica.sencillos || 0;
                totales.dobles += estadistica.dobles || 0;
                totales.triples += estadistica.triples || 0;
                totales.homeRuns += estadistica.homeRuns || 0;
                totales.rbi += estadistica.rbi || 0;
            }
        }
        
        // Ordenar por fecha (más reciente primero)
        estadisticasConJuegos.sort((a, b) => b.fecha.toDate() - a.fecha.toDate());
        
        cerrarLoading();
        mostrarModalEstadisticasJugador(nombreJugador, estadisticasConJuegos, totales);
        
    } catch (error) {
        console.error('Error al cargar estadísticas del jugador:', error);
        cerrarLoading();
        mostrarMensaje('Error al cargar las estadísticas del jugador: ' + error.message, 'error');
    }
}

// Función para mostrar el modal con todas las estadísticas del jugador
function mostrarModalEstadisticasJugador(nombreJugador, estadisticas, totales) {
    const promedioGeneral = totales.turnosAlBate > 0 ? (totales.hits / totales.turnosAlBate).toFixed(3) : '.000';
    
    const modalHTML = `
        <div id="modal-estadisticas-jugador" class="modal-overlay" onclick="cerrarModalEstadisticas(event)">
            <div class="modal-detalle" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header-detalle">
                    <div class="titulo-juego">
                        <h2>📊 Estadísticas de ${nombreJugador}</h2>
                        <p>Historial completo de rendimiento</p>
                    </div>
                    <button class="btn-cerrar" onclick="cerrarModalEstadisticas()">&times;</button>
                </div>
                
                <div class="contenido-modal">
                    <!-- Resumen de totales -->
                    <div class="resumen-totales">
                        <h3>🏆 Resumen de Temporada</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-numero">${totales.juegos}</div>
                                <div class="stat-label">Juegos</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-numero">${totales.turnosAlBate}</div>
                                <div class="stat-label">Turnos al Bate</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-numero">${totales.hits}</div>
                                <div class="stat-label">Hits</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-numero">${totales.homeRuns}</div>
                                <div class="stat-label">Home Runs</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-numero">${totales.rbi}</div>
                                <div class="stat-label">RBI</div>
                            </div>
                            <div class="stat-card destacada">
                                <div class="stat-numero">${promedioGeneral}</div>
                                <div class="stat-label">Promedio</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Historial detallado -->
                    <div class="seccion-estadisticas">
                        <h3>📋 Historial por Juego</h3>
                        <div class="tabla-container">
                            <table class="tabla-estadisticas">
                                <thead>
                                    <tr>
                                        <th>📅 Fecha</th>
                                        <th>🆚 Vs</th>
                                        <th>📍 Ubicación</th>
                                        <th>⚾ AB</th>
                                        <th>🎯 H</th>
                                        <th>1️⃣ 1B</th>
                                        <th>2️⃣ 2B</th>
                                        <th>3️⃣ 3B</th>
                                        <th>💥 HR</th>
                                        <th>🏃 RBI</th>
                                        <th>📊 AVG</th>
                                        <th>🏆 Resultado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${estadisticas.map(stat => {
                                        const fecha = stat.fecha.toDate().toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        });
                                        const avg = stat.turnosAlBate > 0 ? (stat.hits / stat.turnosAlBate).toFixed(3) : '.000';
                                        const resultado = stat.juego.ganado ? 'W' : 'L';
                                        const resultadoClass = stat.juego.ganado ? 'victoria' : 'derrota';
                                        
                                        return `
                                            <tr>
                                                <td>${fecha}</td>
                                                <td class="vs-column">${stat.equipoContrario || 'Contrario'}</td>
                                                <td>${stat.juego.ubicacion}</td>
                                                <td>${stat.turnosAlBate}</td>
                                                <td class="stat-destacada">${stat.hits}</td>
                                                <td>${stat.sencillos || 0}</td>
                                                <td>${stat.dobles || 0}</td>
                                                <td>${stat.triples || 0}</td>
                                                <td class="home-run">${stat.homeRuns || 0}</td>
                                                <td class="rbi">${stat.rbi || 0}</td>
                                                <td class="promedio">${avg}</td>
                                                <td class="resultado ${resultadoClass}">${resultado}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer-detalle">
                    <button onclick="cerrarModalEstadisticas()" class="btn-cerrar-modal">
                        <span>✓</span> Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    agregarEstilosEstadisticas();
}

// Función para agregar los estilos CSS específicos
function agregarEstilosEstadisticas() {
    if (document.getElementById('estilos-estadisticas-jugador')) return; // Ya están agregados
    
    const estilosEstadisticas = `
        <style id="estilos-estadisticas-jugador">
            .resumen-totales {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                padding: 2rem;
                border-radius: 8px;
                margin-bottom: 2rem;
                color: #333;
            }
            
            .resumen-totales h3 {
                color: #2c3e50;
                margin-bottom: 1.5rem;
                font-size: 1.3rem;
                font-weight: 600;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .stat-card {
                background: white;
                padding: 1.2rem;
                border-radius: 6px;
                text-align: center;
                border: 1px solid #e0e0e0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .stat-card.destacada {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            }
            
            .stat-numero {
                font-size: 1.8rem;
                font-weight: bold;
                margin-bottom: 0.3rem;
                color: #2c3e50;
            }
            
            .stat-label {
                font-size: 0.85rem;
                color: #6c757d;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .jugador-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                margin-bottom: 0.8rem;
                background: white;
                border: 2px solid #e9ecef;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            
            .jugador-item:hover {
                background: #f8f9fa;
                border-color: #007bff;
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0,123,255,0.15);
            }
            
            .jugador-info {
                flex-grow: 1;
            }
            
            .jugador-info h4 {
                margin: 0 0 0.5rem 0;
                color: #2c3e50;
                font-size: 1.2rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .jugador-numero {
                background: #007bff;
                color: white;
                padding: 0.2rem 0.6rem;
                border-radius: 6px;
                font-size: 0.9rem;
                font-weight: bold;
                min-width: 45px;
                text-align: center;
            }
            
            .jugador-info p {
                margin: 0;
                color: #6c757d;
                font-size: 1rem;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 0.3rem;
            }
            
            .btn-ver {
                background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                color: white;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0,123,255,0.3);
                min-width: 160px;
            }
            
            .btn-ver:hover {
                background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,123,255,0.4);
            }
            
            /* Estilos basados en tu diseño mejorado */
            .lista-jugadores-mejorada {
                max-height: 500px;
                overflow-y: auto;
                padding: 20px;
                background: #f8fafc;
            }
            
            /* Grupos de posición */
            .position-group {
                margin-bottom: 24px;
            }
            
            .position-header {
                background: #e2e8f0;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 12px;
            }
            
            .position-title {
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #374151 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                margin: 0 !important;
            }
            
            /* Tarjetas de jugador estilo nuevo */
            .player-card-new {
                background: white !important;
                border: 2px solid #e5e7eb !important;
                border-radius: 10px !important;
                padding: 16px !important;
                margin-bottom: 12px !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                position: relative !important;
            }
            
            .player-card-new:hover {
                border-color: #1e3a8a !important;
                box-shadow: 0 4px 12px rgba(30, 58, 138, 0.15) !important;
                transform: translateY(-2px) !important;
            }
            
            .player-info-new {
                display: flex !important;
                align-items: center !important;
                gap: 16px !important;
            }
            
            .player-number-new {
                background: #374151 !important;
                color: white !important;
                width: 48px !important;
                height: 48px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 16px !important;
                font-weight: 700 !important;
                flex-shrink: 0 !important;
            }
            
            .player-details-new {
                flex: 1 !important;
            }
            
            .player-name-new {
                font-size: 17px !important;
                font-weight: 600 !important;
                color: #111827 !important;
                margin-bottom: 4px !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
            }
            
            .player-position-new {
                font-size: 14px !important;
                color: #6b7280 !important;
                font-weight: 500 !important;
            }
            
            .position-icon-new {
                width: 20px !important;
                height: 20px !important;
                flex-shrink: 0 !important;
            }
            
            .stats-button-new {
                background: #1e3a8a !important;
                color: white !important;
                border: none !important;
                padding: 8px 16px !important;
                border-radius: 6px !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: background-color 0.2s !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
            }
            
            .stats-button-new:hover {
                background: #1e40af !important;
            }
            
            .stats-button-new:focus {
                outline: 2px solid #3b82f6 !important;
                outline-offset: 2px !important;
            }
            
            /* Modal header mejorado */
            .modal-header-detalle {
                background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%) !important;
                color: white !important;
                padding: 24px !important;
                text-align: center !important;
                border-radius: 12px 12px 0 0 !important;
            }
            
            .titulo-juego h2 {
                font-size: 20px !important;
                font-weight: 600 !important;
                margin-bottom: 8px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 12px !important;
                color: white !important;
            }
            
            .titulo-juego p {
                font-size: 15px !important;
                opacity: 0.9 !important;
                font-weight: 400 !important;
                color: white !important;
                margin: 0 !important;
            }
            
            .btn-cerrar {
                background: rgba(255, 255, 255, 0.2) !important;
                color: white !important;
                border: none !important;
                width: 32px !important;
                height: 32px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                position: absolute !important;
                top: 16px !important;
                right: 16px !important;
                font-size: 18px !important;
            }
            
            .btn-cerrar:hover {
                background: rgba(255, 255, 255, 0.3) !important;
                transform: scale(1.1) !important;
            }
            
            /* Modal mejorado */
            .modal-seleccion-grande {
                max-width: 600px !important;
                width: 90% !important;
                max-height: 85vh !important;
                background: white !important;
                border-radius: 12px !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
                overflow: hidden !important;
            }
            
            .contenido-seleccion {
                padding: 0 !important;
            }
            
            /* Scrollbar personalizado */
            .lista-jugadores-mejorada::-webkit-scrollbar {
                width: 8px;
            }
            
            .lista-jugadores-mejorada::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
            }
            
            .lista-jugadores-mejorada::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
            }
            
            .lista-jugadores-mejorada::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }
            
            /* Custom scrollbar */
            .lista-jugadores-mejorada::-webkit-scrollbar {
                width: 8px;
            }
            
            .lista-jugadores-mejorada::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            
            .lista-jugadores-mejorada::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 4px;
            }
            
            .lista-jugadores-mejorada::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
            
            .loading-jugadores {
                text-align: center;
                padding: 3rem;
                color: #6c757d;
            }
            
            .spinner-small {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #007bff;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem auto;
            }
            
            .no-datos-mejorado {
                text-align: center;
                padding: 3rem;
                color: #6c757d;
                background: #f8f9fa;
                border-radius: 12px;
                border: 2px dashed #dee2e6;
            }
            
            .no-datos-mejorado h4 {
                color: #495057;
                margin-bottom: 1rem;
                font-size: 1.2rem;
            }
            
            .error-mejorado {
                text-align: center;
                padding: 2rem;
                color: #721c24;
                background: #f8d7da;
                border: 2px solid #f5c6cb;
                border-radius: 12px;
            }
            
            /* Estilos de tabla mejorados */
            .seccion-estadisticas h3 {
                color: #2c3e50;
                margin-bottom: 1rem;
                font-size: 1.2rem;
                font-weight: 600;
            }
            
            .tabla-container {
                background: white;
                border-radius: 6px;
                overflow: hidden;
                border: 1px solid #dee2e6;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .tabla-estadisticas {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }
            
            .tabla-estadisticas thead th {
                background: #495057;
                color: white;
                padding: 0.75rem 0.5rem;
                text-align: center;
                font-weight: 600;
                font-size: 0.8rem;
                border-bottom: 2px solid #343a40;
            }
            
            .tabla-estadisticas tbody td {
                padding: 0.7rem 0.5rem;
                text-align: center;
                border-bottom: 1px solid #e9ecef;
                color: #495057;
                font-weight: 500;
            }
            
            .tabla-estadisticas tbody tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .tabla-estadisticas tbody tr:hover {
                background-color: #e3f2fd;
            }
            
            .stat-destacada {
                font-weight: bold;
                color: #007bff;
            }
            
            .home-run {
                font-weight: bold;
                color: #dc3545;
            }
            
            .rbi {
                font-weight: bold;
                color: #28a745;
            }
            
            .promedio {
                font-weight: bold;
                color: #6f42c1;
            }
            
            .vs-column {
                font-weight: 600;
                color: #495057;
            }
            
            .resultado.victoria {
                background: #28a745;
                color: white;
                padding: 0.2rem 0.4rem;
                border-radius: 3px;
                font-weight: bold;
                font-size: 0.8rem;
            }
            
            .resultado.derrota {
                background: #dc3545;
                color: white;
                padding: 0.2rem 0.4rem;
                border-radius: 3px;
                font-weight: bold;
                font-size: 0.8rem;
            }
            
            .lista-jugadores {
                max-height: 400px;
                overflow-y: auto;
                padding: 0.5rem;
            }
            
            .no-datos, .error {
                text-align: center;
                padding: 2rem;
                color: #6c757d;
                background: white;
                border-radius: 6px;
                border: 1px solid #e0e0e0;
            }
            
            .error {
                color: #dc3545;
                background: #f8d7da;
                border-color: #f5c6cb;
            }

            .estadisticas-actions {
                display: flex;
                justify-content: center;
                gap: 1rem;
            }

            .btn-ver-estadisticas {
                background: #007bff;
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 6px;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,123,255,0.3);
            }

            .btn-ver-estadisticas:hover {
                background: #0056b3;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0,123,255,0.4);
            }

            .btn-ver-estadisticas span {
                margin-right: 0.5rem;
            }

            /* Modal mejorado */
            .modal-overlay {
                background: rgba(0, 0, 0, 0.6);
            }
            
            .modal-detalle {
                background: white;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            }
            
            .modal-header-detalle {
                background: #f8f9fa;
                border-bottom: 1px solid #dee2e6;
                border-radius: 8px 8px 0 0;
                padding: 1.5rem;
            }
            
            .titulo-juego h2 {
                color: #2c3e50;
                font-size: 1.4rem;
                margin: 0;
                font-weight: 600;
            }
            
            .titulo-juego p {
                color: #6c757d;
                margin: 0.5rem 0 0 0;
                font-size: 0.9rem;
            }
            
            .btn-cerrar {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #6c757d;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            }
            
            .btn-cerrar:hover {
                background: #e9ecef;
                color: #495057;
            }
            
            .modal-footer-detalle {
                background: #f8f9fa;
                border-top: 1px solid #dee2e6;
                border-radius: 0 0 8px 8px;
                padding: 1rem 1.5rem;
                text-align: center;
            }
            
            .btn-cerrar-modal {
                background: #6c757d;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                font-size: 0.9rem;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .btn-cerrar-modal:hover {
                background: #5a6268;
            }

            /* Estilos para el spinner de loading */
            .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007bff;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem auto;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', estilosEstadisticas);
}

// Funciones para cerrar modales
function cerrarModalSeleccion(event) {
    if (event && event.target !== event.currentTarget) return;
    
    const modal = document.getElementById('modal-seleccion-jugador');
    if (modal) {
        modal.remove();
    }
}

function cerrarModalEstadisticas(event) {
    if (event && event.target !== event.currentTarget) return;
    
    const modal = document.getElementById('modal-estadisticas-jugador');
    const estilos = document.getElementById('estilos-estadisticas-jugador');
    
    if (modal) modal.remove();
    if (estilos) estilos.remove();
}

// Funciones auxiliares para loading y mensajes
function mostrarLoading() {
    const loadingHTML = `
        <div id="loading-overlay" class="modal-overlay">
            <div style="text-align: center; color: white;">
                <div class="spinner"></div>
                <p>Cargando estadísticas...</p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
}

function cerrarLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.remove();
}

function mostrarMensaje(mensaje, tipo = 'info') {
    const color = tipo === 'error' ? '#dc3545' : '#17a2b8';
    const icono = tipo === 'error' ? '❌' : 'ℹ️';
    
    const mensajeHTML = `
        <div id="mensaje-temporal" style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
        ">
            ${icono} ${mensaje}
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', mensajeHTML);
    
    setTimeout(() => {
        const mensaje = document.getElementById('mensaje-temporal');
        if (mensaje) mensaje.remove();
    }, 3000);
}
        async function verDetallesJuego(juegoId) {
    try {
        // Obtener datos del juego
        const juegoDoc = await db.collection('juegos').doc(juegoId).get();
        if (!juegoDoc.exists) {
            mostrarAlerta('Juego no encontrado', 'error');
            return;
        }
        
        const juego = { id: juegoDoc.id, ...juegoDoc.data() };
        
        // Obtener estadísticas de jugadores para este juego
        const estadisticasSnapshot = await db.collection('estadisticas-bateo')
            .where('juegoId', '==', juegoId)
            .get();
        
        if (estadisticasSnapshot.empty) {
            mostrarAlerta('No hay estadísticas registradas para este juego', 'info');
            return;
        }
        
        // Obtener datos de jugadores
        const jugadoresConEstadisticas = [];
        
        for (const doc of estadisticasSnapshot.docs) {
            const estadistica = { id: doc.id, ...doc.data() };
            
            // Obtener datos del jugador
            const jugadorDoc = await db.collection('jugadores').doc(estadistica.jugadorId).get();
            if (jugadorDoc.exists) {
                const jugador = jugadorDoc.data();
                jugadoresConEstadisticas.push({
                    nombre: jugador.nombre,
                    posicion: jugador.posicion,
                    turnosAlBate: estadistica.turnosAlBate || 0,
                    hits: estadistica.hits || 0,
                    sencillos: estadistica.sencillos || 0,
                    dobles: estadistica.dobles || 0,
                    triples: estadistica.triples || 0,
                    homeRuns: estadistica.homeRuns || 0,
                    rbi: estadistica.rbi || 0
                });
            }
        }
        
        // Mostrar modal simple
        mostrarModalSimple(juego, jugadoresConEstadisticas);
        
    } catch (error) {
        console.error('Error cargando detalles del juego:', error);
        mostrarAlerta('Error al cargar detalles del juego', 'error');
    }
}

function mostrarModalSimple(juego, jugadores) {
    const fecha = juego.fecha.toDate().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const resultado = juego.ganado ? 'VICTORIA' : 'DERROTA';
    const resultadoClass = juego.ganado ? 'victoria' : 'derrota';
    
    const modalHTML = `
        <div id="modal-detalles" class="modal-overlay" onclick="cerrarModalSimple(event)">
            <div class="modal-detalle">
                <div class="modal-header-detalle">
                    <div class="titulo-juego">
                        <h2>⚾ Detalles del Juego</h2>
                        <p class="fecha-juego">${fecha}</p>
                    </div>
                    <button class="btn-cerrar" onclick="cerrarModalSimple()">&times;</button>
                </div>
                
                <div class="contenido-modal">
                    <div class="resultado-juego">
                        <div class="marcador">
                            <div class="equipo-casa">
                                <h3>🏟️ Yayeros</h3>
                                <div class="score-grande">${juego.carrerasYayeros}</div>
                            </div>
                            <div class="vs-separator">VS</div>
                            <div class="equipo-visitante">
                                <h3>🚌 Contrario</h3>
                                <div class="score-grande">${juego.carrerasContrario}</div>
                            </div>
                        </div>
                        <div class="resultado-badge ${resultadoClass}">
                            ${resultado}
                        </div>
                    </div>
                    
                    <div class="info-juego">
                        <div class="info-item">
                            <span class="icono">📍</span>
                            <div>
                                <strong>Ubicación</strong>
                                <p>${juego.ubicacion}</p>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="icono">${juego.esLocal ? '🏠' : '✈️'}</span>
                            <div>
                                <strong>Tipo</strong>
                                <p>${juego.esLocal ? 'Juego Local' : 'Juego Visitante'}</p>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="icono">⚾</span>
                            <div>
                                <strong>Innings</strong>
                                <p>${juego.innings} innings</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="seccion-estadisticas">
                        <h3>🏆 Estadísticas de Bateo</h3>
                        <div class="tabla-container">
                            <table class="tabla-estadisticas">
                                <thead>
                                    <tr>
                                        <th>👤 Jugador</th>
                                        <th>📍 Pos</th>
                                        <th>⚾ AB</th>
                                        <th>🎯 H</th>
                                        <th>1️⃣ 1B</th>
                                        <th>2️⃣ 2B</th>
                                        <th>3️⃣ 3B</th>
                                        <th>💥 HR</th>
                                        <th>🏃 RBI</th>
                                        <th>📊 AVG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${jugadores.map(jugador => {
                                        const avg = jugador.turnosAlBate > 0 ? (jugador.hits / jugador.turnosAlBate).toFixed(3) : '.000';
                                        return `
                                            <tr>
                                                <td class="nombre-jugador">${jugador.nombre}</td>
                                                <td class="posicion">${jugador.posicion || 'N/A'}</td>
                                                <td>${jugador.turnosAlBate}</td>
                                                <td class="stat-destacada">${jugador.hits}</td>
                                                <td>${jugador.sencillos}</td>
                                                <td>${jugador.dobles}</td>
                                                <td>${jugador.triples}</td>
                                                <td class="home-run">${jugador.homeRuns}</td>
                                                <td class="rbi">${jugador.rbi}</td>
                                                <td class="promedio">${avg}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer-detalle">
                    <button onclick="cerrarModalSimple()" class="btn-cerrar-modal">
                        <span>✓</span> Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function cerrarModalSimple(event) {
    if (event && event.target !== event.currentTarget) return;
    
    const modal = document.getElementById('modal-detalles');
    if (modal) {
        modal.remove();
    }
}

        // Inicializar la aplicación
        document.addEventListener('DOMContentLoaded', function () {
            cargarDatosIniciales();
        });

        // Función para actualizar premios anuales
        function actualizarPremiosAnuales() {
            if (estadisticas.length === 0 || jugadores.length === 0) {
                // Si no hay estadísticas, mostrar valores por defecto
                document.getElementById('mvp-jugador').textContent = 'TBD';
                document.getElementById('hr-leader').textContent = '0';
                document.getElementById('avg-leader').textContent = '.000';
                document.getElementById('rbi-leader').textContent = '0';
                return;
            }

            // Agrupar estadísticas por jugador
            const estadisticasPorJugador = {};
            estadisticas.forEach(est => {
                if (!estadisticasPorJugador[est.jugadorId]) {
                    estadisticasPorJugador[est.jugadorId] = {
                        turnosAlBate: 0,
                        hits: 0,
                        homeRuns: 0,
                        rbi: 0,
                        dobles: 0,
                        triples: 0
                    };
                }
                estadisticasPorJugador[est.jugadorId].turnosAlBate += est.turnosAlBate || 0;
                estadisticasPorJugador[est.jugadorId].hits += est.hits || 0;
                estadisticasPorJugador[est.jugadorId].homeRuns += est.homeRuns || 0;
                estadisticasPorJugador[est.jugadorId].rbi += est.rbi || 0;
                estadisticasPorJugador[est.jugadorId].dobles += est.dobles || 0;
                estadisticasPorJugador[est.jugadorId].triples += est.triples || 0;
            });

            // Convertir a array con información del jugador
            const jugadoresConStats = Object.keys(estadisticasPorJugador).map(jugadorId => {
                const jugador = jugadores.find(j => j.id === jugadorId);
                const stats = estadisticasPorJugador[jugadorId];
                const promedio = stats.turnosAlBate > 0 ? (stats.hits / stats.turnosAlBate) : 0;

                // Calcular puntos MVP (fórmula simple: promedio * 100 + homeRuns * 10 + rbi * 2)
                const puntosMVP = (promedio * 100) + (stats.homeRuns * 10) + (stats.rbi * 2);

                return {
                    jugadorId: jugadorId,
                    nombre: jugador ? `${jugador.nombre} ${jugador.apellido}` : 'N/A',
                    nombreCorto: jugador ? `#${jugador.numeroJugador} ${jugador.nombre}` : 'N/A',
                    numeroJugador: jugador ? jugador.numeroJugador : '0',
                    promedio: promedio,
                    homeRuns: stats.homeRuns,
                    rbi: stats.rbi,
                    hits: stats.hits,
                    puntosMVP: puntosMVP,
                    turnosAlBate: stats.turnosAlBate
                };
            });

            // Filtrar jugadores con al menos 10 turnos al bate para promedios válidos
            const jugadoresElegibles = jugadoresConStats.filter(j => j.turnosAlBate >= 10);

            // Encontrar líderes
            let mvpJugador = 'TBD';
            let liderHomeRuns = { nombre: 'TBD', homeRuns: 0 };
            let mejorPromedio = { nombre: 'TBD', promedio: 0 };
            let liderRBI = { nombre: 'TBD', rbi: 0 };

            if (jugadoresConStats.length > 0) {
                // MVP - jugador con más puntos MVP
                const mvp = jugadoresConStats.reduce((max, jugador) =>
                    jugador.puntosMVP > max.puntosMVP ? jugador : max
                );
                mvpJugador = mvp.nombreCorto;

                // Líder en Home Runs
                const hrLeader = jugadoresConStats.reduce((max, jugador) =>
                    jugador.homeRuns > max.homeRuns ? jugador : max
                );
                liderHomeRuns = {
                    nombre: hrLeader.nombreCorto,
                    homeRuns: hrLeader.homeRuns
                };

                // Líder en RBI
                const rbiLeader = jugadoresConStats.reduce((max, jugador) =>
                    jugador.rbi > max.rbi ? jugador : max
                );
                liderRBI = {
                    nombre: rbiLeader.nombreCorto,
                    rbi: rbiLeader.rbi
                };

                // Mejor promedio (solo jugadores elegibles con mínimo de turnos)
                if (jugadoresElegibles.length > 0) {
                    const avgLeader = jugadoresElegibles.reduce((max, jugador) =>
                        jugador.promedio > max.promedio ? jugador : max
                    );
                    mejorPromedio = {
                        nombre: avgLeader.nombreCorto,
                        promedio: avgLeader.promedio
                    };
                }
            }

            // Actualizar elementos del DOM con formato mejorado
            document.getElementById('mvp-jugador').innerHTML = mvpJugador;

            // Para Home Runs - mostrar número grande y nombre pequeño debajo
            const hrElement = document.getElementById('hr-leader');
            if (liderHomeRuns.homeRuns > 0) {
                hrElement.innerHTML = `${liderHomeRuns.homeRuns}<br><small style="font-size: 0.6em; opacity: 0.8;">${liderHomeRuns.nombre}</small>`;
            } else {
                hrElement.innerHTML = '0';
            }

            // Para Promedio - mostrar promedio grande y nombre pequeño debajo
            const avgElement = document.getElementById('avg-leader');
            if (mejorPromedio.promedio > 0) {
                avgElement.innerHTML = `${mejorPromedio.promedio.toFixed(3)}<br><small style="font-size: 0.6em; opacity: 0.8;">${mejorPromedio.nombre}</small>`;
            } else {
                avgElement.innerHTML = '.000';
            }

            // Para RBI - mostrar número grande y nombre pequeño debajo
            const rbiElement = document.getElementById('rbi-leader');
            if (liderRBI.rbi > 0) {
                rbiElement.innerHTML = `${liderRBI.rbi}<br><small style="font-size: 0.6em; opacity: 0.8;">${liderRBI.nombre}</small>`;
            } else {
                rbiElement.innerHTML = '0';
            }
        }

        // Función mejorada para actualizar dashboard (incluye premios)
        function actualizarDashboard() {
            // Total jugadores
            document.getElementById('total-jugadores').textContent = jugadores.length;

            // Total juegos
            document.getElementById('total-juegos').textContent = juegos.length;

            // Total victorias
            const victorias = juegos.filter(juego => juego.carrerasYayeros > juego.carrerasContrario).length;
            document.getElementById('total-victorias').textContent = victorias;

            // Calcular promedio del equipo
            if (estadisticas.length > 0) {
                const totalTurnos = estadisticas.reduce((sum, est) => sum + (est.turnosAlBate || 0), 0);
                const totalHits = estadisticas.reduce((sum, est) => sum + (est.hits || 0), 0);
                const promedioEquipo = totalTurnos > 0 ? (totalHits / totalTurnos).toFixed(3) : '.000';
                document.getElementById('promedio-equipo').textContent = promedioEquipo;
            }

            // Actualizar tabla de líderes
            actualizarLideresBateo();

            // Actualizar premios anuales
            actualizarPremiosAnuales();
        }
