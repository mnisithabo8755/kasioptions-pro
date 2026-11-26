import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { bookings } from '@/db/schema';

export const runtime = 'nodejs';

let ensured = false;

async function ensureTable() {
  if (ensured) return;
  // Migration files are applied by Netlify at deploy time. This guard lets
  // a fresh branch work before migrations run and keeps dev usable.
  try {
    await db.execute(
      sql`CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        service TEXT,
        booking_date TEXT,
        booking_time TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    );
    ensured = true;
  } catch (e) {
    // If DDL is not permitted here, the migration will create the table.
    console.warn('[bookings ensureTable]', e);
  }
}

function clean(value: unknown, max = 2000): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function GET() {
  try {
    await ensureTable();
    const rows = await db
      .select({
        id: bookings.id,
        name: bookings.name,
        email: bookings.email,
        phone: bookings.phone,
        service: bookings.service,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        notes: bookings.notes,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .orderBy(desc(bookings.createdAt));
    return NextResponse.json({ bookings: rows });
  } catch (error) {
    console.error('[bookings GET]', error);
    return NextResponse.json({ bookings: [], error: 'Failed to load bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = clean(body.name, 100);
    const email = clean(body.email, 254);
    const phone = clean(body.phone, 40);
    const service = clean(body.service, 120);
    const bookingDate = clean(body.bookingDate, 40) ?? clean(body.date, 40);
    const bookingTime = clean(body.bookingTime, 40) ?? clean(body.time, 40);
    const notes = clean(body.notes, 3000) ?? clean(body.message, 3000);

    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Name and a valid email are required.' }, { status: 400 });
    }

    await ensureTable();
    const [created] = await db
      .insert(bookings)
      .values({ name, email, phone, service, bookingDate, bookingTime, notes })
      .returning();

    return NextResponse.json({ booking: created }, { status: 201 });
  } catch (error) {
    console.error('[bookings POST]', error);
    return NextResponse.json({ error: 'Could not save booking. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'A valid booking id is required.' }, { status: 400 });
    }
    await db.delete(bookings).where(eq(bookings.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[bookings DELETE]', error);
    return NextResponse.json({ error: 'Could not delete booking.' }, { status: 500 });
  }
}
