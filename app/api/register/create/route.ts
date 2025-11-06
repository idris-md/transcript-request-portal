// app/api/register/create/route.ts
import { NextResponse } from "next/server";
import { transcriptPool } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { matric, password, email, phone, profile } = await req.json();
  const hash = await bcrypt.hash(password, 12);

  const conn = await transcriptPool.getConnection();
  try {
    await conn.beginTransaction();
    const [exists] = await conn.query(
      "SELECT id FROM students WHERE matric_no=? LIMIT 1", [matric]
    );
    if ((exists as any[]).length) {
      await conn.rollback(); 
      return NextResponse.json({ message: "Account already exists" }, { status: 409 });
    }

    await conn.query(
      `INSERT INTO students (matric_no, password_hash, email, phone, full_name, department, school, level, entry_session)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        matric, hash, email ?? null, phone ?? null,
        profile.full_name ?? null, profile.department ?? null, profile.school ?? null,
        profile.level ?? null, profile.entry_session ?? null
      ]
    );
    await conn.commit();
    return NextResponse.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  } finally {
    conn.release();
  }
}
