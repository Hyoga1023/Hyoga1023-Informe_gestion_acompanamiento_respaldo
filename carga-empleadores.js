/**
 * SISTEMA DE CARGA DE BASE DE DATOS DE EMPLEADORES
 *
 * Este script maneja la carga de un archivo JSON con la información de empleadores
 * y lo almacena en localForage para uso posterior en el autocompletado.
 *
 * Estructura esperada del JSON (empleadores.json):
 * [
 *   {
 *     "nit": "800123456",
 *     "razon_social": "EMPRESA EJEMPLO S.A.S",
 *     "asesor_comercial": "Juan Pérez",
 *     "alerta_ciclo_cobro": "3. PREJURIDICO 1",
 *     "deuda_presunta": "$ 8.563.712",
 *     "deuda_real": "$ 1.069.458",
 *     "pagos_po": "",
 *     "aportes_po": "",
 *     "pagos_ces": "",
 *     "pagos_pv": "",
 *     "aportes_pv": ""
 *   },
 *   ...
 * ]
 *
 * Valores válidos para "alerta_ciclo_cobro" (parametrizado):
 *   "1. PASO A DEMANDA"
 *   "2. PREJURIDICO EN FIRME"
 *   "3. PREJURIDICO 1"
 *   "4. COBRO NORMAL"
 *   "5. FUERA DE CICLO"
 *   "6. EMPRESA EN CEROS"
 *   "" (vacío si no aplica)
 *
 * NOTA: Este campo es confidencial y NO aparece en el PDF generado.
 */

// ======================================
// CONFIGURACIÓN INICIAL
// ======================================

localforage.config({
    name: 'ProteccionDB',
    storeName: 'empleadores'
});

// Referencias al botón e input file
const btnCargarBase = document.querySelector('.botonn');

// Creamos el input file de forma dinámica y lo ocultamos.
// Esto es para evitar mostrar el input file nativo del navegador.
const inputFile = document.createElement('input');
inputFile.type = 'file';
inputFile.accept = '.json';
inputFile.style.display = 'none';
document.body.appendChild(inputFile);

// ======================================
// FUNCIÓN: CAMBIAR ESTADO DEL BOTÓN
// ======================================

/**
 * Aplica los estilos visuales al botón según el estado de la carga.
 * @param {'cargando' | 'exito' | 'reset'} estado - El estado al que transicionar.
 */
function cambiarEstadoBoton(estado) {
    if (estado === 'cargando') {
        btnCargarBase.textContent = 'Cargando...';
        btnCargarBase.disabled = true;
        // Reiniciamos estilos inline por si venía de un estado anterior
        btnCargarBase.style.cssText = '';

    } else if (estado === 'exito') {
        btnCargarBase.textContent = '✅ Base Cargada Exitosamente';
        btnCargarBase.disabled = true;
        // Pintamos el botón de verde para dar feedback visual claro
        btnCargarBase.style.backgroundColor = '#107C41';
        btnCargarBase.style.borderColor = '#0e6b38';
        btnCargarBase.style.color = '#ffffff';
        btnCargarBase.style.cursor = 'default';

    } else if (estado === 'reset') {
        // Este estado solo se usa cuando hay ERROR, para devolver el botón a su estado original
        btnCargarBase.textContent = 'Cargar Base de Datos Empleadores';
        btnCargarBase.disabled = false;
        btnCargarBase.style.cssText = '';
    }
}

// ======================================
// EVENTO: CLIC EN EL BOTÓN
// ======================================

btnCargarBase.addEventListener('click', () => {
    // Al hacer clic, disparamos el selector de archivos del sistema operativo
    inputFile.click();
});

// ======================================
// EVENTO: CUANDO SE SELECCIONA UN ARCHIVO
// ======================================

