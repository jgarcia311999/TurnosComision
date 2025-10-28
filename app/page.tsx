"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Turno {
  personas:
    | string[]
    | {
        barra?: string[];
        puerta?: string[];
      };
  horaInicio: string;
  horaFin: string;
  actividad: string;
}

interface Dia {
  fecha: string;
  turnos: Turno[];
}

export default function Home() {
  const [turnos, setTurnos] = useState<Dia[]>([]);
  const [personas, setPersonas] = useState<string[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [abiertos, setAbiertos] = useState<string[]>([]);
  const [mostrarFiltro, setMostrarFiltro] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/turnos")
      .then((res) => res.json())
      .then((data) => setTurnos(data))
      .catch((err) => console.error("Error al cargar turnos:", err));

    fetch("/api/personas")
      .then((res) => res.json())
      .then((data) => setPersonas(data))
      .catch((err) => console.error("Error al cargar personas:", err));
  }, []);

  // Normalizar la estructura de los datos para aceptar ambos formatos
  const normalizarTurnos = (data: (Dia | (Omit<Turno, "turnos"> & { fecha: string }))[]): Dia[] => {
    const agrupados: Record<string, Turno[]> = {};

    data.forEach((item) => {
      if ("turnos" in item) {
        // Formato con lista de turnos
        agrupados[item.fecha] = item.turnos;
      } else {
        // Formato individual, convertir a turno dentro del mismo día
        if (!agrupados[item.fecha]) agrupados[item.fecha] = [];
        agrupados[item.fecha].push({
          horaInicio: item.horaInicio,
          horaFin: item.horaFin,
          actividad: item.actividad,
          personas: item.personas,
        });
      }
    });

    return Object.entries(agrupados).map(([fecha, turnos]) => ({
      fecha,
      turnos,
    }));
  };

  const toggleDia = (fecha: string) => {
    setAbiertos((prev) =>
      prev.includes(fecha) ? prev.filter((f) => f !== fecha) : [...prev, fecha]
    );
  };

  const filtrarTurnos = (dia: Dia) => {
    if (!selectedPerson) return dia.turnos;
    return dia.turnos.filter((turno) => {
      if (Array.isArray(turno.personas)) {
        // Incluir si la persona está en la lista o si el turno es de "Todos"
        return (
          turno.personas.includes(selectedPerson) ||
          turno.personas.includes("Todos")
        );
      } else {
        const { barra = [], puerta = [] } = turno.personas;
        return (
          barra.includes(selectedPerson) ||
          puerta.includes(selectedPerson) ||
          barra.includes("Todos") ||
          puerta.includes("Todos")
        );
      }
    });
  };

  const formatearFecha = (fecha: string) => {
    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre"
    ];

    const [year, month, day] = fecha.split("-");
    const mesNombre = meses[parseInt(month, 10) - 1] || "";
    return `${day} de ${mesNombre} del ${year}`;
  };

  const turnosNormalizados = turnos && Array.isArray(turnos)
    ? normalizarTurnos(turnos).sort((a, b) => a.fecha.localeCompare(b.fecha))
    : [];
  const primerDiaConTurnos = turnosNormalizados.length > 0 ? turnosNormalizados[0].fecha : new Date().toISOString().split("T")[0];
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(primerDiaConTurnos);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const diaRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const diasConTurnos = turnosNormalizados.map((d) => ({
    fecha: d.fecha,
    numero: d.fecha.split("-")[2],
    nombreDia: new Date(d.fecha).toLocaleString("es-ES", { weekday: "short" }),
  }));

  const turnosDia = turnosNormalizados.find((d) => d.fecha === diaSeleccionado)?.turnos || [];

  useEffect(() => {
    if (turnosNormalizados.length > 0) {
      const fechasDisponibles = diasConTurnos.map((d) => d.fecha);
      if (!fechasDisponibles.includes(diaSeleccionado)) {
        setDiaSeleccionado(turnosNormalizados[0].fecha);
      }
    }
    // Solo depende de turnosNormalizados (cambia al cargar datos) y del seleccionado actual
    // para evitar bucles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnosNormalizados]);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    const boton = diaRefs.current[diaSeleccionado];
    if (contenedor && boton) {
      const offsetLeft = boton.offsetLeft;
      const botonWidth = boton.offsetWidth;
      const contenedorWidth = contenedor.offsetWidth;
      const scrollTo = offsetLeft - contenedorWidth / 2 + botonWidth / 2;
      contenedor.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  }, [diaSeleccionado]);

  if (!turnos) return null;

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#333] flex flex-col font-sans">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 bg-[#F9F9FB] py-3 shadow-sm">
        <div className="flex items-center justify-center relative">
          <button className="absolute left-4 text-[#7161EF] text-xl">☰</button>
          <h1 className="text-sm font-semibold bg-white text-[#333] px-4 py-1 rounded-full shadow-sm border border-[#E6E6EB] capitalize">
            {new Date().toLocaleString("es-ES", { month: "long" })}
          </h1>
          <button
            onClick={() => setMostrarFiltro((prev) => !prev)}
            className="absolute right-4 text-[#7161EF] text-xl"
          >
            🔽
          </button>
        </div>
      </header>

      {mostrarFiltro && (
        <div className="px-5 pb-2 mt-3">
          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="w-full bg-white border border-[#E6E6EB] rounded-xl px-3 py-2 text-sm text-[#333] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7161EF]"
          >
            <option value="">Todos</option>
            {personas.map((persona) => (
              <option key={persona} value={persona}>
                {persona}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selector de días */}
      <div
        ref={contenedorRef}
        className="flex overflow-x-auto gap-3 px-4 py-4 no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {diasConTurnos.map((dia) => (
          <button
            key={dia.fecha}
            ref={(el) => { diaRefs.current[dia.fecha] = el; }}
            onClick={() => setDiaSeleccionado(dia.fecha)}
            className={`flex flex-col items-center justify-center min-w-[70px] rounded-xl px-3 py-2 transition-all duration-300 border
              ${
                dia.fecha === diaSeleccionado
                  ? "bg-[#7161EF] text-white border-[#7161EF] shadow-md"
                  : "bg-white text-[#333] border-[#E6E6EB] hover:border-[#7161EF]/50"
              }`}
          >
            <span className="text-xs opacity-70 capitalize">{dia.nombreDia}</span>
            <span className="text-lg font-semibold">{dia.numero}</span>
            <span className="text-[10px] opacity-60">{new Date(dia.fecha).toLocaleString("es-ES", { month: "short" })}</span>
          </button>
        ))}
      </div>

      {/* Lista de turnos del día */}
      <div className="px-6 pb-28 mt-6">
        {turnosDia.length > 0 ? (
          <div className="flex flex-col gap-6">
            {Object.entries(
              turnosDia.reduce((acc, turno) => {
                if (!acc[turno.actividad]) acc[turno.actividad] = [];
                acc[turno.actividad].push(turno);
                return acc;
              }, {} as Record<string, Turno[]>)
            ).map(([actividad, listaTurnos]) => (
              <div key={actividad}>
                <h2 className="text-[#7161EF] font-semibold text-lg mb-2 uppercase">
                  {actividad}
                </h2>
                <ul className="flex flex-col divide-y divide-[#E6E6EB]">
                  {listaTurnos.map((turno, i) => (
                    <li key={i} className="flex justify-between items-center py-2">
                      <div className="text-sm text-[#333]">
                        🕒 {turno.horaInicio} – {turno.horaFin || "Fin"}
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {Array.isArray(turno.personas) &&
                          turno.personas.map((p) => (
                            <span
                              key={p}
                              className="bg-[#EFEDFF] text-[#5B50CC] text-xs font-medium px-3 py-1 rounded-full shadow-sm"
                            >
                              {p}
                            </span>
                          ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[#AAA] mt-10">No hay turnos para este día</p>
        )}
      </div>

      {/* Botón flotante */}
      <Link
        href="/add-turno"
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#7161EF] text-white rounded-full p-5 shadow-lg text-3xl hover:bg-[#5B50CC] active:scale-95 transition-all duration-200"
      >
        +
      </Link>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
