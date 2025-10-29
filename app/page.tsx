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
  const [mostrarMenu, setMostrarMenu] = useState<boolean>(false);

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
  // Detectar el próximo día con evento (igual o después de hoy)
  const hoy = new Date();

  // Función robusta que interpreta fechas "D/M", "D/M/YY" o "YYYY-MM-DD"
  const parseFecha = (fechaStr: string): Date => {
    // Si es formato D/M[/YYYY]
    if (fechaStr.includes("/")) {
      const partes = fechaStr.split("/").map(Number);
      const [dia, mes, year] = partes;
      const currentYear = new Date().getFullYear();
      const finalYear = year || currentYear;

      // Creamos una fecha clara con formato ISO
      const posibleFecha = new Date(finalYear, mes - 1, dia);

      // Si la fecha ya pasó este año → usamos el siguiente
      if (posibleFecha < new Date()) {
        posibleFecha.setFullYear(finalYear + 1);
      }

      // Convertimos a YYYY-MM-DD y la devolvemos como objeto Date
      const iso = posibleFecha.toISOString().split("T")[0];
      return new Date(iso);
    }

    // Si ya viene en formato ISO
    return new Date(fechaStr);
  };

  // Ordenar cronológicamente los turnos normalizados
  const turnosOrdenados = [...turnosNormalizados].sort(
    (a, b) => parseFecha(a.fecha).getTime() - parseFecha(b.fecha).getTime()
  );

  // Encontrar el día más cercano a la fecha actual (pasado o futuro)
  // (la selección inicial se hará tras cargar datos, ver useEffect más abajo)
  const diaMasCercano =
    turnosOrdenados
      .map((d) => ({ ...d, fechaDate: parseFecha(d.fecha) }))
      .sort(
        (a, b) =>
          Math.abs(a.fechaDate.getTime() - hoy.getTime()) -
          Math.abs(b.fechaDate.getTime() - hoy.getTime())
      )[0]?.fecha || turnosOrdenados[0]?.fecha;

  const [diaSeleccionado, setDiaSeleccionado] = useState<string>("");
  const [spacerWidth, setSpacerWidth] = useState<number>(0);
  useEffect(() => {
    const updateSpacer = () => {
      const cont = contenedorRef.current;
      if (!cont) return;
      // Tomamos el primer botón como referencia para el ancho
      const sampleBtn = cont.querySelector("button") as HTMLButtonElement | null;
      const btnWidth = sampleBtn ? sampleBtn.offsetWidth : 70; // fallback
      const width = Math.max(0, cont.offsetWidth / 2 - btnWidth / 2);
      setSpacerWidth(width);
    };

    updateSpacer();
    window.addEventListener("resize", updateSpacer);
    return () => window.removeEventListener("resize", updateSpacer);
  }, []);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const diaRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const diasConTurnos = [...turnosNormalizados]
    .filter((d) => {
      if (!selectedPerson) return true; // Mostrar todos si no hay filtro
      return d.turnos.some((turno) => {
        if (Array.isArray(turno.personas)) {
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
    })
    .sort((a, b) => parseFecha(a.fecha).getTime() - parseFecha(b.fecha).getTime())
    .map((d) => {
      const fechaObj = parseFecha(d.fecha);
      return {
        fecha: d.fecha,
        numero: fechaObj.getDate().toString().padStart(2, "0"),
        nombreDia: fechaObj.toLocaleString("es-ES", { weekday: "short" }),
      };
    });

  const turnosDia = turnosNormalizados.find((d) => d.fecha === diaSeleccionado);
  const turnosFiltrados = turnosDia ? filtrarTurnos(turnosDia) : [];


  // Seleccionar automáticamente el día más cercano a hoy solo una vez tras cargar los datos
  useEffect(() => {
    if (turnosOrdenados.length > 0 && !diaSeleccionado) {
      const hoyLocal = new Date();
      const closest = turnosOrdenados
        .map((d) => ({ fecha: d.fecha, fechaDate: parseFecha(d.fecha) }))
        .sort(
          (a, b) =>
            Math.abs(a.fechaDate.getTime() - hoyLocal.getTime()) -
            Math.abs(b.fechaDate.getTime() - hoyLocal.getTime())
        )[0]?.fecha;
      if (closest) {
        setDiaSeleccionado(closest);
      }
    }
    // Ejecutar solo una vez al cargar los datos iniciales
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnosOrdenados]);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    const boton = diaRefs.current[diaSeleccionado];
    if (contenedor && boton) {
      const offsetLeft = boton.offsetLeft;
      const botonWidth = boton.offsetWidth;
      const contenedorWidth = contenedor.offsetWidth;
      const scrollMax = contenedor.scrollWidth - contenedorWidth;

      // Calcula el desplazamiento ideal centrado
      let scrollTo = offsetLeft - contenedorWidth / 2 + botonWidth / 2;

      // Asegura que incluso los primeros o últimos se centren visualmente
      if (scrollTo < 0) scrollTo = 0;
      if (scrollTo > scrollMax) scrollTo = scrollMax;

      contenedor.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  }, [diaSeleccionado]);

  if (!turnos) return null;

  // Función para exportar los turnos a un Excel, con una hoja por mes
  const handleDescargarExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      interface Turno {
        fecha: string;
        horaInicio: string;
        horaFin: string;
        actividad: string;
        personas: string[] | Record<string, string[]>;
        turnos?: Turno[];
      }

      interface TurnoPlano {
        Fecha: string;
        "Hora inicio": string;
        "Hora fin": string;
        Actividad: string;
        Personas: string;
      }

      // Obtener los turnos normalizados
      const turnosNormalizados = normalizarTurnos(turnos);

      // Función auxiliar para obtener nombre del mes
      const obtenerMes = (fecha: string): string => {
        const date = new Date(fecha.includes("/") ? fecha.split("/").reverse().join("-") : fecha);
        return date.toLocaleString("es-ES", { month: "long", year: "numeric" });
      };

      // Agrupar turnos por mes
      const turnosPorMes: Record<string, TurnoPlano[]> = {};

      turnosNormalizados.forEach((dia) => {
        const mes = obtenerMes(dia.fecha);
        if (!turnosPorMes[mes]) turnosPorMes[mes] = [];

        dia.turnos.forEach((turno) => {
          let personasTexto = "";
          if (Array.isArray(turno.personas)) {
            personasTexto = turno.personas.join(", ");
          } else if (typeof turno.personas === "object" && turno.personas !== null) {
            personasTexto = Object.entries(turno.personas)
              .map(([clave, lista]) => `${clave}: ${(lista || []).join(", ")}`)
              .join(" | ");
          }

          turnosPorMes[mes].push({
            Fecha: dia.fecha,
            "Hora inicio": turno.horaInicio,
            "Hora fin": turno.horaFin,
            Actividad: turno.actividad,
            Personas: personasTexto,
          });
        });
      });

      // Crear libro con una hoja por mes
      const libro = XLSX.utils.book_new();

      Object.entries(turnosPorMes).forEach(([mes, datos]) => {
        const hoja = XLSX.utils.json_to_sheet(datos);
        const nombreHoja = mes.charAt(0).toUpperCase() + mes.slice(1);
        XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
      });

      // Descargar archivo Excel
      XLSX.writeFile(libro, "turnos_comision.xlsx");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      alert("❌ Error al generar el archivo Excel.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#333] flex flex-col font-sans">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 bg-[#F9F9FB] py-3">
        <div className="flex items-center justify-center relative">
          <button
            onClick={() => setMostrarMenu((prev) => !prev)}
            className="absolute left-4 text-[#7161EF] text-xl"
          >
            ☰
          </button>
          <h1 className="text-sm font-semibold bg-white text-[#333] px-4 py-1 rounded-full shadow-sm border border-[#E6E6EB] capitalize">
            {new Date(diaSeleccionado).toLocaleString("es-ES", { month: "long" })}
          </h1>
          <button
            onClick={() => setMostrarFiltro((prev) => !prev)}
            className="absolute right-4 text-[#7161EF] text-xl"
          >
            🔽
          </button>
        </div>
      </header>

      {/* Menú lateral */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${
          mostrarMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-[#E6E6EB]">
          <h2 className="text-[#7161EF] font-semibold text-lg">Menú</h2>
          <button
            onClick={() => setMostrarMenu(false)}
            className="text-[#7161EF] text-xl"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-3 text-[#333]">
          <Link
            href="/"
            onClick={() => setMostrarMenu(false)}
            className="hover:text-[#7161EF] transition"
          >
            🏠 Inicio
          </Link>
          <Link
            href="/add-turno"
            onClick={() => setMostrarMenu(false)}
            className="hover:text-[#7161EF] transition"
          >
            ➕ Añadir Turno
          </Link>
          <button
            onClick={() => {
              setMostrarFiltro(true);
              setMostrarMenu(false);
            }}
            className="text-left hover:text-[#7161EF] transition"
          >
            🔍 Filtrar Turnos
          </button>
          <button
            onClick={handleDescargarExcel}
            className="text-left hover:text-[#7161EF] transition"
          >
            📥 Descargar Excel
          </button>
        </nav>
      </div>

      {/* Fondo semitransparente cuando el menú está abierto */}
      {mostrarMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={() => setMostrarMenu(false)}
        />
      )}

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
        className="flex overflow-x-auto gap-3 px-8 py-4 no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div style={{ minWidth: spacerWidth }} aria-hidden="true" />
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
        <div style={{ minWidth: spacerWidth }} aria-hidden="true" />
      </div>

      {/* Lista de turnos del día */}
      <div className="px-6 pb-28 mt-6">
        {turnosFiltrados.length > 0 ? (
          <div className="flex flex-col gap-6">
            {Object.entries(
              turnosFiltrados.reduce((acc, turno) => {
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


      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
