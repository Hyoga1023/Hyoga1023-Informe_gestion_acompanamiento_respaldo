/**
 * SISTEMA DE AUTOCOMPLETADO DE DATOS DE EMPLEADORES
 */

// Inicializar localForage
localforage.config({
    name: 'ProteccionDB',
    storeName: 'empleadores'
});

// Referencias a los campos del formulario
const inputNIT = document.getElementById('nit');
const inputEmpresa = document.getElementById('empresa');
const inputAsesor = document.getElementById('asesor');

// Referencias a los campos de gestión
const camposGestion = [
    'valorDeudaPresunta',
    'valorDeudaReal',
    'valorPagosPO',
    'valorAportesPO',
    'valorPagosCES',
    'valorPagosPV',
    'valorAportesPV',
    'alertaCiclo'
];

// Variable para almacenar la base de datos en memoria (cache)
// Ahora se almacena como objeto { nit: datosEmpleador } para búsqueda rápida
let baseEmpleadores = null;

/**
 * Cargar la base de datos en memoria al iniciar
 * Convierte el array del JSON a un objeto indexado por NIT
 */
async function cargarBaseEnMemoria() {
    try {
        const datosRaw = await localforage.getItem('baseEmpleadores');

        if (!datosRaw) {
            console.warn('⚠️ No hay base de datos de empleadores cargada');
            console.log('💡 Ve a "Cargar Base de Datos" en el menú para subir el archivo JSON');
            return false;
        }

        // Si viene como array dentro de "empleadores", lo convertimos a objeto indexado por NIT
        const lista = Array.isArray(datosRaw)
            ? datosRaw
            : (datosRaw.empleadores || Object.values(datosRaw));

        baseEmpleadores = {};
        lista.forEach(emp => {
            const nitLimpio = limpiarNIT(emp.nit);
            baseEmpleadores[nitLimpio] = emp;
        });

        const cantidad = Object.keys(baseEmpleadores).length;
        console.log(`✅ Base de empleadores cargada en memoria: ${cantidad} registros`);
        return true;

    } catch (error) {
        console.error('❌ Error al cargar base de empleadores:', error);
        return false;
    }
}

/**
 * Limpia el NIT quitando espacios, guiones y caracteres especiales
 */
function limpiarNIT(nit) {
    return nit.toString().replace(/[\s\-]/g, '').trim();
}

/**
 * Busca un empleador por NIT en la base de datos
 */
function buscarEmpleador(nit) {
    if (!baseEmpleadores) {
        console.warn('Base de datos no disponible');
        return null;
    }

    const nitLimpio = limpiarNIT(nit);
    return baseEmpleadores[nitLimpio] || null;
}

/**
 * Formatea el NIT mientras el usuario escribe (opcional)
 */
function formatearNIT(nit) {
    const soloNumeros = nit.replace(/\D/g, '');

    if (soloNumeros.length <= 3) {
        return soloNumeros;
    }

    const partes = [];
    let temp = soloNumeros;

    while (temp.length > 3) {
        partes.unshift(temp.slice(-3));
        temp = temp.slice(0, -3);
    }

    if (temp) {
        partes.unshift(temp);
    }

    return partes.join('-');
}

/**
 * Registra los listeners del flag en los campos de gestión
 * Si el usuario edita un campo, se marca como "modificado" y no se sobreescribe
 */
function registrarListenersCamposGestion() {
    camposGestion.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('input', function () {
                this.dataset.modificado = 'true';
            });
        }
    });
}

/**
 * Autocompleta todos los campos: empresa, asesor y campos de gestión
 * Respeta el flag dataset.modificado en los campos de gestión
 */
