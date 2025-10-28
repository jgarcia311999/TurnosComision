

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { newTurnos } = await req.json();

    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
      return NextResponse.json(
        { error: "Faltan variables de entorno GITHUB_TOKEN o GITHUB_REPO" },
        { status: 500 }
      );
    }

    const repo = process.env.GITHUB_REPO; // ej: "jesusgarciaalemany/turnos-comision"
    const filePath = "app/data/turnos.json";

    // Obtener el contenido actual de turnos.json
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!res.ok) {
      throw new Error(`Error al obtener el archivo de GitHub: ${res.statusText}`);
    }

    const fileData = await res.json();
    const currentContent = Buffer.from(fileData.content, "base64").toString("utf-8");
    const currentJson = currentContent ? JSON.parse(currentContent) : [];

    // Fusionar los nuevos turnos con los existentes
    const updatedJson = [...currentJson, ...newTurnos];
    const updatedContent = Buffer.from(JSON.stringify(updatedJson, null, 2)).toString("base64");

    // Hacer commit del nuevo contenido
    const updateRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: `Actualización automática de turnos (${new Date().toISOString()})`,
        content: updatedContent,
        sha: fileData.sha,
      }),
    });

    if (!updateRes.ok) {
      throw new Error(`Error al guardar en GitHub: ${updateRes.statusText}`);
    }

    return NextResponse.json({
      message: "Turnos guardados correctamente en GitHub",
      updatedCount: newTurnos.length,
    });
  } catch (error: unknown) {
    console.error("Error al guardar turnos:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido al guardar turnos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}