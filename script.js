
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
                const juegoData = {
                    fecha: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('fecha-juego').value)),
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

        // Funciones placeholder para acciones adicionales
        function editarJugador(jugadorId) {
            // Implementar edición de jugador
            console.log('Editar jugador:', jugadorId);
        }

        function verDetallesJuego(juegoId) {
            // Implementar vista de detalles del juego
            console.log('Ver detalles del juego:', juegoId);
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
