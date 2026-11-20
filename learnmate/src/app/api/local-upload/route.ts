import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileName = `${baseName}-${uniqueSuffix}${ext}`;

    // 1. Save directly into Next.js public directory for instant localhost static serving
    const publicUploadDir = path.join(process.cwd(), "public", "uploads", "assignments");
    if (!fs.existsSync(publicUploadDir)) {
      fs.mkdirSync(publicUploadDir, { recursive: true });
    }
    const publicFilePath = path.join(publicUploadDir, fileName);
    fs.writeFileSync(publicFilePath, buffer);

    // 2. Also save to server/uploads/assignments if server directory is present
    try {
      const serverUploadDir = path.resolve(process.cwd(), "..", "server", "uploads", "assignments");
      if (!fs.existsSync(serverUploadDir)) {
        fs.mkdirSync(serverUploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(serverUploadDir, fileName), buffer);
    } catch {}

    const fileUrl = `/uploads/assignments/${fileName}`;

    return NextResponse.json({
      success: true,
      file: {
        name: originalName,
        url: fileUrl,
        type: file.type || (ext === ".pdf" ? "application/pdf" : "image/jpeg"),
        size: file.size,
      },
    });
  } catch (error: any) {
    console.error("Local upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to save file locally" }, { status: 500 });
  }
}
