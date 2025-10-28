import { NextResponse } from 'next/server';

export async function GET() {
  const personas = [
    "Ana",
    "Luca",
    "Abril",
    "Adrià",
    "Carla",
    "Javi",
    "Juanjo",
    "Leti",
    "Martina",
    "Natalia",
    "Nuria",
    "Petit",
    "Tito",
    "Jama",
    "Pablo",
    "Jesús",
    "TODOS",
  ];

  return NextResponse.json(personas);
}