inputFile.addEventListener('change', async (e) => {
    const archivo = e.target.files[0];

    // Bandera para saber si la carga fue exitosa.
    // La usamos en el 'finally' para decidir si resetear el botón o no.
    let cargaExitosa = false;

    // Validación: no se seleccionó nada
    if (!archivo) {
        mostrarAlerta('error', '❌ Sin archivo', 'No se seleccionó ningún archivo.');
        return;
    }

    // Validación: el archivo no es JSON
    if (!archivo.name.endsWith('.json')) {
        mostrarAlerta('error', '❌ Formato inválido', 'El archivo debe ser formato JSON (.json)');
        inputFile.value = '';
        return;
    }

    // Cambiamos el botón a estado "cargando" mientras procesamos
    cambiarEstadoBoton('cargando');

    try {
        // Leemos y parseamos el archivo JSON
        const contenido = await leerArchivoJSON(archivo);

        // El JSON puede venir como array directo o como objeto con propiedad "empleadores"
        const empleadores = Array.isArray(contenido)
            ? contenido
            : contenido.empleadores;

        if (!Array.isArray(empleadores)) {
            throw new Error('El archivo JSON debe ser un Array de empleadores.');
        }

        // Validamos la estructura de los datos
        const erroresValidacion = validarEmpleadores(empleadores);
        if (erroresValidacion.length > 0) {
            throw new Error(`Errores en la estructura de datos:\n${erroresValidacion.join('\n')}`);
        }

        // Construimos el índice de empleadores (objeto clave: NIT, valor: datos)
        // Esto permite búsqueda O(1) por NIT en el autocompletado
        const indiceEmpleadores = {};
        empleadores.forEach(emp => {
            const nit = limpiarNIT(emp.nit);
            indiceEmpleadores[nit] = {
                nit,
                razonSocial:        emp.razon_social.trim(),
                asesorComercial:    (emp.asesor_comercial  || '').trim() || 'Sin Consultor Asignado',
                valorDeudaPresunta: (emp.deuda_presunta    || '').trim(),
                valorDeudaReal:     (emp.deuda_real        || '').trim(),
                valorPagosPO:       (emp.pagos_po          || '').trim(),
                valorAportesPO:     (emp.aportes_po        || '').trim(),
                valorPagosCES:      (emp.pagos_ces         || '').trim(),
                valorPagosPV:       (emp.pagos_pv          || '').trim(),
                valorAportesPV:     (emp.aportes_pv        || '').trim(),
                alertaCicloCobro:   (emp.alerta_ciclo_cobro || '').trim()
            };
        });

        // Guardamos el índice en localForage
        await localforage.setItem('baseEmpleadores', indiceEmpleadores);

        // Guardamos metadatos de la carga (útil para auditoría y para el badge de verificación)
        await localforage.setItem('metadatosBase', {
            fechaCarga:           new Date().toISOString(),
            nombreArchivo:        archivo.name,
            cantidadEmpleadores:  Object.keys(indiceEmpleadores).length,
            version:              '1.0'
        });

        const cantidad = Object.keys(indiceEmpleadores).length;

        // ✅ CARGA EXITOSA: Marcamos la bandera y mostramos el Swal de éxito
        cargaExitosa = true;
        cambiarEstadoBoton('exito');

        await Swal.fire({
            icon: 'success',
            title: '✅ Base de datos cargada',
            // Usamos 'html' en lugar de 'text' para poder dar formato al contenido
            html: `
                <div style="text-align: left; font-family: 'Ubuntu', sans-serif; font-size: 0.95rem; line-height: 2;">
                    <p>📊 <strong>${cantidad}</strong> empleadores registrados</p>
                    <p>📁 Archivo: <strong>${archivo.name}</strong></p>
                    <p>📅 ${new Date().toLocaleString('es-CO')}</p>
                    <br>
                    <p style="color: #091057; font-weight: 500;">
                        Puedes volver al inicio para usar el autocompletado.
                    </p>
                </div>
            `,
            confirmButtonColor: '#091057',
            confirmButtonText: 'Entendido',
            customClass: {
                popup: 'swal-mobile-block',
                title: 'swal-mobile-title'
            }
        });

        console.log(`✅ Base de datos cargada: ${cantidad} empleadores`);
        console.log('Primeros 3 empleadores:', Object.values(indiceEmpleadores).slice(0, 3));

    } catch (error) {
        // ❌ CARGA FALLIDA: Mostramos el error
        console.error('❌ Error al cargar la base de datos:', error);

        mostrarAlerta(
            'error',
            '❌ Error al cargar el archivo',
            `${error.message}\n\nVerifica que el archivo JSON tenga la estructura correcta.`
        );

    } finally {
        // 'finally' siempre se ejecuta, haya error o no.
        // Si la carga fue exitosa, NO reseteamos el botón (queremos que quede verde).
        // Si hubo error, SÍ reseteamos para que el usuario pueda intentar de nuevo.
        if (!cargaExitosa) {
            cambiarEstadoBoton('reset');
        }
        inputFile.value = '';
    }
});

// ======================================
// FUNCIÓN: LEER ARCHIVO JSON
// ======================================

/**
 * Lee un archivo del sistema y retorna su contenido ya parseado como objeto JS.
 * Usa una Promise para poder usarlo con async/await de forma limpia.
 * @param {File} archivo - El archivo seleccionado por el usuario.
 * @returns {Promise<Object|Array>} El contenido del JSON parseado.
 */
function leerArchivoJSON(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const contenido = JSON.parse(e.target.result);
                resolve(contenido);
            } catch (error) {
                reject(new Error('El archivo no es un JSON válido'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };

        // Leemos como texto plano con codificación UTF-8 para soportar tildes y ñ
        reader.readAsText(archivo, 'UTF-8');
    });
}

// ======================================
// FUNCIÓN: VALIDAR ESTRUCTURA DEL JSON
// ======================================

/**
 * Revisa que cada empleador del array tenga los campos mínimos requeridos.
 * Retorna un array de strings con los errores encontrados (máximo 10).
 * @param {Array} empleadores - Lista de empleadores del JSON.
 * @returns {string[]} Lista de errores encontrados.
 */
