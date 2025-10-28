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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Datos del turno:", formData);
    alert("Turno listo para enviar (todavía no se guarda)");
  };

  const personasFiltradas = personasList.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black text-black dark:text-white px-4 py-8">
      <form
        onSubmit={handleSubmit}
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
              return (
                <button
                  type="button"
                  key={persona}
                  onClick={() => togglePersona(persona)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    selected
                      ? "bg-blue-600 text-white"
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

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md py-3 text-lg transition"
        >
          Añadir turno
        </button>
      </form>
    </div>
  );
}