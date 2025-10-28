"use client";
import { useEffect, useState } from "react";

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
  const [turnosPendientes, setTurnosPendientes] = useState<typeof formData[]>([]);

  useEffect(() => {
    fetch("/api/personas")
      .then((res) => res.json())
      .then((data) => setPersonasList(data))
      .catch((err) => console.error("Error al cargar personas:", err));
  }, []);

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
    let duracion = (hFin * 60 + mFin) - (hInicio * 60 + mInicio);
    if (duracion <= 0) duracion += 24 * 60; // si pasa medianoche

    // Nueva hora inicio = horaFin anterior
    const nuevaHoraInicio = formData.horaFin;

    // Calcular nueva hora fin según duración
    const sumarMinutos = (hora: string, minutos: number) => {
      const [h, m] = hora.split(":").map(Number);
      const totalMin = h * 60 + m + minutos;
      const nuevaH = Math.floor(totalMin / 60) % 24;
      const nuevaM = totalMin % 60;
      return { nuevaHora: `${nuevaH.toString().padStart(2, "0")}:${nuevaM.toString().padStart(2, "0")}`, pasaMedianoche: totalMin >= 24 * 60 };
    };

    const { nuevaHora, pasaMedianoche } = sumarMinutos(nuevaHoraInicio, duracion);

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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black text-black dark:text-white px-4 py-8">
      <form
        onSubmit={handleAddTurnoPendiente}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 space-y-5"
      >
        <h1 className="text-2xl font-bold text-center mb-4">Añadir Turno</h1>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium mb-2">Fecha</label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-3 text-base"
          />
        </div>

        {/* Hora inicio */}
        <div>
          <label className="block text-sm font-medium mb-2">Hora inicio</label>
          <input
            type="time"
            name="horaInicio"
            value={formData.horaInicio}
            onChange={handleChange}
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-3 text-base"
          />
        </div>

        {/* Hora fin */}
        <div>
          <label className="block text-sm font-medium mb-2">Hora fin</label>
          <input
            type="time"
            name="horaFin"
            value={formData.horaFin}
            onChange={handleChange}
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-3 text-base"
          />
        </div>

        {/* Actividad */}
        <div>
          <label className="block text-sm font-medium mb-2">Actividad</label>
          <select
            name="actividad"
            value={formData.actividad}
            onChange={handleChange}
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-3 text-base"
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
          <label className="block text-sm font-medium mb-2">Personas</label>
          <input
            type="text"
            placeholder="Buscar persona..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mb-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-base"
          />

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto rounded-md border border-zinc-300 dark:border-zinc-700 p-2 bg-zinc-50 dark:bg-zinc-800">
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
                      ? "bg-blue-600 text-white"
                      : yaAsignada
                      ? "bg-zinc-400 text-white cursor-not-allowed"
                      : "bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white"
                  }`}
                >
                  {persona}
                </button>
              );
            })}
          </div> 

          {formData.personas.length > 0 && (
            <p className="text-xs text-zinc-500 mt-1">
              Seleccionadas: {formData.personas.join(", ")}
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md py-3 text-lg transition"
          >
            Guardar turno (pendiente)
          </button>
          {turnosPendientes.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmarTurnos}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md py-3 text-lg transition"
            >
              Confirmar todos los turnos ({turnosPendientes.length})
            </button>
          )}
        </div>

        {/* Lista de turnos pendientes */}
        {turnosPendientes.length > 0 && (
          <div className="mt-6 border-t border-zinc-300 dark:border-zinc-700 pt-4">
            <h2 className="text-lg font-semibold mb-2">Turnos pendientes:</h2>
            <ul className="space-y-2 text-sm">
              {turnosPendientes.map((t, i) => (
                <li key={i} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md">
                  <div className="font-medium">{t.actividad}</div>
                  <div className="text-zinc-500 text-xs">
                    {t.fecha} | {t.horaInicio} – {t.horaFin}
                  </div>
                  <div className="text-zinc-600 text-xs">
                    {t.personas.join(", ")}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}