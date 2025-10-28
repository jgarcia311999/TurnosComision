import { NextResponse } from 'next/server';

export async function GET() {
  const turnos = [
    {
      fecha: '4/10',
      turnos: [
        {
          personas: ['Natalia', 'Juanjo', 'Petit'],
          horaInicio: '21:00',
          horaFin: '00:00',
          actividad: 'Barra'
        },
        {
          personas: ['Jesús', 'Carla'],
          horaInicio: '00:00',
          horaFin: '01:30',
          actividad: 'Barra'
        },
        {
          personas: ['Luca', 'Martina'],
          horaInicio: '01:30',
          horaFin: '03:00',
          actividad: 'Barra'
        },
        {
          personas: ['Ana', 'Abril'],
          horaInicio: '03:00',
          horaFin: '04:30',
          actividad: 'Barra'
        },
        {
          personas: ['Todos'],
          horaInicio: '04:30',
          horaFin: '',
          actividad: 'Cierre'
        }
      ]
    },
    {
      fecha: '1/11',
      turnos: [
        {
          personas: ['Javi', 'Ana'],
          horaInicio: '00:00',
          horaFin: '01:30',
          actividad: 'Barra'
        },
        {
          personas: ['Petit', 'Natalia'],
          horaInicio: '00:00',
          horaFin: '01:30',
          actividad: 'Puerta'
        },
        {
          personas: ['Jesús', 'Juanjo'],
          horaInicio: '01:30',
          horaFin: '03:00',
          actividad: 'Barra'
        },
        {
          personas: ['Leti', 'Martina'],
          horaInicio: '01:30',
          horaFin: '03:00',
          actividad: 'Puerta'
        },
        {
          personas: ['Luca', 'Jama'],
          horaInicio: '03:00',
          horaFin: '04:30',
          actividad: 'Barra'
        }
      ]
    }
  ];

  return NextResponse.json(turnos);
}
