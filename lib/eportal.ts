// lib/eportal.ts
import { eportalPool } from './db';

export async function findStudentByMatric(matricNo: string) {
  const [rows] = await eportalPool.query(
    `SELECT matric_no, surname, first_name, other_name, department, school, level, entry_session
     FROM std_data_view WHERE matric_no = ? LIMIT 1`,
    [matricNo]
  );
  return (rows as any[])[0] ?? null;
}
