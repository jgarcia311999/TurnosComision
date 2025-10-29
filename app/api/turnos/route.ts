import { PrismaClient } from "@/app/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const turnos = await prisma.turno.findMany({
      orderBy: { fecha: "asc" },
    });

    // Agrupar turnos por fecha
    const agrupados = turnos.reduce<Record<string, typeof turnos>>((acc, turno) => {
      const fecha = turno.fecha.toISOString().split("T")[0];
      if (!acc[fecha]) acc[fecha] = [];
      acc[fecha].push(turno);
      return acc;
    }, {});

    // Convertir el resultado a formato [{ fecha, turnos: [...] }]
    const resultado = Object.entries(agrupados).map(([fecha, turnos]) => ({
      fecha,
      turnos,
    }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al obtener los turnos:", error);
    return NextResponse.json({ error: "No se pudieron cargar los turnos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const nuevoTurno = await prisma.turno.create({
      data: {
        fecha: new Date(data.fecha),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        actividad: data.actividad,
        personas: data.personas,
        eventId: data.eventId ?? null,
      },
    });

    return NextResponse.json(nuevoTurno);
  } catch (error) {
    console.error("Error al crear un turno:", error);
    return NextResponse.json({ error: "No se pudo crear el turno" }, { status: 500 });
  }
}
