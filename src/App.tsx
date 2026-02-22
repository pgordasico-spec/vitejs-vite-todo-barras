import React, { useState, useEffect, useMemo } from 'react';

/**
 * APP: TODO BARRAS v7 - Versión Columnas Fijas
 * - Selector de fecha restaurado.
 * - Tabla con encabezados C | U | D | T.
 * - Totales por fila (por producto).
 * - Glosario en la esquina superior derecha.
 * - Cabeceras fijas (sticky).
 */

export default function App() {
  // --- ESTADOS DE SISTEMA ---
  const [viewMode, setViewMode] = useState('splash');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [appConfig, setAppConfig] = useState(null);

  // --- ESTADOS DE LOGIN ---
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);

  // --- ESTADOS DE CONFIGURACIÓN ---
  const [setupTitle, setSetupTitle] = useState('');
  const [setupPass, setSetupPass] = useState('');

  const [oldPassCheck, setOldPassCheck] = useState('');
  const [newPassUpdate, setNewPassUpdate] = useState('');

  // --- ESTADOS DE DATOS ---
  const [events, setEvents] = useState([]);
  const [productTemplate, setProductTemplate] = useState([
    {
      product: 'FERNET BRANCA',
      unitsPerBox: 6,
      iniC: 0,
      iniU: 0,
      iniQ: 0,
      finC: 0,
      finU: 0,
      finQ: 0,
    },
    {
      product: 'CAMPARI',
      unitsPerBox: 6,
      iniC: 0,
      iniU: 0,
      iniQ: 0,
      finC: 0,
      finU: 0,
      finQ: 0,
    },
  ]);
  const [selectedStock, setSelectedStock] = useState(null);

  // --- FORMULARIOS ---
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [sortMethod, setSortMethod] = useState('dateDesc');

  // Persistencia
  useEffect(() => {
    const savedConfig = localStorage.getItem('todo_barras_config');
    const savedEvents = localStorage.getItem('todo_barras_events');
    const savedTemplate = localStorage.getItem('todo_barras_template');

    if (savedConfig) setAppConfig(JSON.parse(savedConfig));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedTemplate) setProductTemplate(JSON.parse(savedTemplate));

    const timer = setTimeout(() => {
      if (!savedConfig) setViewMode('setup');
      else setViewMode('login');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (appConfig)
      localStorage.setItem('todo_barras_config', JSON.stringify(appConfig));
  }, [appConfig]);

  useEffect(() => {
    localStorage.setItem('todo_barras_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(
      'todo_barras_template',
      JSON.stringify(productTemplate)
    );
  }, [productTemplate]);

  const handleSaveSetup = () => {
    if (!setupTitle.trim() || setupPass.length < 4) {
      setAlertMessage(
        'El nombre es obligatorio y la clave debe tener al menos 4 caracteres.'
      );
      return;
    }
    setAppConfig({ title: setupTitle.toUpperCase(), password: setupPass });
    setIsUnlocked(true);
    setViewMode('main');
  };

  const handleSecurityAccess = () => {
    if (
      loginUser.toLowerCase() === 'admin' &&
      loginPass === appConfig.password
    ) {
      setIsUnlocked(true);
      setViewMode('main');
    } else {
      setAlertMessage('Acceso denegado.');
    }
  };

  const createStock = () => {
    if (!newEventName || !newEventDate) {
      setAlertMessage('Ingresa nombre y fecha.');
      return;
    }
    const dateObj = new Date(newEventDate + 'T12:00:00');
    const newEntry = {
      id: Date.now().toString(),
      name: newEventName.toUpperCase(),
      date: dateObj.toLocaleDateString(),
      data: productTemplate.map((p) => ({
        ...p,
        iniC: 0,
        iniU: 0,
        iniQ: 0,
        finC: 0,
        finU: 0,
        finQ: 0,
      })),
      createdAt: dateObj.toISOString(),
    };
    const updatedEvents = [newEntry, ...events];
    setEvents(updatedEvents);
    setNewEventName('');
    setAlertMessage('Planilla creada.');
    setViewMode('history');
  };

  const calculateUnits = (c, u, q, uBox) => {
    return Number(c) * uBox + Number(u) + Number(q);
  };

  const calculateGasto = (row) => {
    const uBox = Number(row.unitsPerBox) || 0;
    const ini = calculateUnits(row.iniC, row.iniU, row.iniQ, uBox);
    const fin = calculateUnits(row.finC, row.finU, row.finQ, uBox);
    return (ini - fin).toFixed(1);
  };

  const updateField = (index, field, delta, isDecimals = false) => {
    const newData = [...selectedStock.data];
    const val = Number(newData[index][field]);

    if (isDecimals) {
      let next = val + delta;
      if (next < 0) next = 0.9;
      if (next > 0.9) next = 0;
      newData[index][field] = Number(next.toFixed(1));
    } else {
      newData[index][field] = Math.max(0, val + delta);
    }

    const updated = { ...selectedStock, data: newData };
    setSelectedStock(updated);
    setEvents(events.map((ev) => (ev.id === updated.id ? updated : ev)));
  };

  const sortedEvents = useMemo(() => {
    let result = [...events];
    if (sortMethod === 'dateDesc')
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sortMethod === 'dateAsc')
      result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return result;
  }, [events, sortMethod]);

  // Vistas de Estructura
  if (viewMode === 'splash') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white p-4">
        <div className="text-center animate-pulse">
          <h1 className="text-5xl font-black tracking-tighter">TODO BARRAS</h1>
          <p className="mt-2 text-sm font-bold text-gray-400 tracking-[0.3em]">
            CARGANDO...
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === 'setup') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50 p-4">
        <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl text-center">
          <h2 className="text-2xl font-black mb-6">CONFIGURACIÓN</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="NOMBRE DEL BOLICHE"
              value={setupTitle}
              onChange={(e) => setSetupTitle(e.target.value)}
              className="w-full rounded-2xl border-2 p-4 font-bold uppercase outline-none focus:border-emerald-500"
            />
            <input
              type="password"
              placeholder="CLAVE ADMIN"
              value={setupPass}
              onChange={(e) => setSetupPass(e.target.value)}
              className="w-full rounded-2xl border-2 p-4 font-bold outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSaveSetup}
              className="w-full rounded-2xl bg-emerald-500 py-4 font-black text-white shadow-lg"
            >
              GUARDAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 text-center">
        <div className="w-full max-w-xs rounded-[2rem] bg-white p-8 shadow-xl border border-gray-100">
          <h1 className="text-3xl font-black mb-1 uppercase tracking-tighter">
            {appConfig?.title}
          </h1>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-8">
            Acceso
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="USUARIO"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              className="w-full rounded-xl border p-4 text-center font-bold outline-none"
            />
            <input
              type="password"
              placeholder="CLAVE"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSecurityAccess()}
              className="w-full rounded-xl border p-4 text-center font-bold outline-none"
            />
            <button
              onClick={handleSecurityAccess}
              className="w-full rounded-xl bg-black py-4 font-black text-white"
            >
              ENTRAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'main') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-full max-w-sm">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
              {appConfig.title}
            </h1>
            <p className="text-[10px] font-bold text-gray-300 tracking-[0.3em] mt-3 uppercase">
              LA GERENCIA
            </p>
          </header>
          <div className="grid gap-3">
            <button
              onClick={() => setViewMode('create')}
              className="w-full rounded-2xl bg-emerald-500 py-6 font-black text-white shadow-md"
            >
              NUEVA PLANILLA +
            </button>
            <button
              onClick={() => setViewMode('history')}
              className="w-full rounded-2xl bg-blue-500 py-6 font-black text-white shadow-md"
            >
              HISTORIAL 📋
            </button>
            <button
              onClick={() => setViewMode('products')}
              className="w-full rounded-2xl bg-purple-500 py-6 font-black text-white shadow-md"
            >
              PRODUCTOS ⚙️
            </button>
            <button
              onClick={() => setViewMode('options')}
              className="w-full rounded-2xl bg-white border border-gray-200 py-6 font-black text-gray-700 shadow-sm"
            >
              OPCIONES 🛠️
            </button>
            <button
              onClick={() => {
                setIsUnlocked(false);
                setViewMode('login');
              }}
              className="mt-8 text-[9px] font-black text-gray-300 uppercase tracking-widest"
            >
              Desconectar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'options') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md">
          <button
            onClick={() => setViewMode('main')}
            className="mb-6 font-black text-gray-400 uppercase text-[10px]"
          >
            ← Volver
          </button>
          <div className="bg-white rounded-[2rem] p-8 shadow-xl space-y-8">
            <h2 className="text-2xl font-black uppercase text-center">
              Opciones
            </h2>
            <section className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase">
                Nombre del Boliche
              </label>
              <div className="flex gap-2">
                <input
                  value={setupTitle}
                  onChange={(e) => setSetupTitle(e.target.value)}
                  placeholder={appConfig.title}
                  className="flex-1 bg-gray-50 p-4 rounded-xl font-bold uppercase outline-none"
                />
                <button
                  onClick={() => {
                    if (setupTitle)
                      setAppConfig({
                        ...appConfig,
                        title: setupTitle.toUpperCase(),
                      });
                    setAlertMessage('Nombre actualizado');
                  }}
                  className="bg-emerald-500 text-white px-4 rounded-xl font-black uppercase text-[10px]"
                >
                  OK
                </button>
              </div>
            </section>
            <section className="space-y-3 pt-4 border-t">
              <label className="text-[10px] font-black text-gray-400 uppercase">
                Seguridad
              </label>
              <input
                type="password"
                placeholder="Clave Anterior"
                value={oldPassCheck}
                onChange={(e) => setOldPassCheck(e.target.value)}
                className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none text-sm"
              />
              <input
                type="password"
                placeholder="Nueva Clave"
                value={newPassUpdate}
                onChange={(e) => setNewPassUpdate(e.target.value)}
                className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none text-sm"
              />
              <button
                onClick={() => {
                  if (
                    oldPassCheck === appConfig.password &&
                    newPassUpdate.length >= 4
                  ) {
                    setAppConfig({ ...appConfig, password: newPassUpdate });
                    setOldPassCheck('');
                    setNewPassUpdate('');
                    setAlertMessage('Clave cambiada');
                  } else setAlertMessage('Error en datos');
                }}
                className="w-full bg-black text-white py-4 rounded-xl font-black uppercase text-xs"
              >
                Cambiar Contraseña
              </button>
            </section>
            <div className="text-center pt-4">
              <a
                href="mailto:pgordasico@gmail.com"
                className="text-blue-500 font-black uppercase text-[10px]"
              >
                Contactanos ✉️
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'detail' && selectedStock) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="sticky top-0 z-30 bg-white border-b p-4 px-6 flex items-center justify-between shadow-sm">
          <button
            onClick={() => setViewMode('history')}
            className="text-gray-400 font-black text-[10px] uppercase"
          >
            ← Atrás
          </button>
          <div className="text-center">
            <h2 className="font-black text-lg uppercase leading-none tracking-tighter">
              {selectedStock.name}
            </h2>
            <p className="text-[9px] font-bold text-gray-400 uppercase">
              {selectedStock.date}
            </p>
          </div>
          <div className="text-[8px] font-black bg-gray-50 p-2 rounded-lg text-gray-400 leading-none">
            C=CAJA U=UNI D=DEC
          </div>
        </header>

        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed min-w-[700px]">
            <thead className="sticky top-[68px] z-20 bg-gray-900 text-white text-[9px] font-black uppercase">
              <tr>
                <th
                  rowSpan="2"
                  className="w-[150px] p-3 text-left border-r border-gray-800"
                >
                  Producto
                </th>
                <th
                  colSpan="4"
                  className="p-2 border-b border-gray-800 bg-emerald-900"
                >
                  STOCK INICIAL
                </th>
                <th
                  colSpan="4"
                  className="p-2 border-b border-gray-800 bg-blue-900"
                >
                  STOCK FINAL
                </th>
                <th rowSpan="2" className="w-[80px] p-3 bg-red-900">
                  GASTO
                </th>
              </tr>
              <tr className="bg-gray-800">
                <th className="p-2">C</th>
                <th className="p-2">U</th>
                <th className="p-2">D</th>
                <th className="p-2 bg-emerald-800">T</th>
                <th className="p-2">C</th>
                <th className="p-2">U</th>
                <th className="p-2">D</th>
                <th className="p-2 bg-blue-800">T</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 font-bold text-xs">
              {selectedStock.data.map((row, i) => {
                const totalIni = calculateUnits(
                  row.iniC,
                  row.iniU,
                  row.iniQ,
                  row.unitsPerBox
                );
                const totalFin = calculateUnits(
                  row.finC,
                  row.finU,
                  row.finQ,
                  row.unitsPerBox
                );
                const gastoValue = calculateGasto(row);
                return (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="p-3 border-r border-gray-50 sticky left-0 bg-white z-10">
                      <p className="uppercase text-[10px] leading-tight truncate">
                        {row.product}
                      </p>
                      <p className="text-[8px] text-gray-300 font-normal italic">
                        Caja x{row.unitsPerBox}
                      </p>
                    </td>

                    {/* INICIAL */}
                    <td className="p-1">
                      <button
                        onClick={() => updateField(i, 'iniC', 1)}
                        className="w-full py-1 text-emerald-500"
                      >
                        +
                      </button>
                      <div className="text-center">{row.iniC}</div>
                      <button
                        onClick={() => updateField(i, 'iniC', -1)}
                        className="w-full py-1 text-emerald-500"
                      >
                        -
                      </button>
                    </td>
                    <td className="p-1">
                      <button
                        onClick={() => updateField(i, 'iniU', 1)}
                        className="w-full py-1 text-emerald-500"
                      >
                        +
                      </button>
                      <div className="text-center">{row.iniU}</div>
                      <button
                        onClick={() => updateField(i, 'iniU', -1)}
                        className="w-full py-1 text-emerald-500"
                      >
                        -
                      </button>
                    </td>
                    <td className="p-1">
                      <button
                        onClick={() => updateField(i, 'iniQ', 0.1, true)}
                        className="w-full py-1 text-emerald-500"
                      >
                        +
                      </button>
                      <div className="text-center">
                        .{Math.round(row.iniQ * 10)}
                      </div>
                      <button
                        onClick={() => updateField(i, 'iniQ', -0.1, true)}
                        className="w-full py-1 text-emerald-500"
                      >
                        -
                      </button>
                    </td>
                    <td className="p-1 bg-emerald-50 text-center font-black text-emerald-700">
                      {totalIni.toFixed(1)}
                    </td>

                    {/* FINAL */}
                    <td className="p-1">
                      <button
                        onClick={() => updateField(i, 'finC', 1)}
                        className="w-full py-1 text-blue-500"
                      >
                        +
                      </button>
                      <div className="text-center">{row.finC}</div>
                      <button
                        onClick={() => updateField(i, 'finC', -1)}
                        className="w-full py-1 text-blue-500"
                      >
                        -
                      </button>
                    </td>
                    <td className="p-1">
                      <button
                        onClick={() => updateField(i, 'finU', 1)}
                        className="w-full py-1 text-blue-500"
                      >
                        +
                      </button>
                      <div className="text-center">{row.finU}</div>
                      <button
                        onClick={() => updateField(i, 'finU', -1)}
                        className="w-full py-1 text-blue-500"
                      >
                        -
                      </button>
                    </td>
                    <td className="p-1">
                      <button
                        onClick={() => updateField(i, 'finQ', 0.1, true)}
                        className="w-full py-1 text-blue-500"
                      >
                        +
                      </button>
                      <div className="text-center">
                        .{Math.round(row.finQ * 10)}
                      </div>
                      <button
                        onClick={() => updateField(i, 'finQ', -0.1, true)}
                        className="w-full py-1 text-blue-500"
                      >
                        -
                      </button>
                    </td>
                    <td className="p-1 bg-blue-50 text-center font-black text-blue-700">
                      {totalFin.toFixed(1)}
                    </td>

                    <td className="p-3 text-center bg-gray-50 font-black text-red-600">
                      {gastoValue}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 font-sans">
      <div className="mx-auto max-w-xl">
        <button
          onClick={() => setViewMode('main')}
          className="mb-6 font-black text-gray-400 uppercase text-[9px] tracking-widest"
        >
          ← Menú Principal
        </button>
        <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-gray-100">
          {viewMode === 'create' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase text-center tracking-tighter">
                Nueva Planilla
              </h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
                    Evento
                  </label>
                  <input
                    placeholder="EJ: SÁBADO / BARRA 1"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    className="w-full border-2 bg-gray-50 p-4 rounded-xl font-black uppercase outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full border-2 bg-gray-50 p-4 rounded-xl font-black outline-none focus:border-emerald-400"
                  />
                </div>
                <button
                  onClick={createStock}
                  className="w-full bg-emerald-500 py-5 rounded-xl text-white font-black shadow-lg uppercase text-sm"
                >
                  Comenzar
                </button>
              </div>
            </div>
          )}

          {viewMode === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                  Historial
                </h2>
                <select
                  value={sortMethod}
                  onChange={(e) => setSortMethod(e.target.value)}
                  className="bg-gray-100 rounded-lg p-2 text-[9px] font-black uppercase outline-none"
                >
                  <option value="dateDesc">Más Recientes</option>
                  <option value="dateAsc">Más Antiguos</option>
                </select>
              </div>
              <div className="space-y-3">
                {sortedEvents.length === 0 && (
                  <p className="text-center py-12 text-gray-300 font-bold uppercase text-[10px]">
                    Sin datos
                  </p>
                )}
                {sortedEvents.map((e) => (
                  <div
                    key={e.id}
                    className="p-5 bg-gray-50 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-gray-100 group"
                    onClick={() => {
                      setSelectedStock(e);
                      setViewMode('detail');
                    }}
                  >
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">
                        {e.name}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">
                        {e.date}
                      </p>
                    </div>
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        confirm('¿Borrar?') &&
                          setEvents(events.filter((x) => x.id !== e.id));
                      }}
                      className="text-red-200 group-hover:text-red-500 font-black text-xs p-2"
                    >
                      ELIMINAR
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'products' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase text-center">
                Productos
              </h2>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {productTemplate.map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between p-4 bg-gray-50 rounded-xl items-center border border-transparent hover:border-purple-200"
                  >
                    <p className="font-black uppercase text-[11px]">
                      {p.product}{' '}
                      <span className="text-gray-300 ml-2 font-bold">
                        (x{p.unitsPerBox})
                      </span>
                    </p>
                    <button
                      onClick={() =>
                        setProductTemplate(
                          productTemplate.filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-red-200 hover:text-red-500 font-black text-lg px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    id="pName"
                    placeholder="NOMBRE"
                    className="border-2 bg-gray-50 p-4 rounded-xl font-black uppercase text-xs outline-none"
                  />
                  <input
                    id="pUnit"
                    type="number"
                    placeholder="CAJA X"
                    className="border-2 bg-gray-50 p-4 rounded-xl font-black text-xs outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    const n = document.getElementById('pName').value.trim();
                    const u = document.getElementById('pUnit').value;
                    if (!n || !u) return;
                    setProductTemplate(
                      [
                        ...productTemplate,
                        {
                          product: n.toUpperCase(),
                          unitsPerBox: Number(u),
                          iniC: 0,
                          iniU: 0,
                          iniQ: 0,
                          finC: 0,
                          finU: 0,
                          finQ: 0,
                        },
                      ].sort((a, b) => a.product.localeCompare(b.product))
                    );
                    document.getElementById('pName').value = '';
                    document.getElementById('pUnit').value = '';
                  }}
                  className="w-full bg-purple-500 py-4 rounded-xl text-white font-black uppercase text-xs shadow-md"
                >
                  Añadir Producto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {alertMessage && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-[100]"
          onClick={() => setAlertMessage(null)}
        >
          <div className="bg-white p-8 rounded-3xl text-center shadow-2xl max-w-xs w-full">
            <p className="font-bold text-gray-800 mb-6 uppercase text-xs">
              {alertMessage}
            </p>
            <button
              onClick={() => setAlertMessage(null)}
              className="w-full py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
