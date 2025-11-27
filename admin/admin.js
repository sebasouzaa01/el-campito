const SUPABASE_URL = 'https://dhjxqsysunumnwxuvqen.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoanhxc3lzdW51bW53eHV2cWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTg0MjQsImV4cCI6MjA3OTc5NDQyNH0.K86mN4EM-yHdUmMEWCjcFvI_QsaUzfV9kbAwEIt6Dnc';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- AUTH ---
async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (user) {
        // Verificar tabla perfiles_admin
        const { data } = await _supabase.from('perfiles_admin').select('*').eq('id', user.id).single();
        if (data) {
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadReservations();
        } else {
            alert('Usuario logueado pero NO autorizado. Pide a soporte que agreguen tu ID a la tabla perfiles_admin.');
        }
    }
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else checkUser();
}

async function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await _supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Revisa tu email. Luego inserta tu ID manualmente en perfiles_admin.');
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

// --- TAB 1: RESERVAS ---
async function loadReservations() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await _supabase
        .from('reservas')
        .select('*')
        .gte('fecha', today)
        .order('fecha')
        .order('hora_inicio');

    const list = document.getElementById('reservasList');
    if(!data || data.length === 0) { list.innerHTML = '<p>No hay reservas futuras.</p>'; return; }

    let html = '<table><tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Contacto</th><th>Acción</th></tr>';
    data.forEach(r => {
        // Formatear fecha
        const fechaFmt = r.fecha.split('-').reverse().join('/');
        html += `
            <tr>
                <td>${fechaFmt}</td>
                <td>${r.hora_inicio.slice(0,5)} - ${r.hora_fin.slice(0,5)}</td>
                <td><strong>${r.nombre_cliente}</strong></td>
                <td><a href="https://wa.me/549${r.telefono_cliente}" target="_blank" style="color:#3b82f6;">${r.telefono_cliente}</a></td>
                <td><button class="btn-danger" onclick="deleteReserva(${r.id})">Cancelar</button></td>
            </tr>`;
    });
    html += '</table>';
    list.innerHTML = html;
}

async function deleteReserva(id) {
    if(!confirm('¿Cancelar reserva?')) return;
    await _supabase.from('reservas').delete().eq('id', id);
    loadReservations();
}

// --- TAB 2: BLOQUEOS ---
async function addBlock() {
    const inicio = document.getElementById('blockStart').value;
    const fin = document.getElementById('blockEnd').value;
    const motivo = document.getElementById('blockReason').value;

    if(!inicio || !fin) return alert('Completa fechas');

    const { error } = await _supabase.from('bloqueos').insert({ fecha_inicio: inicio, fecha_fin: fin, motivo });
    if(error) alert(error.message);
    else { alert('Bloqueo creado'); loadBlocks(); }
}

async function loadBlocks() {
    const { data } = await _supabase.from('bloqueos').select('*').order('fecha_inicio', { ascending: false });
    const list = document.getElementById('blocksList');
    if(!data || data.length === 0) { list.innerHTML = '<p style="margin-top:20px;">No hay bloqueos activos.</p>'; return; }

    let html = '<table style="margin-top:20px;"><tr><th>Desde</th><th>Hasta</th><th>Motivo</th><th></th></tr>';
    data.forEach(b => {
        html += `<tr>
            <td>${b.fecha_inicio}</td>
            <td>${b.fecha_fin}</td>
            <td>${b.motivo}</td>
            <td><button class="btn-danger" onclick="deleteBlock(${b.id})">Borrar</button></td>
        </tr>`;
    });
    html += '</table>';
    list.innerHTML = html;
}

async function deleteBlock(id) {
    await _supabase.from('bloqueos').delete().eq('id', id);
    loadBlocks();
}

// --- TAB 3: CONFIGURACIÓN (CRUD HORARIOS) ---
const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

async function loadConfig() {
    const { data } = await _supabase.from('horarios_disponibles').select('*').order('dia_semana').order('hora_inicio');
    const container = document.getElementById('configList');
    
    if(!data) return;

    let html = '';
    let currentDay = -1;

    data.forEach(slot => {
        if(slot.dia_semana !== currentDay) {
            if(currentDay !== -1) html += '</table></div>';
            currentDay = slot.dia_semana;
            html += `<div style="margin-bottom:20px; background:white; border-radius:8px; border:1px solid #e2e8f0; overflow:hidden;">
                     <h4 style="background:#f1f5f9; padding:10px 15px; margin:0; border-bottom:1px solid #e2e8f0;">${diasSemana[currentDay]}</h4>
                     <table style="margin:0; box-shadow:none; border-radius:0;">`;
        }
        
        html += `
            <tr>
                <td>${slot.hora_inicio.slice(0,5)} a ${slot.hora_fin.slice(0,5)}</td>
                <td>
                    <input type="number" value="${slot.precio}" 
                        onchange="updatePrice(${slot.id}, this.value)" 
                        style="width:100px; margin:0;">
                </td>
                <td style="text-align:right;">
                    <button class="btn-danger" onclick="deleteSlot(${slot.id})">Eliminar</button>
                </td>
            </tr>`;
    });
    html += '</table></div>';
    container.innerHTML = html;
}

async function updatePrice(id, price) {
    await _supabase.from('horarios_disponibles').update({ precio: price }).eq('id', id);
}

async function addScheduleSlot() {
    const dia = document.getElementById('newDay').value;
    const inicio = document.getElementById('newStart').value;
    const fin = document.getElementById('newEnd').value;
    const precio = document.getElementById('newPrice').value;

    if(!inicio || !fin || !precio) return alert('Datos incompletos');

    const { error } = await _supabase.from('horarios_disponibles').insert({
        dia_semana: dia, hora_inicio: inicio, hora_fin: fin, precio: precio
    });

    if(error) alert(error.message);
    else loadConfig();
}

async function deleteSlot(id) {
    if(confirm('¿Borrar este horario base?')) {
        await _supabase.from('horarios_disponibles').delete().eq('id', id);
        loadConfig();
    }
}

// --- TABS LOGIC ---
function showTab(tab) {
    document.querySelectorAll('[id^="tab-"]').forEach(el => el.style.display = 'none');
    document.getElementById(`tab-${tab}`).style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if(tab === 'reservas') loadReservations();
    if(tab === 'bloqueos') loadBlocks();
    if(tab === 'config') loadConfig();
}

checkUser();