// --- CONFIGURACIÓN SUPABASE ---
const SUPABASE_URL = 'https://dhjxqsysunumnwxuvqen.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoanhxc3lzdW51bW53eHV2cWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTg0MjQsImV4cCI6MjA3OTc5NDQyNH0.K86mN4EM-yHdUmMEWCjcFvI_QsaUzfV9kbAwEIt6Dnc';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- VARIABLES ---
const datePicker = document.getElementById('datePicker');
const slotsContainer = document.getElementById('slotsContainer');
const modal = document.getElementById('bookingModal');
let selectedSlot = null;

// Configuración inicial
datePicker.min = new Date().toISOString().split('T')[0]; // Bloquear fechas pasadas
datePicker.addEventListener('change', loadAvailability);

// --- FUNCIONES ---

async function loadAvailability() {
    const fecha = datePicker.value;
    if (!fecha) return;
    
    // Loading State
    slotsContainer.innerHTML = `
        <div class="empty-state" style="padding:40px;">
            <i class="fa-solid fa-spinner fa-spin" style="color:var(--primary)"></i>
            <p>Buscando disponibilidad...</p>
        </div>`;

    // 1. Obtener día semana (0-6)
    // El "replace" asegura que no haya problemas de zona horaria al convertir string a date
    const dateObj = new Date(fecha + 'T00:00:00');
    const diaSemana = dateObj.getDay();

    // 2. Ejecutar consultas en paralelo para velocidad
    const [templatesRes, reservasRes, bloqueosRes] = await Promise.all([
        _supabase.from('horarios_disponibles')
            .select('*')
            .eq('dia_semana', diaSemana)
            .eq('activo', true)
            .order('hora_inicio'),
        _supabase.from('reservas')
            .select('hora_inicio')
            .eq('fecha', fecha)
            .neq('estado', 'cancelada'),
        _supabase.from('bloqueos')
            .select('*')
            .lte('fecha_inicio', fecha)
            .gte('fecha_fin', fecha)
    ]);

    if (templatesRes.error) {
        slotsContainer.innerHTML = '<div class="empty-state"><p>Error de conexión.</p></div>';
        return;
    }

    renderSlots(templatesRes.data, reservasRes.data || [], bloqueosRes.data || [], fecha);
}

function renderSlots(templates, reservas, bloqueos, fecha) {
    slotsContainer.innerHTML = '';

    if (!templates || templates.length === 0) {
        slotsContainer.innerHTML = '<div class="empty-state"><i class="fa-regular fa-calendar-xmark"></i><p>No hay horarios disponibles para este día.</p></div>';
        return;
    }

    templates.forEach(template => {
        // Lógica de estado
        const isReserved = reservas.some(r => r.hora_inicio.slice(0,5) === template.hora_inicio.slice(0,5));
        
        let isBlocked = false;
        bloqueos.forEach(b => {
            if (!b.hora_inicio) {
                isBlocked = true; // Bloqueo total del día
            } else {
                // Bloqueo parcial
                if (template.hora_inicio >= b.hora_inicio && template.hora_fin <= b.hora_fin) {
                    isBlocked = true;
                }
            }
        });

        // Crear Tarjeta HTML
        const card = document.createElement('div');
        let statusClass = 'available';
        let statusText = 'Disponible';
        let icon = '<i class="fa-regular fa-circle-check"></i>';

        if (isBlocked) {
            statusClass = 'blocked';
            statusText = 'No Disponible';
            icon = '<i class="fa-solid fa-ban"></i>';
        } else if (isReserved) {
            statusClass = 'occupied';
            statusText = 'Reservado';
            icon = '<i class="fa-solid fa-lock"></i>';
        }

        card.className = `slot-card ${statusClass}`;
        card.innerHTML = `
            <h4>${template.hora_inicio.slice(0,5)}</h4>
            <p>$${template.precio}</p>
            <small>${icon} ${statusText}</small>
        `;

        // Click event solo si está disponible
        if (!isReserved && !isBlocked) {
            card.onclick = () => openModal(template, fecha);
        }

        slotsContainer.appendChild(card);
    });
}

function openModal(slot, fecha) {
    selectedSlot = { ...slot, fecha };
    
    // Formatear datos para el modal
    document.getElementById('modalTime').innerText = slot.hora_inicio.slice(0,5) + ' hs';
    const [year, month, day] = fecha.split('-');
    document.getElementById('modalDate').innerText = `${day}/${month}`;
    document.getElementById('modalPrice').innerText = '$' + slot.precio;
    
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    selectedSlot = null;
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
}

async function confirmBooking() {
    const nombre = document.getElementById('clientName').value;
    const telefono = document.getElementById('clientPhone').value;

    if (!nombre || !telefono) return;

    // UI Feedback
    const btn = document.querySelector('.confirm-btn');
    const originalText = btn.innerText;
    btn.innerText = 'PROCESANDO...';
    btn.disabled = true;

    // Insertar en Supabase
    const { error } = await _supabase.from('reservas').insert({
        fecha: selectedSlot.fecha,
        hora_inicio: selectedSlot.hora_inicio,
        hora_fin: selectedSlot.hora_fin,
        nombre_cliente: nombre,
        telefono_cliente: telefono
    });

    btn.innerText = originalText;
    btn.disabled = false;

    if (error) {
        // Error común: Constraint violation (alguien ganó la reserva)
        if(error.code === '23505') alert('¡Lo sentimos! Alguien acaba de reservar este horario.');
        else alert('Error al reservar. Intenta nuevamente.');
    } else {
        alert(`¡Reserva Confirmada para ${nombre}!`);
        closeModal();
        loadAvailability(); // Recargar grilla
    }
}

// Cerrar modal al hacer click afuera
window.onclick = (e) => { if (e.target == modal) closeModal(); }