function autocompletarDatos(empleador) {
    if (!empleador) {
        inputEmpresa.value = '';
        inputAsesor.value = '';

        inputEmpresa.removeAttribute('readonly');
        inputAsesor.removeAttribute('readonly');

        inputEmpresa.style.backgroundColor = '#fff3cd';
        inputAsesor.style.backgroundColor = '#fff3cd';

        // Limpiar campos de gestión y resetear flags
        camposGestion.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                campo.value = '';
                delete campo.dataset.modificado;
                if (id === 'alertaCiclo') campo.classList.remove('con-valor');
            }
        });

        return;
    }

    // --- Campos fijos (razonSocial y asesor) ---
    // Compatible con ambas nomenclaturas: razonSocial / razon_social
    inputEmpresa.value = empleador.razonSocial || empleador.razon_social || '';
    inputAsesor.value = empleador.asesorComercial || empleador.asesor_comercial || '';

    inputEmpresa.setAttribute('readonly', 'true');
    inputAsesor.setAttribute('readonly', 'true');

    inputEmpresa.style.backgroundColor = '#d4edda';
    inputAsesor.style.backgroundColor = '#d4edda';

    setTimeout(() => {
        inputEmpresa.style.backgroundColor = '';
        inputAsesor.style.backgroundColor = '';
    }, 1500);

    // --- Campos de gestión ---
    // Solo se autocompletan si el usuario NO los ha modificado manualmente
    const mapeoGestion = {
        valorDeudaPresunta: empleador.valorDeudaPresunta || empleador.deuda_presunta || '',
        valorDeudaReal:     empleador.valorDeudaReal     || empleador.deuda_real     || '',
        valorPagosPO:       empleador.valorPagosPO       || empleador.pagos_po       || '',
        valorAportesPO:     empleador.valorAportesPO     || empleador.aportes_po     || '',
        valorPagosCES:      empleador.valorPagosCES      || empleador.pagos_ces      || '',
        valorPagosPV:       empleador.valorPagosPV       || empleador.pagos_pv       || '',
        valorAportesPV:     empleador.valorAportesPV     || empleador.aportes_pv     || '',
        alertaCiclo:        empleador.alertaCicloCobro   || empleador.alerta_ciclo_cobro || ''
    };

    camposGestion.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && !campo.dataset.modificado) {
            campo.value = mapeoGestion[id];

            // Flash visual igual que empresa/asesor
            campo.style.backgroundColor = '#d4edda';
            setTimeout(() => {
                campo.style.backgroundColor = '';

                // Para alertaCiclo, si tiene valor se mantiene el color amarillo
                if (id === 'alertaCiclo' && campo.value.trim()) {
                    campo.classList.add('con-valor');
                } else if (id === 'alertaCiclo') {
                    campo.classList.remove('con-valor');
                }
            }, 1500);
        }
    });

    console.log(`✅ Datos autocompletados para NIT: ${empleador.nit}`);
}

/**
 * Maneja el evento de cambio en el campo NIT
 */
async function manejarCambioNIT() {
    const nit = inputNIT.value.trim();

    if (!nit) {
        autocompletarDatos(null);
        return;
    }

    const empleador = buscarEmpleador(nit);

    if (empleador) {
        autocompletarDatos(empleador);
    } else {
        autocompletarDatos(null);

        if (limpiarNIT(nit).length >= 6) {
            console.log(`⚠️ No se encontró empleador con NIT: ${nit}`);
            mostrarTooltip(inputNIT, 'NIT no encontrado en la base de datos');
        }
    }
}

/**
 * Muestra un tooltip temporal en un elemento
 */
function mostrarTooltip(elemento, mensaje) {
    const tooltip = document.createElement('div');
    tooltip.textContent = mensaje;
    tooltip.style.cssText = `
        position: absolute;
        background: #f8d7da;
        color: #721c24;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-family: Ubuntu, sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1000;
        white-space: nowrap;
        pointer-events: none;
    `;

    const rect = elemento.getBoundingClientRect();
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;

    document.body.appendChild(tooltip);

    setTimeout(() => {
        tooltip.style.transition = 'opacity 0.3s';
        tooltip.style.opacity = '0';
        setTimeout(() => tooltip.remove(), 300);
    }, 3000);
}

