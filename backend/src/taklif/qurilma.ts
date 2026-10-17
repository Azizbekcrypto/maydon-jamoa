import type { EntityManager } from 'typeorm';

// Qurilma ID — 8–64 harf va raqam (12-Modul hodisalar bilan bir qoida)
export const QURILMA_QOIDASI = /^[a-zA-Z0-9]{8,64}$/;

// Hisobning qurilmalari ro'yxatiga yozish: (hisob, qurilma) jufti bor bo'lsa — hech narsa qilmaydi
export async function qurilmaYoz(m: EntityManager, oyinchiId: number, qurilmaId: unknown): Promise<void> {
  if (typeof qurilmaId !== 'string' || !QURILMA_QOIDASI.test(qurilmaId)) return;
  await m.query(
    `INSERT INTO oyinchi_qurilmalari (oyinchi_id, qurilma_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [oyinchiId, qurilmaId],
  );
}
