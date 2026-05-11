import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Monitor,
  Router,
  Share2,
  Play,
  Trash2,
  Plus,
  Info,
  ArrowRight,
  MousePointer2,
  Lightbulb,
  Box,
  Layers,
  X,
  Activity,
  Network,
  Cpu,
  Zap,
  ShieldCheck,
  Scissors,
  AlertCircle,
  Heart,
  Move,
} from "lucide-react";

const osiLayers = [
  {
    num: 1,
    name: "Física",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50",
    desc: "Se encarga de las conexiones físicas: cables, conectores y la transmisión de bits (señales eléctricas o de luz).",
  },
  {
    num: 2,
    name: "Enlace de Datos",
    icon: ShieldCheck,
    color: "text-teal-600",
    bg: "bg-teal-50",
    desc: "Direccionamiento físico (MAC) y detección de errores. Prepara el paquete para el medio físico (Trama).",
  },
  {
    num: 3,
    name: "Red",
    icon: Network,
    color: "text-purple-600",
    bg: "bg-purple-50",
    desc: "Determinación de ruta y direccionamiento lógico (IP). Aquí es donde operan los Routers.",
  },
  {
    num: 4,
    name: "Transporte",
    icon: Activity,
    color: "text-blue-600",
    bg: "bg-blue-50",
    desc: "Conexión extremo a extremo y control de flujo. Protocolos como TCP (confiable) y UDP (rápido).",
  },
  {
    num: 5,
    name: "Sesión",
    icon: Info,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    desc: "Mantiene y controla el enlace entre dos computadores que están transmitiendo datos.",
  },
  {
    num: 6,
    name: "Presentación",
    icon: Cpu,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    desc: "Traducción, cifrado y compresión de datos para que la capa de aplicación los entienda.",
  },
  {
    num: 7,
    name: "Aplicación",
    icon: Monitor,
    color: "text-rose-600",
    bg: "bg-rose-50",
    desc: "Interfaz directa con el usuario (Navegador, Email). Protocolos como HTTP, FTP, DNS.",
  },
];

