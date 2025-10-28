import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "app/data/turnos.json");
    const data = fs.readFileSync(filePath, "utf-8");
    const turnos = JSON.parse(data);
    return NextResponse.json(turnos);
  } catch (error) {
    console.error("Error al leer turnos.json:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los turnos" },
      { status: 500 }
    );
  }
}
