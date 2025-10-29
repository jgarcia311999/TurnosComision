import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
    const eventos = await prisma.events.findMany({
      where: {
        starts_at: {
          gte: new Date(),
        },
      },
      orderBy: { starts_at: "asc" },
    });
    return NextResponse.json(eventos);
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    );
  }
}
