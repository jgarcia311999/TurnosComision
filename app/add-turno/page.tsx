"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AddTurnoPage() {
  const [formData, setFormData] = useState({
    fecha: "",
    horaInicio: "",
    horaFin: "",
    actividad: "",
    personas: [] as string[],
  });

  const [personasList, setPersonasList] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [turnosPendientes, setTurnosPendientes] = useState<(typeof formData)[]>(
    []
  );
  const [mostrarMenu, setMostrarMenu] = useState(false);

  useEffect(() => {
    fetch("/api/personas")
      .then((res) => res.json())
      .then((data) => setPersonasList(data))
      .catch((err) => console.error("Error al cargar personas:", err));
  }, []);

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

      // Obtener turnos existentes
      const res = await fetch("/api/turnos");
      const turnosNormalizados: Turno[] = await res.json();

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

        (dia.turnos ?? [dia]).forEach((turno) => {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const togglePersona = (persona: string) => {
    setFormData((prev) => {
      const isSelected = prev.personas.includes(persona);
      const newList = isSelected
        ? prev.personas.filter((p) => p !== persona)
        : [...prev.personas, persona];
      return { ...prev, personas: newList };
    });
  };

  // Función auxiliar para sumar minutos a una hora
  const sumarMinutos = (hora: string, minutos: number) => {
    const [h, m] = hora.split(":").map(Number);
    const totalMin = h * 60 + m + minutos;
    const nuevaH = Math.floor(totalMin / 60) % 24;
    const nuevaM = totalMin % 60;
    return `${nuevaH.toString().padStart(2, "0")}:${nuevaM
      .toString()
      .padStart(2, "0")}`;
  };

  const handleAddTurnoPendiente = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.fecha ||
      !formData.horaInicio ||
      !formData.horaFin ||
      !formData.actividad ||
      formData.personas.length === 0
    ) {
      alert("Por favor, completa todos los campos antes de guardar el turno.");
      return;
    }

    // Guardar turno actual
    setTurnosPendientes((prev) => [...prev, formData]);

    // Calcular duración del turno actual en minutos
    const [hInicio, mInicio] = formData.horaInicio.split(":").map(Number);
    const [hFin, mFin] = formData.horaFin.split(":").map(Number);
    let duracion = hFin * 60 + mFin - (hInicio * 60 + mInicio);
    if (duracion <= 0) duracion += 24 * 60; // si pasa medianoche

    // Nueva hora inicio = horaFin anterior
    const nuevaHoraInicio = formData.horaFin;

    // Calcular nueva hora fin según duración
    const sumarMinutos = (hora: string, minutos: number) => {
      const [h, m] = hora.split(":").map(Number);
      const totalMin = h * 60 + m + minutos;
      const nuevaH = Math.floor(totalMin / 60) % 24;
      const nuevaM = totalMin % 60;
      return {
        nuevaHora: `${nuevaH.toString().padStart(2, "0")}:${nuevaM
          .toString()
          .padStart(2, "0")}`,
        pasaMedianoche: totalMin >= 24 * 60,
      };
    };

    const { nuevaHora, pasaMedianoche } = sumarMinutos(
      nuevaHoraInicio,
      duracion
    );

    // Calcular nueva fecha (si pasa de medianoche)
    const nuevaFecha = (() => {
      if (!pasaMedianoche) return formData.fecha;
      const fechaActual = new Date(formData.fecha);
      fechaActual.setDate(fechaActual.getDate() + 1);
      return fechaActual.toISOString().split("T")[0];
    })();

    // Limpiar solo personas, mantener nueva hora y fecha
    setFormData((prev) => ({
      ...prev,
      fecha: nuevaFecha,
      horaInicio: nuevaHoraInicio,
      horaFin: nuevaHora,
      personas: [],
    }));

    setSearch("");
    alert("Turno añadido a pendientes.");
  };

  const handleConfirmarTurnos = async () => {
    if (turnosPendientes.length === 0) {
      alert("No hay turnos pendientes por guardar.");
      return;
    }

    try {
      const res = await fetch("/api/guardar-turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newTurnos: turnosPendientes }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar los turnos");
      }

      alert(`✅ ${data.message}`);
      setTurnosPendientes([]);
    } catch (err) {
      console.error("Error al confirmar turnos:", err);
      alert("❌ Ocurrió un error al guardar los turnos en GitHub.");
    }
  };

  const personasFiltradas = personasList.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#333] flex flex-col font-sans">
      {/* Header con menú */}
      <header className="sticky top-0 z-30 bg-[#F9F9FB] py-3">
        <div className="flex items-center justify-center relative">
          <button
            onClick={() => setMostrarMenu((prev) => !prev)}
            className="absolute left-4 text-[#7161EF] text-xl"
          >
            ☰
          </button>
          <h1 className="text-sm font-semibold bg-white text-[#333] px-4 py-1 rounded-full shadow-sm border border-[#E6E6EB]">
            Añadir Turno
          </h1>
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
            onClick={handleDescargarExcel}
            className="text-left hover:text-[#7161EF] transition"
          >
            📥 Descargar Excel
          </button>
        </nav>
      </div>

      {/* Fondo oscuro al abrir menú */}
      {mostrarMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={() => setMostrarMenu(false)}
        />
      )}

      {/* Formulario */}
      <main className="flex-1 px-6 pb-10 mt-6">
        <form
          onSubmit={handleAddTurnoPendiente}
          className="bg-white border border-[#E6E6EB] rounded-2xl shadow-sm p-6 flex flex-col gap-5"
        >
          {/* Fecha */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#7161EF]">
              Fecha
            </label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="w-full bg-[#F9F9FB] border border-[#E6E6EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7161EF]"
            />
          </div>

          {/* Hora inicio */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#7161EF]">
              Hora inicio
            </label>
            <input
              type="time"
              name="horaInicio"
              value={formData.horaInicio}
              onChange={handleChange}
              className="w-full bg-[#F9F9FB] border border-[#E6E6EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7161EF]"
            />
          </div>

          {/* Hora fin */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#7161EF]">
              Hora fin
            </label>
            <input
              type="time"
              name="horaFin"
              value={formData.horaFin}
              onChange={handleChange}
              className="w-full bg-[#F9F9FB] border border-[#E6E6EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7161EF]"
            />
          </div>

          {/* Actividad */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#7161EF]">
              Actividad
            </label>
            <select
              name="actividad"
              value={formData.actividad}
              onChange={handleChange}
              className="w-full bg-[#F9F9FB] border border-[#E6E6EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7161EF]"
            >
              <option value="">Seleccionar actividad</option>
              <option value="Barra">Barra</option>
              <option value="Puerta">Puerta</option>
              <option value="Cierre">Cierre</option>
              <option value="Supervisión">Supervisión</option>
            </select>
          </div>

          {/* Personas */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#7161EF]">
              Personas
            </label>
            <input
              type="text"
              placeholder="Buscar persona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mb-2 bg-[#F9F9FB] border border-[#E6E6EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7161EF]"
            />

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto rounded-md border border-[#E6E6EB] p-2 bg-[#F9F9FB]">
              {personasFiltradas.map((persona) => {
                const selected = formData.personas.includes(persona);
                const yaAsignada = turnosPendientes.some((t) =>
                  t.personas.includes(persona)
                );
                return (
                  <button
                    type="button"
                    key={persona}
                    onClick={() => togglePersona(persona)}
                    disabled={yaAsignada}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      selected
                        ? "bg-[#7161EF] text-white"
                        : yaAsignada
                        ? "bg-zinc-400 text-white cursor-not-allowed"
                        : "bg-white text-[#333] border border-[#E6E6EB]"
                    }`}
                  >
                    {persona}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones */}
          <div className="space-y-3 mt-2">
            <button
              type="submit"
              className="w-full bg-[#7161EF] hover:bg-[#5B50CC] text-white font-semibold rounded-lg py-3 text-lg transition"
            >
              Guardar turno (pendiente)
            </button>
            {turnosPendientes.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmarTurnos}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg py-3 text-lg transition"
              >
                Confirmar todos los turnos ({turnosPendientes.length})
              </button>
            )}
          </div>

          {/* Lista de turnos pendientes */}
          {turnosPendientes.length > 0 && (
            <div className="mt-6 border-t border-[#E6E6EB] pt-4">
              <h2 className="text-lg font-semibold mb-2 text-[#7161EF]">
                Turnos pendientes:
              </h2>
              <ul className="space-y-2 text-sm">
                {turnosPendientes.map((t, i) => (
                  <li
                    key={i}
                    className="bg-[#F9F9FB] border border-[#E6E6EB] p-3 rounded-lg"
                  >
                    <div className="font-medium text-[#333]">{t.actividad}</div>
                    <div className="text-[#777] text-xs">
                      {t.fecha} | {t.horaInicio} – {t.horaFin}
                    </div>
                    <div className="text-[#555] text-xs mt-1">
                      {t.personas.join(", ")}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
