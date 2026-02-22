import { useState, useEffect, useMemo, ReactNode } from 'react';

/**
 * TODO BARRAS v9.4 - TypeScript Edition
 * Entorno: StackBlitz + Vite (Optimizado para Hosting Externo como Netlify)
 * Se agregaron interfaces estrictas para pasar el build de tsc.
 */

// === INTERFACES TYPESCRIPT ===
export interface ProductTemplate {
  product: string;
  unitsPerBox: number;
  iniC: number;
  iniU: number;
  iniQ: number;
  finC: number;
  finU: number;
  finQ: number;
}

export interface EventStock {
  id: string;
  name: string;
  date: string;
  data: ProductTemplate[];
  createdAt: string;
}

export interface UserProfile {
  barName: string;
  userName: string;
}

interface ViewWrapperProps {
  title?: string;
  children: ReactNode;
  onBack?: () => void;
}

interface ControlRowProps {
  label: string;
  field: keyof ProductTemplate;
  step: number;
  isDecimals?: boolean;
}

// === COMPONENTE ENVOLTORIO ===
const ViewWrapper = ({ title, children, onBack }: ViewWrapperProps) => (
  <div className="min-h-screen bg-[#0D0D0D] p-6 max-w-sm mx-auto animate-fade-in">
    {onBack && (
      <button onClick={onBack} className="mb-8 font-bold text-[#333333] uppercase text-[10px] tracking-widest active:text-[#F2F2F2]">
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

// === APP PRINCIPAL ===
export default function App() {
  const [viewMode, setViewMode] = useState<string>('splash');
  const [splashOpacity, setSplashOpacity] = useState<number>(100);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); 
  const [setupBarName, setSetupBarName] = useState<string>('');
  const [setupUserName, setSetupUserName] = useState<string>('');
  const [events, setEvents] = useState<EventStock[]>([]);
  const [productTemplate, setProductTemplate] = useState<ProductTemplate[]>([
    { product: "FERNET BRANCA", unitsPerBox: 6, iniC: 0, iniU: 0, iniQ: 0, finC: 0, finU: 0, finQ: 0 },
    { product: "CAMPARI", unitsPerBox: 6, iniC: 0, iniU: 0, iniQ: 0, finC: 0, finU: 0, finQ: 0 },
    { product: "ABSOLUT", unitsPerBox: 10, iniC: 0, iniU: 0, iniQ: 0, finC: 0, finU: 0, finQ: 0 }
  ]);
  const [selectedStock, setSelectedStock] = useState<EventStock | null>(null);
  const [newEventName, setNewEventName] = useState<string>('EVENTO. ');
  const [newEventDate, setNewEventDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string>('date-desc');

  useEffect(() => {
    const savedProfile = localStorage.getItem('tb_profile');
    const savedEvents = localStorage.getItem('tb_events');
    const savedTemplate = localStorage.getItem('tb_template');

    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedTemplate) setProductTemplate(JSON.parse(savedTemplate));

    const fadeTimer = setTimeout(() => setSplashOpacity(0), 2500);
    const switchViewTimer = setTimeout(() => {
      setViewMode(savedProfile ? 'main' : 'login');
    }, 3500);

    return () => { clearTimeout(fadeTimer); clearTimeout(switchViewTimer); };
  }, []);

  useEffect(() => {
    if (userProfile) localStorage.setItem('tb_profile', JSON.stringify(userProfile));
    localStorage.setItem('tb_events', JSON.stringify(events));
    localStorage.setItem('tb_template', JSON.stringify(productTemplate));
  }, [userProfile, events, productTemplate]);

  const handleSimulateLogin = () => setViewMode('setup');

  const handleSaveProfile = () => {
    if (!setupBarName || !setupUserName) {
      setAlertMessage("COMPLETA AMBOS CAMPOS");
      return;
    }
    setUserProfile({ barName: setupBarName.toUpperCase(), userName: setupUserName.toUpperCase() });
    setViewMode('main');
  };

  const createStock = () => {
    if (!newEventName || newEventName.trim() === 'EVENTO.') {
      setAlertMessage("INGRESA UN NOMBRE PARA EL EVENTO");
      return;
    }
    const newEntry: EventStock = {
      id: Date.now().toString(),
      name: newEventName.toUpperCase(),
      date: newEventDate, 
      data: productTemplate.map(p => ({ ...p, iniC: 0, iniU: 0, iniQ: 0, finC: 0, finU: 0, finQ: 0 })),
      createdAt: new Date().toISOString()
    };
    setEvents([newEntry, ...events]);
    setNewEventName('EVENTO. ');
    setViewMode('history');
  };

  const updateField = (index: number, field: keyof ProductTemplate, delta: number, isDecimals: boolean = false) => {
    if (!selectedStock) return;
    
    const newData = [...selectedStock.data];
    let val = Number(newData[index][field]);
    
    if (isDecimals) {
      val = Number((val + delta).toFixed(1));
      if (val < 0) val = 0.9;
      if (val > 0.9) val = 0;
    } else {
      val = Math.max(0, val + delta);
    }
    
    (newData[index] as any)[field] = val;
    const updated: EventStock = { ...selectedStock, data: newData };
    
    setSelectedStock(updated);
    setEvents(events.map(ev => ev.id === updated.id ? updated : ev));
  };

  const calculateUnits = (c: number, u: number, q: number, uBox: number) => (Number(c) * uBox) + Number(u) + Number(q);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (sortOrder === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });
  }, [events, sortOrder]);

  const handleAddProduct = () => {
    const pNameInput = document.getElementById('pName') as HTMLInputElement | null;
    const pUnitInput = document.getElementById('pUnit') as HTMLInputElement | null;
    
    if (!pNameInput || !pUnitInput) return;
    
    const n = pNameInput.value.trim();
    const u = pUnitInput.value;
    
    if (!n || !u) return;
    
    const newProd: ProductTemplate = { 
      product: n.toUpperCase(), 
      unitsPerBox: Number(u), 
      iniC: 0, iniU: 0, iniQ: 0, 
      finC: 0, finU: 0, finQ: 0 
    };
    
    setProductTemplate([...productTemplate, newProd].sort((a,b) => a.product.localeCompare(b.product)));
    pNameInput.value = ''; 
    pUnitInput.value = '';
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    document.body.style.fontFamily = "'Inter', sans-serif";
    document.body.style.backgroundColor = '#0D0D0D';
    document.body.style.margin = '0';
    document.body.style.overflowX = 'hidden';
  }, []);

  if (viewMode === 'splash') {
    return (
      <div 
        className="h-screen w-full flex flex-col items-center justify-center bg-[#0D0D0D] text-[#F2F2F2] transition-opacity duration-1000 ease-in-out"
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
            <button onClick={handleSimulateLogin} className="w-full h-[60px] bg-[#F2F2F2] text-[#0D0D0D] rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all">Acceder con Google</button>
            <button onClick={handleSimulateLogin} className="w-full h-[60px] bg-[#1A1A1A] border border-[#333333] text-[#F2F2F2] rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all">Email y Clave</button>
          </div>
        </div>
      </ViewWrapper>
    );
  }

  if (viewMode === 'setup') {
    return (
      <ViewWrapper>
        <div className="flex flex-col min-h-[80vh] justify-center space-y-8">
          <div className="text-center">
            <h2 className="text-[2rem] font-bold text-[#F2F2F2] uppercase tracking-tight mb-2">Bienvenido</h2>
            <p className="text-[0.8rem] text-[#BFBFBF] uppercase tracking-widest">Configuración Inicial</p>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="NOMBRE DEL BOLICHE/BAR" value={setupBarName} onChange={e => setSetupBarName(e.target.value)} className="w-full h-[60px] bg-[#1A1A1A] border border-[#333333] text-[#F2F2F2] px-6 rounded-xl font-bold uppercase outline-none focus:border-[#F2F2F2]" />
            <input type="text" placeholder="TU NOMBRE DE USUARIO" value={setupUserName} onChange={e => setSetupUserName(e.target.value)} className="w-full h-[60px] bg-[#1A1A1A] border border-[#333333] text-[#F2F2F2] px-6 rounded-xl font-bold uppercase outline-none focus:border-[#F2F2F2]" />
            <button onClick={handleSaveProfile} className="w-full h-[60px] mt-4 bg-[#F2F2F2] text-[#0D0D0D] rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-transform">Continuar</button>
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
            <p className="text-[0.65rem] text-[#333333] uppercase tracking-widest mt-2 font-bold">OP: {userProfile?.userName}</p>
          </header>
          <div className="space-y-4">
            <button onClick={() => setViewMode('create')} className="w-full h-[64px] bg-[#F2F2F2] text-[#0D0D0D] rounded-2xl font-bold uppercase tracking-wider active:scale-95 transition-all">Nueva Planilla +</button>
            <button onClick={() => setViewMode('history')} className="w-full h-[64px] bg-[#1A1A1A] text-[#F2F2F2] border border-[#333333] rounded-2xl font-bold uppercase tracking-wider active:scale-95 transition-all">Historial</button>
            <button onClick={() => setViewMode('products')} className="w-full h-[64px] bg-[#1A1A1A] text-[#F2F2F2] border border-[#333333] rounded-2xl font-bold uppercase tracking-wider active:scale-95 transition-all">Productos</button>
            <button onClick={() => confirm("¿Cerrar sesión?") && (setUserProfile(null) || localStorage.removeItem('tb_profile') || setViewMode('login'))} className="w-full pt-8 text-[0.7rem] font-bold text-[#333333] uppercase tracking-[0.2em]">Cerrar Sesión</button>
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

        <div className="sticky top-[85px] z-40 bg-[#1A1A1A] flex px-2 py-3 text-[10px] font-bold uppercase tracking-widest border-b border-[#333333] text-[#BFBFBF]">
          <div className="w-[25%] pl-2 flex items-center">PROD.</div>
          <div className="w-[30%] text-center border-x border-[#333333]">INICIAL</div>
          <div className="w-[30%] text-center border-r border-[#333333]">FINAL</div>
          <div className="w-[15%] text-center">GAS</div>
        </div>

        <div className="px-2 mt-4 space-y-3">
          {selectedStock.data.map((row, i) => {
            const ini = calculateUnits(row.iniC, row.iniU, row.iniQ, row.unitsPerBox);
            const fin = calculateUnits(row.finC, row.finU, row.finQ, row.unitsPerBox);
            const gastoNum = ini - fin;
            const gastoStr = gastoNum.toFixed(1);
            
            const ControlRow = ({ label, field, step, isDecimals }: ControlRowProps) => (
              <div className="flex justify-between items-center bg-[#0D0D0D] rounded-lg mb-1 p-1">
                <span className="text-[9px] font-bold text-[#333333] w-4 text-center">{label}</span>
                <button onClick={() => updateField(i, field, -step, isDecimals)} className="text-[18px] w-8 h-8 flex items-center justify-center text-[#BFBFBF] active:bg-[#333333] rounded-md">-</button>
                <span className="text-[14px] font-mono font-bold w-6 text-center">{isDecimals ? `.${Math.round(Number(row[field]) * 10)}` : row[field]}</span>
                <button onClick={() => updateField(i, field, step, isDecimals)} className="text-[18px] w-8 h-8 flex items-center justify-center text-[#F2F2F2] active:bg-[#333333] rounded-md">+</button>
              </div>
            );

            return (
              <div key={i} className="flex bg-[#1A1A1A] border border-[#333333] rounded-xl p-2 items-stretch">
                <div className="w-[25%] pr-2 flex flex-col justify-center">
                  <p className="font-bold text-[11px] uppercase leading-tight">{row.product}</p>
                  <p className="text-[9px] text-[#BFBFBF] font-mono mt-1">X{row.unitsPerBox}</p>
                </div>
                <div className="w-[30%] px-1 border-l border-[#333333] flex flex-col">
                  <ControlRow label="C" field="iniC" step={1} />
                  <ControlRow label="U" field="iniU" step={1} />
                  <ControlRow label="D" field="iniQ" step={0.1} isDecimals={true} />
                  <div className="mt-1 py-1 text-center bg-[#A68A2E]/10 rounded-lg border border-[#A68A2E]/30">
                    <span className="text-[11px] font-mono font-bold text-[#A68A2E]">T: {ini.toFixed(1)}</span>
                  </div>
                </div>
                <div className="w-[30%] px-1 border-x border-[#333333] flex flex-col">
                  <ControlRow label="C" field="finC" step={1} />
                  <ControlRow label="U" field="finU" step={1} />
                  <ControlRow label="D" field="finQ" step={0.1} isDecimals={true} />
                  <div className="mt-1 py-1 text-center bg-[#A68A2E]/10 rounded-lg border border-[#A68A2E]/30">
                    <span className="text-[11px] font-mono font-bold text-[#A68A2E]">T: {fin.toFixed(1)}</span>
                  </div>
                </div>
                <div className="w-[15%] flex items-center justify-center">
                  <div className={`text-[1.3rem] font-extrabold font-mono tracking-tighter ${gastoNum < 0 ? 'text-[#8C3030]' : 'text-[#F2F2F2]'}`}>
                    {Math.abs(gastoNum) < 0.01 ? "0" : gastoStr}
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
          <label className="text-[10px] text-[#BFBFBF] font-bold uppercase pl-2">Referencia del Evento</label>
          <input value={newEventName} onChange={e => setNewEventName(e.target.value)} className="w-full h-[60px] bg-[#1A1A1A] border border-[#333333] px-5 rounded-2xl font-bold uppercase text-[#F2F2F2] outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-[#BFBFBF] font-bold uppercase pl-2">Fecha</label>
          <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full h-[60px] bg-[#1A1A1A] border border-[#333333] px-5 rounded-2xl font-bold text-[#F2F2F2] outline-none" />
        </div>
        <button onClick={createStock} className="w-full h-[60px] bg-[#F2F2F2] text-[#0D0D0D] rounded-2xl font-bold uppercase tracking-widest mt-4">Crear Registro</button>
      </div>
    </ViewWrapper>
  );

  if (viewMode === 'history') return (
    <ViewWrapper title="Historial" onBack={() => setViewMode('main')}>
      <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full bg-[#1A1A1A] text-[#F2F2F2] border border-[#333333] p-4 rounded-xl outline-none font-bold text-[10px] uppercase tracking-[0.2em] mb-6 appearance-none text-center">
        <option value="date-desc">Más Recientes</option>
        <option value="date-asc">Más Antiguos</option>
        <option value="name-asc">Nombre A-Z</option>
        <option value="name-desc">Nombre Z-A</option>
      </select>
      <div className="space-y-3">
        {sortedEvents.map(e => (
          <div key={e.id} className="p-6 bg-[#1A1A1A] border border-[#333333] rounded-2xl flex items-center justify-between cursor-pointer" onClick={() => { setSelectedStock(e); setViewMode('detail'); }}>
            <div>
              <p className="font-bold text-[#F2F2F2] uppercase tracking-tight">{e.name}</p>
              <p className="text-[10px] text-[#BFBFBF] font-medium uppercase mt-1 tracking-widest">{e.date}</p>
            </div>
            <button onClick={ev => { ev.stopPropagation(); confirm("¿Borrar?") && setEvents(events.filter(x => x.id !== e.id)); }} className="text-[#8C3030] font-bold text-[10px] uppercase bg-[#8C3030]/10 px-3 py-2 rounded-lg">Borrar</button>
          </div>
        ))}
      </div>
    </ViewWrapper>
  );

  if (viewMode === 'products') return (
    <ViewWrapper title="Productos" onBack={() => setViewMode('main')}>
      <div className="space-y-2 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {productTemplate.map((p, i) => (
          <div key={i} className="flex justify-between p-4 bg-[#1A1A1A] border border-[#333333] rounded-xl items-center">
            <p className="font-bold uppercase text-[12px] text-[#F2F2F2]">{p.product} <span className="text-[#BFBFBF] ml-2 font-mono text-[10px]">x{p.unitsPerBox}</span></p>
            <button onClick={() => setProductTemplate(productTemplate.filter((_, idx) => idx !== i))} className="text-[#8C3030] font-bold text-xl px-2">×</button>
          </div>
        ))}
      </div>
      <div className="pt-6 border-t border-[#333333] space-y-3">
        <input id="pName" placeholder="NOMBRE DEL PRODUCTO" className="w-full h-[54px] bg-[#1A1A1A] border border-[#333333] px-5 rounded-xl font-bold uppercase text-xs text-[#F2F2F2] outline-none" />
        <input id="pUnit" type="number" placeholder="UNIDADES POR CAJA" className="w-full h-[54px] bg-[#1A1A1A] border border-[#333333] px-5 rounded-xl font-bold text-xs text-[#F2F2F2] outline-none" />
        <button onClick={handleAddProduct} className="w-full h-[54px] bg-[#F2F2F2] text-[#0D0D0D] rounded-xl font-bold uppercase text-xs tracking-widest mt-2">Añadir al Maestro</button>
      </div>
    </ViewWrapper>
  );

  return (
    <>
      {alertMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={() => setAlertMessage(null)}>
          <div className="bg-[#1A1A1A] border border-[#333333] p-8 rounded-2xl text-center shadow-2xl max-w-xs w-full animate-fade-in">
            <p className="font-bold text-[#F2F2F2] mb-8 uppercase text-[11px] tracking-widest">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full py-4 bg-[#F2F2F2] text-[#0D0D0D] rounded-lg text-[10px] font-bold uppercase tracking-widest">Entendido</button>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}} />
    </>
  );
}