function validarEmpleadores(empleadores) {
    const errores = [];
    const camposRequeridos = ['nit', 'razon_social', 'asesor_comercial'];

    empleadores.forEach((empleador, index) => {
        camposRequeridos.forEach(campo => {
            if (!empleador[campo] || empleador[campo].toString().trim() === '') {
                errores.push(`Empleador ${index + 1}: Falta el campo "${campo}"`);
            }
        });

        if (empleador.nit && !/^[\d\-]+$/.test(empleador.nit.toString())) {
            errores.push(`Empleador ${index + 1}: El NIT "${empleador.nit}" tiene caracteres inválidos`);
        }
    });

    // Retornamos máximo 10 errores para no saturar el mensaje
    return errores.slice(0, 10);
}

// ======================================
// FUNCIÓN: LIMPIAR NIT
// ======================================

/**
 * Estandariza el NIT quitando espacios, guiones y caracteres especiales.
 * Esto permite buscar "800-123.456" y que coincida con "800123456".
 * @param {string|number} nit - El NIT a limpiar.
 * @returns {string} NIT limpio solo con dígitos.
 */
function limpiarNIT(nit) {
    return nit.toString().replace(/[\s\-]/g, '').trim();
}

// ======================================
// FUNCIÓN: MOSTRAR ALERTA SWAL GENÉRICA
// ======================================

/**
 * Wrapper simple para mostrar alertas SweetAlert2 con el estilo de Protección.
 * Úsala para mensajes de error, info o advertencia donde no necesites HTML personalizado.
 * @param {'success'|'error'|'info'|'warning'} icon - Tipo de ícono.
 * @param {string} title - Título del modal.
 * @param {string} text - Mensaje de texto plano.
 */
function mostrarAlerta(icon, title, text) {
    Swal.fire({
        icon,
        title,
        text,
        confirmButtonColor: '#091057',
        confirmButtonText: 'Entendido',
        customClass: {
            popup: 'swal-mobile-block',
            title: 'swal-mobile-title'
        }
    });
}

// ======================================
// FUNCIÓN: VERIFICAR BASE AL CARGAR LA PÁGINA
// ======================================

/**
 * Al entrar a la página, revisa si ya hay una base cargada en localForage.
 * Si existe, muestra un badge informativo temporal — pero el botón queda
 * habilitado para permitir recargar la base cuando sea necesario.
 * El botón solo se bloquea durante la sesión activa después de una carga exitosa.
 */
async function verificarBaseDatos() {
    try {
        const metadatos = await localforage.getItem('metadatosBase');

        if (metadatos) {
            console.log('Base de datos disponible:', metadatos);

            // ✅ El botón NO se toca aquí. Queda en su estado normal para
            // permitir que el usuario vuelva a cargar una base actualizada.

            // Badge flotante informativo (desaparece solo a los 5 segundos)
            const badge = document.createElement('div');
            badge.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #091057;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                font-family: Ubuntu, sans-serif;
                font-size: 14px;
                z-index: 1000;
                line-height: 1.6;
                border-left: 4px solid #dfca0e;
            `;
            badge.innerHTML = `
                ✅ Base de datos activa<br>
                <strong>${metadatos.cantidadEmpleadores}</strong> empleadores cargados<br>
                <span style="font-size: 12px; opacity: 0.8;">
                    Última carga: ${new Date(metadatos.fechaCarga).toLocaleDateString('es-CO')}
                </span>
            `;
            document.body.appendChild(badge);

            setTimeout(() => {
                badge.style.transition = 'opacity 0.5s';
                badge.style.opacity = '0';
                setTimeout(() => badge.remove(), 500);
            }, 10000);

        } else {
            console.log('⚠️ No hay base de datos cargada');
        }
    } catch (error) {
        console.error('Error al verificar base de datos:', error);
    }
}

// ======================================
// FUNCIÓN: LIMPIAR / BORRAR BASE DE DATOS
// ======================================

/**
 * Elimina la base de datos de empleadores del localForage.
 * Muestra confirmación con SweetAlert2 antes de proceder.
 * Esta función está expuesta en window para poder llamarla desde la consola del navegador.
 */
async function limpiarBaseDatos() {
    // Reemplazamos el confirm() nativo por un Swal con botones
    const respuesta = await Swal.fire({
        icon: 'warning',
        title: '⚠️ ¿Borrar base de datos?',
        text: 'Esta acción eliminará todos los empleadores registrados. No se puede deshacer.',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar'
    });

    // Si el usuario no confirmó, no hacemos nada
    if (!respuesta.isConfirmed) return;

    try {
        await localforage.removeItem('baseEmpleadores');
        await localforage.removeItem('metadatosBase');

        // Devolvemos el botón a su estado original
        cambiarEstadoBoton('reset');

        mostrarAlerta('success', '✅ Base eliminada', 'La base de datos fue eliminada correctamente.');
        console.log('Base de datos eliminada');

    } catch (error) {
        mostrarAlerta('error', '❌ Error', 'No fue posible eliminar la base de datos.');
        console.error('Error:', error);
    }
}

// ======================================
// INICIALIZACIÓN
// ======================================

document.addEventListener('DOMContentLoaded', verificarBaseDatos);

// Exponemos limpiarBaseDatos para poder llamarla desde la consola del navegador si es necesario
window.limpiarBaseDatos = limpiarBaseDatos;

console.log('📦 Sistema de carga de empleadores inicializado');