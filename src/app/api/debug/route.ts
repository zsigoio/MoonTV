import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const info: Record<string, unknown> = {
    storage_type: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'not set',
    has_db_binding: !!((process.env as any).DB),
    db_type: typeof (process.env as any).DB,
    db_keys: (process.env as any).DB ? Object.keys((process.env as any).DB) : [],
    docker_env: process.env.DOCKER_ENV || 'not set',
  };

  // Try to query D1 directly
  if ((process.env as any).DB) {
    try {
      const db = (process.env as any).DB as { prepare: (s: string) => { first: () => Promise<unknown> } };
      const result = await db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name').first();
      info.tables = result;
    } catch (e) {
      info.query_error = (e as Error).message;
    }

    try {
      const db = (process.env as any).DB as { prepare: (s: string) => { all: () => Promise<{ results: unknown[] }> } };
      const result = await db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name').all();
      info.all_tables = result.results;
    } catch (e) {
      info.all_error = (e as Error).message;
    }
  }

  return NextResponse.json(info);
}
