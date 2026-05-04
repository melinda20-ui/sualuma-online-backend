import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "store-products.json");
    const raw = await readFile(filePath, "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch (error) {
    return NextResponse.json(
      { error: "Não consegui carregar os produtos da loja." },
      { status: 500 }
    );
  }
}
