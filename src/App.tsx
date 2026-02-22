import React, { useState, useEffect, useMemo } from 'react';

/**
 * TODO BARRAS v9.2 - Industrial UI System
 * Entorno: StackBlitz + Vite
 * Firebase: Preparado pero comentado para testing.
 */

/* // === FIREBASE SETUP (COMENTADO PARA TESTING) ===
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT",
  // ...
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
*/

// --- COMPONENTES GENÉRICOS DE DISEÑO ---
// Definido fuera de App para evitar pérdida de foco (Bug de escritura arreglado)
const ViewWrapper = ({ title, children, onBack }) => (
  <div className="min-h-screen bg-[#0D0D0D] p-6 max-w-sm mx-auto">
    {onBack && (
      <button onClick={onBack} className="mb-8 font-bold text-[#333333] uppercase text-[10px] tracking-widest">
        ← VOLVER
      </button>
    )}
    {title && (
      <h2 className="text-[2rem] font-bold text-[#F2F2F2] uppercase tracking-tighter mb-8 leading-tight">
        {title}
      </h2>
    )}
    {children}
  </div>
);

export default function App() {
  // --- ESTADOS DE FLUJO ---
  const [viewMode, setViewMode] = useState('splash'); // splash, login, setup, main, create, history, detail, products
  const [splashOpacity, setSplashOpacity] = useState(100);
  
  // --- ESTADOS DE USUARIO (Simulando Auth/Firestore) ---
  const [userProfile, setUserProfile] = useState(null); 
  const [setupBarName, setSetupBarName] = useState('');
  const [setupUserName, setSetupUserName] = useState('');
  
  // --- ESTADOS DE DATOS ---
  const [events, setEvents] = useState([]);
  const [productTemplate, setProductTemplate] = useState([
    { product: "FERNET BRANCA", unitsPerBox: 6, iniC: 0, iniU: 0, iniQ: 0, finC: 0, finU: 0, finQ: 0 },
    { product: "CAMPARI", unitsPerBox: 6, iniC: 0, iniU: 0, iniQ: 0, finC: 0, finU: 0, finQ: 0 },
    { product: "ABSOLUT", unitsPerBox: 10, iniC: 0, iniU: 0, iniQ: 0, finC: 0, finU: 0, finQ: 0 }
  ]);
  const [selectedStock, setSelectedStock] = useState(null);
  
  // --- FORMULARIOS ---
  // Se pide que por defecto diga "EVENTO."
  const [newEventName, setNewEventName] = useState('EVENTO. ');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [alertMessage, setAlertMessage] = useState(null);
  const [sortOrder, setSortOrder] = useState('date-desc'); // date-desc, date-asc, name-asc, name-desc

  // --- PERSISTENCIA LOCAL Y SPLASH SCREEN ---
  useEffect(() => {
    // Carga de datos locales
    const savedProfile = localStorage.getItem('tb_profile');
    const savedEvents = localStorage.getItem('tb_events');
    const savedTemplate = localStorage.getItem('tb_template');

    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedTemplate) setProductTemplate(JSON.parse(savedTemplate));

    // Lógica del Splash Screen (3 segundos y desvanece)
    const fadeTimer = setTimeout(() => {
      setSplashOpacity(0);
    }, 2500); // Empieza a desvanecer a los 2.5s

    const switchViewTimer = setTimeout(() => {
      // Si ya hay perfil, va al main. Si no, va al login.
      setViewMode(savedProfile ? 'main' : 'login');
    }, 3500); // Cambia la vista a los 3.5s

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(switchViewTimer);
    };
  }, []);

  useEffect(() => {
    if (userProfile) localStorage.setItem('tb_profile', JSON.stringify(userProfile));
    localStorage.setItem('tb_events', JSON.stringify(events));
    localStorage.setItem('tb_template', JSON.stringify(productTemplate));
  }, [userProfile, events, productTemplate]);

  // --- LÓGICA DE SIMULACIÓN DE LOGIN ---
  const handleSimulateLogin = () => {
    // Aquí iría signInWithPopup(auth, provider)...
    // Como simulamos que es la primera vez, lo enviamos al Setup
    setViewMode('setup');
  };

  const handleSaveProfile = () => {
    if (!setupBarName || !setupUserName) {
      setAlertMessage("COMPLETA AMBOS CAMPOS");
      return;
    }
    setUserProfile({
      barName: setupBarName.toUpperCase(),
      userName: setupUserName.toUpperCase()
    });
    setViewMode('main');
  };

  const createStock = () => {
    if (!newEventName || newEventName.trim() === 'EVENTO.') {
      setAlertMessage("INGRESA UN NOMBRE PARA EL EVENTO");
      return;
    }
    const newEntry = {
      id: Date.now().toString(),
      name: newEventName.toUpperCase(),
      date: newEventDate, 
      data: productTemplate.map(p => ({ ...p, iniC: 0, iniU: 0, iniQ: 0, finC: 0, finU: 0, finQ: 0 })),
      createdAt: new Date().toISOString()
    };
    setEvents([newEntry, ...events]);
    setNewEventName('EVENTO. '); // Reseteo al valor predeterminado
    setViewMode('history');
  };

  const updateField = (index, field, delta, isDecimals = false) => {
    const newData = [...selectedStock.data];
    let val = Number(newData[index][field]);
    if (isDecimals) {
      val = Number((val + delta).toFixed(1));
      if (val < 0) val = 0.9;
      if (val > 0.9) val = 0;
    } else {
      val = Math.max(0, val + delta);
    }
    newData[index][field] = val;
    const updated = { ...selectedStock, data: newData };
    setSelectedStock(updated);
    setEvents(events.map(ev => ev.id === updated.id ? updated : ev));
  };

  const calculateUnits = (c, u, q, uBox) => (Number(c) * uBox) + Number(u) + Number(q);

  // --- ORDENAMIENTO DEL HISTORIAL ---
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (sortOrder === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOrder === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });
  }, [events, sortOrder]);

  // --- ESTILOS INYECTADOS (INTER FONT) ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    document.body.style.fontFamily = "'Inter', sans-serif";
    document.body.style.backgroundColor = '#0D0D0D';
  }, []);

  // --- VISTAS ---

  if (viewMode === 'splash') {
    return (
      <div 
        className={`h-screen w-full flex flex-col items-center justify-center bg-[#0D0D0D] text-[#F2F2F2] transition-opacity duration-1000 ease-in-out`}
        style={{ opacity: splashOpacity / 100 }}
      >
        <div className="text-center">
          <h1 className="text-[2rem] font-bold tracking-[0.2em] mb-2 uppercase">TODO BARRAS</h1>
          <p className="text-[0.75rem] font-medium text-[#BFBFBF] tracking-[0.4em] uppercase">by La Gerencia</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'login') {
    return (
      <ViewWrapper>
        <div className="flex flex-col min-h-[80vh] items-center justify-center text-center space-y-12">
          <div>
            <h1 className="text-[2rem] font-bold text-[#F2F2F2] uppercase tracking-tighter mb-2">TODO BARRAS</h1>
            <p className="text-[0.75rem] font-medium text-[#BFBFBF] uppercase tracking-[0.3em]">Acceso Operativo</p>
          </div>
          <div className="w-full space-y-4">
            <button 
              onClick={handleSimulateLogin} 
              className="w-full h-[60px] bg-[#F2F2F2] text-[#0D0D0D] rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Acceder con Google
            </button>
            <button 
              onClick={handleSimulateLogin} 
              className="w-full h-[60px] bg-[#1A1A1A] border border-[#333333] text-[#F2F2F2] rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all"
            >
              Email y Clave
            </button>
          </div>
        </div>
      </ViewWrapper>
    );
  }

  if (viewMode === 'setup') {
    return (
      <ViewWrapper>
        <div className="flex flex-col min-h-[80vh] justify-center space-y-8 animate-fade-in">
          <div className="text-center">
            <h2 className="text-[2rem] font-bold text-[#F2F2F2] uppercase tracking-tight leading-none mb-2">Bienvenido</h2>
            <p className="text-[0.8rem] text-[#BFBFBF] uppercase tracking-widest">Configuración Inicial</p>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="NOMBRE DEL BOLICHE/BAR" 
              value={setupBarName} 
              onChange={e => setSetupBarName(e.target.value)} 
              className="w-full h-[60px] bg-[#1A1A1A] border border-[#333333] text-[#F2F2F2] px-6 rounded-xl font-bold uppercase outline-none focus:border-[#F2F2F2]" 
            />
            <input 
              type="text" 
              placeholder="TU NOMBRE DE USUARIO" 
              value={setupUserName} 
              onChange={e => setSetupUserName(e.target.value)} 
              className="w-full h-[60px] bg-[#1A1A1A] border border-[#333333] text-[#F2F2F2] px-6 rounded-xl font-bold uppercase outline-none focus:border-[#F2F2F2]" 
            />
            <button 
              onClick={handleSaveProfile} 
              className="w-full h-[60px] mt-4 bg-[#F2F2F2] text-[#0D0D0D] rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-transform"
            >
              Continuar
            </button>
          </div>
        </div>
      </ViewWrapper>
    );
  }

  if (viewMode === 'main') {
    return (
      <ViewWrapper>
        <div className="flex flex-col min-h-[80vh] justify-center space-y-12">
          <header className="text-center">
            <h1 className="text-[2.2rem] font-extrabold text-[#F2F2F2] tracking-tighter uppercase leading-none">{userProfile?.barName}</h1>
            <p className="text-[0.75rem] font-bold text-[#BFBFBF] tracking-[0.3em] mt-3 uppercase">Gestión de Inventario</p>
            <p className="text-[0.65rem] text-[#333333] uppercase tracking-widest mt-2">OP: {userProfile?.userName}</p>
          </header>
          <div className="space-y-4">
            <button onClick={() => setViewMode('create')} className="w-full h-[64px] bg-[#F2F2F2] text-[#0D0D0D] rounded-2xl font-bold uppercase tracking-wider active:scale-95 transition-all">Nueva Planilla +</button>
            <button onClick={() => setViewMode('history')} className="w-full h-[64px] bg-[#1A1A1A] text-[#F2F2F2] border border-[#333333] rounded-2xl font-bold uppercase tracking-wider active:scale-95 transition-all">Historial</button>
            <button onClick={() => setViewMode('products')} className="w-full h-[64px] bg-[#1A1A1A] text-[#F2F2F2] border border-[#333333] rounded-2xl font-bold uppercase tracking-wider active:scale-95 transition-all">Productos</button>
            <button 
              onClick={() => { 
                if(confirm("¿Cerrar sesión?")) {
                  setUserProfile(null); 
                  localStorage.removeItem('tb_profile');
                  setViewMode('login'); 
                }
              }} 
              className="w-full pt-8 text-[0.7rem] font-bold text-[#333333] uppercase tracking-[0.2em]"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </ViewWrapper>
    );
  }

  if (viewMode === 'detail' && selectedStock) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-[#F2F2F2] pb-10">
        <header className="sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md pt-10 pb-4 px-4 flex items-center justify-between border-b border-[#333333]">
          <button onClick={() => setViewMode('history')} className="text-[#BFBFBF] font-bold text-xl px-2">←</button>
          <div className="text-right">
            <h2 className="text-[1.2rem] font-bold uppercase tracking-tight leading-none">{selectedStock.name}</h2>
            <p className="text-[0.7rem] font-medium text-[#BFBFBF] uppercase mt-1">{selectedStock.date}</p>
          </div>
        </header>

        {/* Cabeceras Técnicas (Optimizadas para el nuevo layout) */}
        <div className="sticky top-[85px] z-40 bg-[#1A1A1A] flex px-2 py-3 text-[10px] font-bold uppercase tracking-widest border-b border-[#333333] text-[#BFBFBF]">
          <div className="w-[25%] pl-2 flex items-center">PRODUCTO</div>
          <div className="w-[30%] text-center border-x border-[#333333]">INICIAL</div>
          <div className="w-[30%] text-center border-r border-[#333333]">FINAL</div>
          <div className="w-[15%] text-center flex items-center justify-center">GASTO</div>
        </div>

        <div className="px-2 mt-4 space-y-3">
          {selectedStock.data.map((row, i) => {
            const ini = calculateUnits(row.iniC, row.iniU, row.iniQ, row.unitsPerBox);
            const fin = calculateUnits(row.finC, row.finU, row.finQ, row.unitsPerBox);
            const gasto = (ini - fin).toFixed(1);
            const isNegative = Number(gasto) < 0;

            // Componente interno para renderizar los bloques de controles horizontales
            const ControlRow = ({ label, field, step, isDecimals }) => (
              <div className="flex justify-between items-center bg-[#0D0D0D] rounded-lg mb-1 p-1">
                <span className="text-[10px] font-bold text-[#333333] w-4 text-center">{label}</span>
                <button onClick={() => updateField(i, field, -step, isDecimals)} className="text-[18px] w-8 h-8 flex items-center justify-center text-[#BFBFBF] font-bold active:bg-[#333333] rounded-md">-</button>
                <span className="text-[14px] font-mono font-bold w-6 text-center">
                  {isDecimals ? `.${Math.round(row[field] * 10)}` : row[field]}
                </span>
                <button onClick={() => updateField(i, field, step, isDecimals)} className="text-[18px] w-8 h-8 flex items-center justify-center text-[#F2F2F2] font-bold active:bg-[#333333] rounded-md">+</button>
              </div>
            );

            return (
              <div key={i} className="flex bg-[#1A1A1A] border border-[#333333] rounded-xl p-2 items-stretch">
                {/* Producto Info */}
                <div className="w-[25%] pr-2 flex flex-col justify-center">
                  <p className="font-bold text-[12px] uppercase leading-tight">{row.product}</p>
                  <p className="text-[10px] text-[#BFBFBF] font-mono mt-1">X{row.unitsPerBox}</p>
                </div>

                {/* Bloque Inicial */}
                <div className="w-[30%] px-1 border-l border-[#333333] flex flex-col">
                  <ControlRow label="C" field="iniC" step={1} />
                  <ControlRow label="U" field="iniU" step={1} />
                  <ControlRow label="D" field="iniQ" step={0.1} isDecimals={true} />
                  <div className="mt-1 py-1 text-center bg-[#333333]/30 rounded-lg border border-[#333333]">
                    <span className="text-[12px] font-mono font-bold text-[#A68A2E]">T: {ini.toFixed(1)}</span>
                  </div>
                </div>

                {/* Bloque Final */}
                <div className="w-[30%] px-1 border-x border-[#333333] flex flex-col">
                  <ControlRow label="C" field="finC" step={1} />
                  <ControlRow label="U" field="finU" step={1} />
                  <ControlRow label="D" field="finQ" step={0.1} isDecimals={true} />
                  <div className="mt-1 py-1 text-center bg-[#333333]/30 rounded-lg border border-[#333333]">
                    <span className="text-[12px] font-mono font-bold text-[#A68A2E]">T: {fin.toFixed(1)}</span>
                  </div>
                </div>

                {/* Gasto Total */}
                <div className="w-[15%] flex items-center justify-center">
                  <div className={`text-[1.5rem] font-extrabold font-mono tracking-tighter ${isNegative ? 'text-[#8C3030]' : 'text-[#F2F2F2]'}`}>
                    {Math.abs(gasto) < 0.01 ? "0" : gasto}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (viewMode === 'create') return (
    <ViewWrapper title="Nueva Planilla" onBack={() => setViewMode('main')}>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] text-[#BFBFBF] font-bold uppercase tracking-widest pl-2">Nombre / Referencia</label>
          <input 
            value={newEventName} 
            onChange={e => setNewEventName(e.target.value)} 
            className="w-full h-[60px] bg-[#1A1A1A] border border-[#333333] px-5 rounded-2xl font-bold uppercase text-[#F2F2F2] outline-none focus:border-[#F2F2F2]" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-[#BFBFBF] font-bold uppercase tracking-widest pl-2">Fecha del Evento</label>
          <input 
            type="date" 
            value={newEventDate} 
            onChange={e => setNewEventDate(e.target.value)} 
            className="w-full h-[60px] bg-[#1A1A1A] border border-[#333333] px-5 rounded-2xl font-bold text-[#F2F2F2] outline-none" 
          />
        </div>
        <button onClick={createStock} className="w-full h-[60px] bg-[#F2F2F2] text-[#0D0D0D] rounded-2xl font-bold uppercase tracking-widest active:scale-95 transition-all mt-4">
          Crear Registro
        </button>
      </div>
    </ViewWrapper>
  );

  if (viewMode === 'history') return (
    <ViewWrapper title="Historial" onBack={() => setViewMode('main')}>
      <div className="mb-6">
        <select 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full bg-[#1A1A1A] text-[#F2F2F2] border border-[#333333] p-3 rounded-xl outline-none font-bold text-xs uppercase tracking-widest appearance-none text-center"
        >
          <option value="date-desc">Más Recientes Primero</option>
          <option value="date-asc">Más Antiguos Primero</option>
          <option value="name-asc">Por Nombre (A - Z)</option>
          <option value="name-desc">Por Nombre (Z - A)</option>
        </select>
      </div>
      
      <div className="space-y-3">
        {sortedEvents.map(e => (
          <div key={e.id} className="p-6 bg-[#1A1A1A] border border-[#333333] rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all" onClick={() => { setSelectedStock(e); setViewMode('detail'); }}>
            <div>
              <p className="font-bold text-[#F2F2F2] uppercase tracking-tight text-[1rem]">{e.name}</p>
              <p className="text-[10px] text-[#BFBFBF] font-medium uppercase mt-1 tracking-widest">{e.date}</p>
            </div>
            <button onClick={(ev) => { ev.stopPropagation(); confirm("¿Eliminar registro?") && setEvents(events.filter(x => x.id !== e.id)); }} className="text-[#8C3030] font-bold text-[10px] uppercase tracking-widest bg-[#8C3030]/10 px-3 py-2 rounded-lg">Borrar</button>
          </div>
        ))}
        {events.length === 0 && <p className="text-center py-20 text-[#333333] font-bold uppercase tracking-widest">Sin datos registrados</p>}
      </div>
    </ViewWrapper>
  );

  if (viewMode === 'products') return (
    <ViewWrapper title="Productos" onBack={() => setViewMode('main')}>
      <div className="space-y-2 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {productTemplate.map((p, i) => (
          <div key={i} className="flex justify-between p-4 bg-[#1A1A1A] border border-[#333333] rounded-xl items-center">
            <p className="font-bold uppercase text-[12px] text-[#F2F2F2]">{p.product} <span className="text-[#BFBFBF] ml-2 font-mono text-[10px]">Caja x{p.unitsPerBox}</span></p>
            <button onClick={() => setProductTemplate(productTemplate.filter((_, idx) => idx !== i))} className="text-[#8C3030] font-bold text-xl px-2">×</button>
          </div>
        ))}
      </div>
      <div className="pt-6 border-t border-[#333333] space-y-3">
        <input id="pName" placeholder="NOMBRE DEL PRODUCTO" className="w-full h-[54px] bg-[#1A1A1A] border border-[#333333] px-5 rounded-xl font-bold uppercase text-xs text-[#F2F2F2] outline-none focus:border-[#F2F2F2]" />
        <input id="pUnit" type="number" placeholder="UNIDADES POR CAJA" className="w-full h-[54px] bg-[#1A1A1A] border border-[#333333] px-5 rounded-xl font-bold text-xs text-[#F2F2F2] outline-none focus:border-[#F2F2F2]" />
        <button onClick={() => {
          const n = document.getElementById('pName').value.trim();
          const u = document.getElementById('pUnit').value;
          if(!n || !u) return;
          setProductTemplate([...productTemplate, { product: n.toUpperCase(), unitsPerBox: Number(u), iniC: 0, iniU: 0, iniQ: 0, finC: 0, finU: 0, finQ: 0 }].sort((a,b) => a.product.localeCompare(b.product)));
          document.getElementById('pName').value = ''; document.getElementById('pUnit').value = '';
        }} className="w-full h-[54px] bg-[#F2F2F2] text-[#0D0D0D] rounded-xl font-bold uppercase text-xs tracking-widest active:scale-95 transition-all mt-2">Añadir al Stock</button>
      </div>
    </ViewWrapper>
  );

  return (
    <>
      {alertMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={() => setAlertMessage(null)}>
          <div className="bg-[#1A1A1A] border border-[#333333] p-8 rounded-2xl text-center shadow-2xl max-w-xs w-full animate-fade-in">
            <p className="font-bold text-[#F2F2F2] mb-8 uppercase text-[11px] tracking-widest leading-relaxed">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full py-4 bg-[#F2F2F2] text-[#0D0D0D] rounded-lg text-[10px] font-bold uppercase tracking-widest active:scale-95">Entendido</button>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </>
  );
}