const App = () => {
  const [nodes, setNodes] = useState([
    {
      id: 1,
      type: "pc",
      name: "PC-1",
      mac: "AA:BB:CC:DD:EE:01",
      x: 150,
      y: 150,
    },
    {
      id: 2,
      type: "router",
      name: "Router-1",
      mac: "00:11:22:33:44:01",
      x: 350,
      y: 150,
    },
    {
      id: 3,
      type: "router",
      name: "Router-2",
      mac: "00:11:22:33:44:02",
      x: 550,
      y: 150,
    },
    {
      id: 4,
      type: "router",
      name: "Router-3",
      mac: "00:11:22:33:44:03",
      x: 450,
      y: 350,
    },
    {
      id: 5,
      type: "pc",
      name: "PC-2",
      mac: "AA:BB:CC:DD:EE:02",
      x: 750,
      y: 350,
    },
  ]);

  const [links, setLinks] = useState([
    { id: "l1", source: 1, target: 2 },
    { id: "l2", source: 2, target: 3 },
    { id: "l3", source: 2, target: 4 },
    { id: "l4", source: 3, target: 4 },
    { id: "l5", source: 5, target: 4 },
  ]);

  const [selectedNode, setSelectedNode] = useState(null);
  const [mode, setMode] = useState("select");
  const [simSource, setSimSource] = useState(null);
  const [simStep, setSimStep] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const [showEncapModal, setShowEncapModal] = useState(false);
  const [encapActiveStep, setEncapActiveStep] = useState(0);
  const [showOsiModal, setShowOsiModal] = useState(false);
  const [activeOsiLayer, setActiveOsiLayer] = useState(7);

  const canvasRef = useRef(null);

  const getLinkIPs = useCallback(
    (link, nodesList) => {
      if (!link) return { sIP: "0.0.0.0", tIP: "0.0.0.0", subnet: "" };
      const s = nodesList.find((n) => n.id === link.source);
      const t = nodesList.find((n) => n.id === link.target);
      if (!s || !t) return { sIP: "0.0.0.0", tIP: "0.0.0.0", subnet: "" };

      if (s.type === "router" && t.type === "router") {
        const linkIdx = links.findIndex((l) => l.id === link.id) + 1;
        return {
          sIP: `10.0.${linkIdx}.1`,
          tIP: `10.0.${linkIdx}.2`,
          subnet: `10.0.${linkIdx}.0/30`,
        };
      }

      const router = s.type === "router" ? s : t;
      const pc = s.type === "pc" ? s : t;
      if (router && pc) {
        const rIdx =
          nodesList.filter((n) => n.type === "router").indexOf(router) + 1;
        const sIPValue =
          s.type === "router"
            ? `192.168.${rIdx}.1`
            : `192.168.${rIdx}.${10 + (pc.id % 100)}`;
        const tIPValue =
          t.type === "router"
            ? `192.168.${rIdx}.1`
            : `192.168.${rIdx}.${10 + (pc.id % 100)}`;
        return { sIP: sIPValue, tIP: tIPValue, subnet: `192.168.${rIdx}.0/24` };
      }
      return { sIP: "N/A", tIP: "N/A", subnet: "" };
    },
    [links],
  );

  const findPath = (startId, endId) => {
    const queue = [[startId]];
    const visited = new Set([startId]);
    while (queue.length > 0) {
      const path = queue.shift();
      const nodeId = path[path.length - 1];
      if (nodeId === endId)
        return path.map((id) => nodes.find((n) => n.id === id));
      const neighbors = links
        .filter((l) => l.source === nodeId || l.target === nodeId)
        .map((l) => (l.source === nodeId ? l.target : l.source));
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    return null;
  };

  const nextStep = () => {
    if (simStep && simStep.index < simStep.path.length - 1) {
      setSimStep({ ...simStep, index: simStep.index + 1 });
    } else setSimStep(null);
  };

  const addNode = (type) => {
    const id = Date.now();
    const newNode = {
      id,
      type,
      name:
        type === "pc"
          ? `PC-${nodes.filter((n) => n.type === "pc").length + 1}`
          : `Router-${nodes.filter((n) => n.type === "router").length + 1}`,
      mac: Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 256)
          .toString(16)
          .padStart(2, "0"),
      )
        .join(":")
        .toUpperCase(),
      x: 300 - panOffset.x,
      y: 200 - panOffset.y,
    };
    setNodes([...nodes, newNode]);
    setMode("select");
  };

  const deleteNode = (id) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setLinks(links.filter((l) => l.source !== id && l.target !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
  };

  const deleteLink = (sourceId, targetId) => {
    setLinks(
      links.filter(
        (l) =>
          !(
            (l.source === sourceId && l.target === targetId) ||
            (l.source === targetId && l.target === sourceId)
          ),
      ),
    );
  };

  // MANEJO DE CLIC EN NODO (Unificado para todos los modos)
  const handleNodeEvent = (e, node) => {
    e.stopPropagation();
    if (mode === "select") {
      setSelectedNode(node);
      setDraggingNode(node.id);
    } else if (mode === "link") {
      if (selectedNode && selectedNode.id !== node.id) {
        const exists = links.find(
          (l) =>
            (l.source === selectedNode.id && l.target === node.id) ||
            (l.source === node.id && l.target === selectedNode.id),
        );
        if (!exists)
          setLinks([
            ...links,
            { id: `l-${Date.now()}`, source: selectedNode.id, target: node.id },
          ]);
        setSelectedNode(null);
        setMode("select");
      } else setSelectedNode(node);
    } else if (mode === "simulate") {
      if (!simSource) setSimSource(node);
      else {
        const path = findPath(simSource.id, node.id);
        if (!path) {
          setErrorMessage("No hay camino físico (cable) entre estos equipos.");
          setTimeout(() => setErrorMessage(null), 3000);
        } else {
          setSimStep({ path, index: 0, origin: simSource, finalDest: node });
        }
        setSimSource(null);
      }
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (draggingNode) return;
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (draggingNode && canvasRef.current) {
        const svg = canvasRef.current;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingNode
              ? { ...n, x: svgP.x - panOffset.x, y: svgP.y - panOffset.y }
              : n,
          ),
        );
      } else if (isPanning) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    },
    [draggingNode, isPanning, lastMousePos, panOffset],
  );

  const handleMouseUp = () => {
    setDraggingNode(null);
    setIsPanning(false);
  };

  const updateNodeData = (id, field, value) => {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
    if (selectedNode?.id === id)
      setSelectedNode((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden select-none transition-all">
      <header className="p-4 bg-white border-b border-slate-200 flex justify-between items-center z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-8 h-8 text-blue-600 fill-blue-600/10" strokeWidth={2.5} />
            <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">
              Redes ITLP
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-1">
            7mo Año - Viaje del Paquete
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => addNode("pc")}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-black text-white shadow-lg shadow-blue-200 active:scale-95 transition-all uppercase tracking-widest"
          >
            <Plus size={16} strokeWidth={3} /> PC
          </button>
          <button
            onClick={() => addNode("router")}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-xs font-black text-white shadow-lg shadow-purple-200 active:scale-95 transition-all uppercase tracking-widest"
          >
            <Plus size={16} strokeWidth={3} /> Router
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Left */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col gap-8 overflow-y-auto z-20 shrink-0 p-6">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-5 px-2">
              Herramientas
            </h2>
            <div className="flex flex-col gap-2">
              {[
                {
                  id: "select",
                  label: "Mover / Editar",
                  icon: MousePointer2,
                  color: "text-blue-600",
                  bg: "bg-blue-50/50 border-blue-100",
                },
                {
                  id: "link",
                  label: "Añadir Cable",
                  icon: Share2,
                  color: "text-slate-400",
                  bg: "border-transparent",
                },
                {
                  id: "delete-link",
                  label: "Cortar Cable",
                  icon: Scissors,
                  color: "text-slate-400",
                  bg: "border-transparent",
                },
                {
                  id: "simulate",
                  label: "Simular Paquete",
                  icon: Play,
                  color: "text-slate-400",
                  bg: "border-transparent",
                },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => {
                    setMode(btn.id);
                    setSelectedNode(null);
                    setSimSource(null);
                  }}
                  className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all border-2 ${mode === btn.id ? "bg-white border-blue-600 shadow-xl shadow-blue-100 font-black" : "hover:bg-slate-50 border-transparent"}`}
                >
                  <btn.icon
                    size={20}
                    className={mode === btn.id ? "text-blue-600" : "text-slate-400"}
                    strokeWidth={mode === btn.id ? 3 : 2}
                  />
                  <span
                    className={`text-sm tracking-tight ${mode === btn.id ? "text-slate-900" : "text-slate-500 font-bold"}`}
                  >
                    {btn.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-5 px-2">
              Laboratorio
            </h2>
            <button
              onClick={() => {
                setShowEncapModal(true);
                setEncapActiveStep(0);
              }}
              className="flex items-center gap-4 w-full p-4 rounded-2xl transition-all border-2 bg-blue-50/50 border-blue-100 hover:border-blue-200 group shadow-sm text-left"
            >
              <Box
                size={20}
                className="text-blue-600 group-hover:scale-110 transition-transform shrink-0"
                strokeWidth={3}
              />
              <span className="text-sm font-black text-slate-800 tracking-tight">
                Inspección PDUs
              </span>
            </button>
            <button
              onClick={() => {
                setShowOsiModal(true);
                setActiveOsiLayer(7);
              }}
              className="flex items-center gap-4 w-full p-4 rounded-2xl transition-all border-2 bg-indigo-50/50 border-indigo-100 hover:border-indigo-200 group shadow-sm text-left"
            >
              <Layers
                size={20}
                className="text-indigo-600 group-hover:scale-110 transition-transform shrink-0"
                strokeWidth={3}
              />
              <span className="text-sm font-black text-slate-800 tracking-tight">
                Modelo OSI
              </span>
            </button>
          </div>

          {selectedNode && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] animate-in slide-in-from-left-4 duration-300 shadow-lg">
              <div className="flex justify-between items-center mb-6 text-blue-600">
                <h3 className="font-black text-xs uppercase tracking-widest">
                  Propiedades
                </h3>
                <button
                  onClick={() => deleteNode(selectedNode.id)}
                  className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">
                    Nombre del Equipo
                  </label>
                  <input
                    type="text"
                    value={selectedNode.name}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, "name", e.target.value)
                    }
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">
                    Dirección Física (MAC)
                  </label>
                  <div className="text-xs font-mono p-3 bg-white rounded-xl border-2 border-slate-100 text-slate-400 font-black">
                    {selectedNode.mac}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto">
            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
              <div className="absolute -top-4 -right-4 opacity-[0.03] rotate-12">
                <Lightbulb size={120} className="text-blue-600" />
              </div>
              <div className="text-[10px] text-blue-600 flex items-center gap-2 mb-4 font-black uppercase tracking-[0.2em]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                Concepto Clave
              </div>
              <div className="space-y-3 relative z-10">
                <div className="text-[13px] text-slate-800 font-black leading-tight">
                  "Toca los equipos para seleccionarlos o arrastrarlos."
                </div>
                <div className="text-[11px] text-slate-400 font-bold italic border-l-2 border-blue-100 pl-4">
                  Arrastra el fondo para navegar.
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main
            className="flex-1 relative overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing"
            onMouseDown={handleCanvasMouseDown}
          >
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#000 2px, transparent 0)`,
                backgroundSize: "32px 32px",
              }}
            />

            {errorMessage && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
                <div className="bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-xs border-2 border-white/20">
                  <AlertCircle size={20} />
                  {errorMessage}
                </div>
              </div>
            )}

            {mode === "simulate" && !simStep && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="bg-green-600 text-white px-6 py-3 rounded-full text-xs font-black shadow-xl flex items-center gap-3 border-2 border-white/20 animate-pulse">
                  <Play size={18} fill="currentColor" />{" "}
                  {!simSource
                    ? "ELEGÍ EL EQUIPO DE ORIGEN"
                    : "AHORA ELEGÍ EL DESTINO"}
                </div>
              </div>
            )}

            <svg
              ref={canvasRef}
              className="w-full h-full"
              onClick={() => {
                if (!draggingNode && !isPanning) setSelectedNode(null);
              }}
            >
              <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
                {links.map((link) => {
                  const s = nodes.find((n) => n.id === link.source);
                  const t = nodes.find((n) => n.id === link.target);
                  if (!s || !t) return null;

                  const { sIP, tIP, subnet } = getLinkIPs(link, nodes);
                  const midX = (s.x + t.x) / 2;
                  const midY = (s.y + t.y) / 2;

                  const p1x = s.x + (t.x - s.x) * 0.25;
                  const p1y = s.y + (t.y - s.y) * 0.25;
                  const p2x = t.x + (s.x - t.x) * 0.25;
                  const p2y = t.y + (s.y - t.y) * 0.25;

                  return (
                    <g key={link.id}>
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke="#cbd5e1"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="pointer-events-none"
                      />
                      {subnet && (
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x="-45"
                            y="-9"
                            width="90"
                            height="18"
                            rx="5"
                            fill="white"
                            stroke="#e2e8f0"
                            strokeWidth="1.5"
                            className="shadow-sm"
                          />
                          <text
                            textAnchor="middle"
                            y="3.5"
                            fontSize="8.5"
                            fontWeight="900"
                            fill="#64748b"
                            className="uppercase tracking-tight"
                          >
                            {subnet}
                          </text>
                        </g>
                      )}
                      <g transform={`translate(${p1x}, ${p1y})`}>
                        <rect
                          x="-38"
                          y="-8.5"
                          width="76"
                          height="17"
                          rx="4"
                          fill="#eff6ff"
                          stroke="#bfdbfe"
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          y="3"
                          fontSize="9"
                          fontWeight="900"
                          fill="#2563eb"
                          fontFamily="monospace"
                        >
                          {sIP}
                        </text>
                      </g>
                      <g transform={`translate(${p2x}, ${p2y})`}>
                        <rect
                          x="-38"
                          y="-8.5"
                          width="76"
                          height="17"
                          rx="4"
                          fill="#eff6ff"
                          stroke="#bfdbfe"
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          y="3"
                          fontSize="9"
                          fontWeight="900"
                          fill="#2563eb"
                          fontFamily="monospace"
                        >
                          {tIP}
                        </text>
                      </g>
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke="transparent"
                        strokeWidth="25"
                        className={`cursor-pointer transition-all ${mode === "delete-link" ? "hover:stroke-red-500/10" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (mode === "delete-link")
                            deleteLink(link.source, link.target);
                        }}
                      />
                    </g>
                  );
                })}

                {nodes.map((node) => (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => handleNodeEvent(e, node)}
                    className="cursor-pointer group"
                  >
                    {(selectedNode?.id === node.id ||
                      simSource?.id === node.id) && (
                      <circle
                        r="52"
                        fill="none"
                        stroke={
                          selectedNode?.id === node.id ? "#2563eb" : "#16a34a"
                        }
                        strokeWidth="3"
                        strokeDasharray="6 6"
                        className="animate-[spin_20s_linear_infinite] opacity-30"
                      />
                    )}
                    <circle
                      r="42"
                      fill={node.type === "pc" ? "#2563eb" : "#9333ea"}
                      className="shadow-2xl transition-all duration-300 group-hover:scale-105"
                    />
                    <foreignObject x="-22" y="-22" width="44" height="44">
                      <div className="flex items-center justify-center h-full text-white pointer-events-none">
                        {node.type === "pc" ? (
                          <Monitor size={28} strokeWidth={2.5} />
                        ) : (
                          <Router size={28} strokeWidth={2.5} />
                        )}
                      </div>
                    </foreignObject>
                    <g transform="translate(0, 60)">
                      <text
                        textAnchor="middle"
                        fill="#0f172a"
                        className="text-[15px] font-black uppercase tracking-tight"
                      >
                        {node.name}
                      </text>
                      <text
                        y="18"
                        textAnchor="middle"
                        fill="#94a3b8"
                        className="text-[11px] font-mono font-black uppercase"
                      >
                        {node.mac}
                      </text>
                    </g>
                  </g>
                ))}

                {simStep && (
                  <g
                    className="transition-all duration-700 ease-in-out"
                    transform={`translate(${simStep.path[simStep.index].x}, ${simStep.path[simStep.index].y})`}
                  >
                    <circle
                      r="22"
                      fill="#16a34a"
                      opacity="0.3"
                      className="animate-ping"
                    />
                    <circle
                      r="14"
                      fill="#16a34a"
                      className="shadow-2xl border-2 border-white"
                    />
                    <path
                      d="M-6 -4 L6 0 L-6 4 Z"
                      fill="white"
                      transform="translate(2,0)"
                    />
                  </g>
                )}
              </g>
            </svg>
          </main>

          {simStep && (
            <section className="h-60 bg-white border-t-4 border-green-500 shadow-2xl z-40 flex flex-col animate-in slide-in-from-bottom duration-500 shrink-0">
              <div className="flex items-center justify-between px-8 py-2 border-b border-slate-100 bg-green-50/20">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse"></div>
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">
                      Analizador
                    </span>
                  </div>
                  <div className="h-4 w-px bg-slate-200"></div>
                  <p className="text-slate-900 font-black text-sm uppercase tracking-tight">
                    Salto {simStep.index + 1} de {simStep.path.length} •{" "}
                    <span className="text-blue-600">
                      {simStep.path[simStep.index].name}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setSimStep(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-between px-8 gap-8 overflow-hidden">
                <div className="flex-1 grid grid-cols-2 gap-6 py-2">
                  <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100 relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 bg-purple-600 text-white rounded-md">
                        <Network size={12} />
                      </div>
                      <h6 className="text-[9px] font-black uppercase text-purple-600 tracking-widest">
                        CAPA 3 (IP)
                      </h6>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase block">
                          Origen
                        </span>
                        <span className="text-[12px] font-mono font-black text-purple-900 truncate">
                          {
                            getLinkIPs(
                              links.find(
                                (l) =>
                                  l.source === simStep.path[0].id ||
                                  l.target === simStep.path[0].id,
                              ),
                              nodes,
                            ).sIP
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase block">
                          Destino
                        </span>
                        <span className="text-[12px] font-mono font-black text-purple-900 truncate">
                          {
                            getLinkIPs(
                              links.find(
                                (l) =>
                                  l.source ===
                                    simStep.path[simStep.path.length - 1].id ||
                                  l.target ===
                                    simStep.path[simStep.path.length - 1].id,
                              ),
                              nodes,
                            ).tIP
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-teal-50/50 p-3 rounded-2xl border border-teal-100 relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 bg-teal-600 text-white rounded-md">
                        <Layers size={12} />
                      </div>
                      <h6 className="text-[9px] font-black uppercase text-teal-600 tracking-widest">
                        CAPA 2 (MAC)
                      </h6>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase block">
                          SRC MAC
                        </span>
                        <span className="text-[11px] font-mono font-black text-teal-900 truncate">
                          {simStep.path[simStep.index].mac.slice(-8)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase block">
                          DST MAC
                        </span>
                        <span className="text-[11px] font-mono font-black text-teal-900 truncate">
                          {simStep.index < simStep.path.length - 1
                            ? simStep.path[simStep.index + 1].mac.slice(-8)
                            : "00:00:00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-[280px] flex flex-col gap-3 py-2 border-l border-slate-100 pl-8 shrink-0">
                  <div className="italic text-[11px] font-bold text-slate-600 leading-snug bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {simStep.index < simStep.path.length - 1
                      ? "El Router busca la MAC del próximo vecino conectado físicamente."
                      : "¡Paquete Recibido! La IP coincide con la interfaz local."}
                  </div>
                  <button
                    onClick={nextStep}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-[11px]"
                  >
                    {simStep.index < simStep.path.length - 1
                      ? "Siguiente Salto"
                      : "Finalizar"}
                    <ArrowRight size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Footer Unificado */}
      <footer className="shrink-0 bg-white border-t border-slate-200 px-8 py-3 flex items-center justify-between z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <div className="text-[10px] text-slate-400 uppercase tracking-[0.25em] font-black">
          Instalación, Mantenimiento y Reparación de Redes Informáticas • ITLP •
          2026
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-black tracking-[0.2em]">
          HECHO CON{" "}
          <Heart
            size={14}
            className="text-red-500 fill-red-500 animate-pulse mx-1"
          />{" "}
          POR MANUEL TAURO
        </div>
      </footer>


      {/* Modales de Laboratorio */}
      {showEncapModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]">
            <button
              onClick={() => setShowEncapModal(false)}
              className="absolute top-8 right-8 p-3 rounded-full hover:bg-slate-100 text-slate-400 transition-all z-10"
            >
              <X size={32} />
            </button>
            <div className="p-12 flex-1 overflow-y-auto">
              <h2 className="text-4xl font-black text-blue-600 uppercase tracking-tighter flex items-center gap-5 border-b border-slate-100 pb-8 mb-10">
                <Box size={42} strokeWidth={3} /> Inspección de PDUs
              </h2>
              <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50/80 rounded-[4rem] p-12 border border-slate-200 shadow-inner mb-10 overflow-hidden">
                <div className="w-full flex items-stretch justify-center">
                  <div
                    className={`flex transition-all duration-700 ease-out transform ${encapActiveStep >= 2 ? "translate-x-0 opacity-100" : "-translate-x-32 opacity-0 pointer-events-none"}`}
                  >
                    <div className="bg-teal-600 text-white p-6 rounded-l-[2rem] flex flex-col items-center justify-center border-r-2 border-teal-700 shadow-xl w-48 shrink-0">
                      <span className="text-[10px] font-black tracking-widest opacity-80 mb-2 uppercase">
                        Header L2
                      </span>
                      <span className="text-[14px] font-black uppercase">
                        ENLACE (MAC)
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex transition-all duration-700 delay-100 ease-out transform ${encapActiveStep >= 1 ? "translate-x-0 opacity-100" : "-translate-x-16 opacity-0 pointer-events-none"}`}
                  >
                    <div
                      className={`bg-purple-600 text-white p-6 flex flex-col items-center justify-center border-r-2 border-purple-700 shadow-lg w-44 shrink-0 ${encapActiveStep < 2 ? "rounded-l-[1rem]" : ""}`}
                    >
                      <span className="text-[10px] font-black tracking-widest opacity-80 mb-2 uppercase">
                        Header L3
                      </span>
                      <span className="text-[14px] font-black uppercase text-center">
                        RED (IP)
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex-1 min-w-[250px] max-w-[450px] bg-slate-400 text-white p-8 rounded-r-[2rem] flex flex-col items-center justify-center gap-4 transition-all duration-500 shadow-inner ${encapActiveStep === 0 ? "rounded-l-[2rem] shadow-2xl" : ""}`}
                  >
                    <Box size={36} className="opacity-40 animate-pulse" />
                    <div className="flex flex-col items-center text-center">
                      <span className="text-[11px] font-black uppercase tracking-widest opacity-80">
                        Payload Agrupado
                      </span>
                      <span className="text-[15px] font-black mt-1 uppercase tracking-tight text-slate-100">
                        DATOS Y TRANSPORTE
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex transition-all duration-700 delay-300 ease-out transform ${encapActiveStep >= 2 ? "translate-x-0 opacity-100 scale-x-100" : "translate-x-8 opacity-0 scale-x-0 pointer-events-none"}`}
                  >
                    <div className="bg-teal-700 text-teal-100 p-6 rounded-r-[2rem] flex flex-col items-center justify-center border-l-2 border-teal-800 shadow-2xl w-24 shrink-0 -ml-[2rem] z-10">
                      <ShieldCheck size={20} className="mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        FCS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-16">
              <button
                onClick={() =>
                  setEncapActiveStep(Math.max(0, encapActiveStep - 1))
                }
                className={`px-8 py-4 text-sm font-black uppercase tracking-widest ${encapActiveStep === 0 ? "text-slate-300" : "text-slate-500 hover:text-slate-900"}`}
              >
                Anterior
              </button>
              <button
                onClick={() => {
                  if (encapActiveStep < 2)
                    setEncapActiveStep(encapActiveStep + 1);
                  else setShowEncapModal(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all active:scale-95"
              >
                {encapActiveStep < 2 ? "Siguiente" : "Finalizar"}{" "}
                <ArrowRight size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showOsiModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden relative flex flex-col max-h-[95vh]">
            <button
              onClick={() => setShowOsiModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X size={24} />
            </button>
            <div className="p-10 flex-1 overflow-y-auto">
              <h2 className="text-2xl font-black text-indigo-600 uppercase tracking-tighter flex items-center gap-3 mb-8">
                <Layers size={28} strokeWidth={3} /> Visualizador Modelo OSI
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-2">
                  {osiLayers
                    .slice()
                    .reverse()
                    .map((layer) => (
                      <button
                        key={layer.num}
                        onClick={() => setActiveOsiLayer(layer.num)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${activeOsiLayer === layer.num ? "border-indigo-600 shadow-lg scale-105 bg-indigo-50 font-bold" : "border-transparent bg-slate-50 opacity-60 hover:opacity-100"}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${activeOsiLayer === layer.num ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"}`}
                        >
                          {layer.num}
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                            CAPA {layer.num}
                          </div>
                          <div className="text-sm font-black text-slate-800 uppercase">
                            {layer.name}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
                <div className="lg:col-span-7">
                  {osiLayers.find((l) => l.num === activeOsiLayer) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 h-full flex flex-col shadow-inner">
                      <div className="flex items-center gap-6 mb-8">
                        <div
                          className={`p-6 rounded-3xl ${osiLayers.find((l) => l.num === activeOsiLayer).bg} ${osiLayers.find((l) => l.num === activeOsiLayer).color} shadow-lg`}
                        >
                          {React.createElement(
                            osiLayers.find((l) => l.num === activeOsiLayer)
                              .icon,
                            { size: 48, strokeWidth: 2.5 },
                          )}
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                            Capa {activeOsiLayer}
                          </h3>
                          <p
                            className={`text-xl font-black ${osiLayers.find((l) => l.num === activeOsiLayer).color} uppercase`}
                          >
                            {
                              osiLayers.find((l) => l.num === activeOsiLayer)
                                .name
                            }
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">
                          Función
                        </h4>
                        <p className="text-slate-700 font-bold leading-relaxed">
                          {osiLayers.find((l) => l.num === activeOsiLayer).desc}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