/**
 * Agrega sugerencias mientras el usuario escribe
 */
function buscarSugerencias(nitParcial) {
    if (!baseEmpleadores || nitParcial.length < 3) {
        return [];
    }

    const nitLimpio = limpiarNIT(nitParcial);
    const sugerencias = [];

    for (const nit in baseEmpleadores) {
        if (nit.startsWith(nitLimpio)) {
            sugerencias.push(baseEmpleadores[nit]);
            if (sugerencias.length >= 5) break;
        }
    }

    return sugerencias;
}

/**
 * Muestra un datalist con sugerencias
 */
function actualizarSugerencias() {
    const nit = inputNIT.value.trim();

    if (nit.length < 3) {
        return;
    }

    const sugerencias = buscarSugerencias(nit);

    let datalist = document.getElementById('nitSugerencias');

    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'nitSugerencias';
        inputNIT.setAttribute('list', 'nitSugerencias');
        inputNIT.parentElement.appendChild(datalist);
    }

    datalist.innerHTML = '';

    sugerencias.forEach(empleador => {
        const option = document.createElement('option');
        // Compatible con ambas nomenclaturas
        const razon = empleador.razonSocial || empleador.razon_social || '';
        option.value = empleador.nit;
        option.textContent = `${empleador.nit} - ${razon}`;
        datalist.appendChild(option);
    });
}

/**
 * Permite edición manual de los campos si el usuario hace doble clic
 */
function permitirEdicionManual(campo) {
    campo.removeAttribute('readonly');
    campo.style.backgroundColor = '#fff3cd';
    campo.focus();

    const mensaje = document.createElement('div');
    mensaje.textContent = '⚠️ Editando manualmente';
    mensaje.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff3cd;
        color: #856404;
        padding: 10px 15px;
        border-radius: 4px;
        font-size: 12px;
        font-family: Ubuntu, sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1000;
    `;

    document.body.appendChild(mensaje);
    setTimeout(() => mensaje.remove(), 2000);
}

/**
 * Inicializar el sistema de autocompletado
 */
async function inicializarAutocompletado() {
    const baseCargada = await cargarBaseEnMemoria();

    if (!baseCargada) {
        console.warn('💡 Carga primero la base de datos usando el menú "Cargar Base de Datos"');
        return;
    }

    // Registrar flags de modificación manual en campos de gestión
    registrarListenersCamposGestion();

    inputNIT.addEventListener('blur', manejarCambioNIT);

    inputNIT.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            manejarCambioNIT();
        }
    });

    inputNIT.addEventListener('input', actualizarSugerencias);

    inputEmpresa.addEventListener('dblclick', () => permitirEdicionManual(inputEmpresa));
    inputAsesor.addEventListener('dblclick', () => permitirEdicionManual(inputAsesor));

    console.log('✅ Sistema de autocompletado inicializado');
}

/**
 * Función para verificar el estado de la base de datos
 */
async function verificarEstadoBase() {
    const metadatos = await localforage.getItem('metadatosBase');

    if (metadatos) {
        console.log('📊 Estado de la base de datos:');
        console.log(`   - Empleadores: ${metadatos.cantidadEmpleadores}`);
        console.log(`   - Fecha carga: ${new Date(metadatos.fechaCarga).toLocaleString('es-CO')}`);
        console.log(`   - Archivo: ${metadatos.nombreArchivo}`);
        return true;
    } else {
        console.log('⚠️ No hay base de datos cargada');
        return false;
    }
}

window.buscarEmpleadorDebug = function(nit) {
    const empleador = buscarEmpleador(nit);
    if (empleador) {
        console.log('✅ Empleador encontrado:', empleador);
    } else {
        console.log('❌ Empleador no encontrado con NIT:', nit);
    }
    return empleador;
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAutocompletado);
} else {
    inicializarAutocompletado();
}

window.verificarEstadoBase = verificarEstadoBase;

console.log('📦 Sistema de autocompletado cargado');