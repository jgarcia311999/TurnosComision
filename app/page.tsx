"use client";

import { useEffect, useState } from "react";
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
        return turno.personas.includes(selectedPerson);
      } else {
        const { barra = [], puerta = [] } = turno.personas;
        return barra.includes(selectedPerson) || puerta.includes(selectedPerson);
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white flex flex-col items-center py-10 px-6">
      <h1 className="text-3xl font-bold mb-6">Gestor de Turnos</h1>

      {/* Filtro de persona */}
      <div className="mb-8 w-full max-w-xs">
        <label htmlFor="persona" className="block text-sm font-medium mb-2">
          Filtrar por persona:
        </label>
        <select
          id="persona"
          value={selectedPerson}
          onChange={(e) => setSelectedPerson(e.target.value)}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white px-3 py-2"
        >
          <option value="">Todos</option>
          {personas.map((persona) => (
            <option key={persona} value={persona}>
              {persona}
            </option>
          ))}
        </select>
        <Link
          href="/add-turno"
          className="mt-4 inline-block rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition"
        >
          Añadir turno
        </Link>
      </div>

      <div className="w-full max-w-2xl">
        {normalizarTurnos(turnos).map((dia) => {
          const isOpen = abiertos.includes(dia.fecha);
          const turnosFiltrados = filtrarTurnos(dia) || [];
          if (turnosFiltrados.length === 0) return null;

          return (
            <div
              key={dia.fecha}
              className="mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden"
            >
              <button
                onClick={() => toggleDia(dia.fecha)}
                className="w-full flex justify-between items-center px-4 py-3 text-left font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <span>{formatearFecha(dia.fecha)}</span>
                <span
                  className={`transform transition-transform ${
                    isOpen ? "rotate-90" : ""
                  }`}
                >
                  ▶
                </span>
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isOpen ? "max-h-screen" : "max-h-0"
                }`}
              >
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {turnosFiltrados.map((turno, index) => (
                    <li key={index} className="p-4">
                      <div className="text-sm text-zinc-500">
                        {turno.horaInicio} – {turno.horaFin || "Fin"}
                      </div>
                      <div className="font-medium">{turno.actividad}</div>

                      {Array.isArray(turno.personas) ? (
                        <div className="text-zinc-600 dark:text-zinc-400">
                          {turno.personas.join(", ")}
                        </div>
                      ) : (
                        <div className="mt-1">
                          {turno.personas.barra && (
                            <div className="text-zinc-600 dark:text-zinc-400">
                              <span className="font-semibold">Barra:</span>{" "}
                              {turno.personas.barra.join(", ")}
                            </div>
                          )}
                          {turno.personas.puerta && (
                            <div className="text-zinc-600 dark:text-zinc-400">
                              <span className="font-semibold">Puerta:</span>{" "}
                              {turno.personas.puerta.length
                                ? turno.personas.puerta.join(", ")
                                : "—"}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
