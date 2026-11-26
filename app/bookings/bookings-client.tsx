'use client';

import { ArrowLeft, ArrowRight, CalendarDays, ListChecks, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Booking = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  bookingDate: string | null;
  bookingTime: string | null;
  notes: string | null;
  createdAt: string | null;
};

type Status = 'idle' | 'saving' | 'saved' | 'error';

function formatCreated(value: string | null): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function BookingsClient() {
  const { localize } = useAppTranslations();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const isSaving = status === 'saving';

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/bookings', { cache: 'no-store' });
      const data = (await res.json().catch(() => ({}))) as { bookings?: Booking[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setBookings(data.bookings ?? []);
    } catch {
      setLoadError(localize('Could not load bookings. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [localize]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const payload = {
      name: String(fields.get('name') ?? '').trim(),
      email: String(fields.get('email') ?? '').trim(),
      phone: String(fields.get('phone') ?? '').trim(),
      service: String(fields.get('service') ?? '').trim(),
      bookingDate: String(fields.get('bookingDate') ?? '').trim(),
      bookingTime: String(fields.get('bookingTime') ?? '').trim(),
      notes: String(fields.get('notes') ?? '').trim(),
    };
    if (!payload.name || !payload.email) {
      setStatus('error');
      setMessage(localize('Enter your name and a valid email.'));
      return;
    }
    setStatus('saving');
    setMessage(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { booking?: Booking; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not save');
      form.reset();
      setStatus('saved');
      setMessage(localize('Booking saved. It now appears in the list below.'));
      if (data.booking) {
        setBookings((prev) => [data.booking as Booking, ...prev]);
      } else {
        await load();
      }
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : localize('Could not save booking. Please try again.'));
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm(localize('Delete this booking?'))) return;
    try {
      const res = await fetch(`/api/bookings?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setMessage(localize('Could not delete booking. Please try again.'));
    }
  }

  return (
    <main className="h-full overflow-y-auto overscroll-contain bg-background text-foreground">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col px-5 py-6 sm:px-8 lg:py-12">
        <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
          <ArrowLeft aria-hidden="true" size={16} />
          {localize('Back to trading')}
        </Link>

        <div className="my-auto grid gap-6 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-16 lg:py-12">
          <header className="lg:pt-8">
            <div className="mb-4 grid size-11 place-items-center rounded-xl border border-primary/30 bg-primary/10">
              <CalendarDays aria-hidden="true" size={20} />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight lg:text-5xl">{localize('Bookings')}</h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground lg:text-base">
              {localize('Create a booking and see every booking saved in the list. Bookings are stored in the database and persist across visits.')}
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <ListChecks aria-hidden="true" size={16} />
              <span>{localize('{count} booking(s) saved', { count: bookings.length })}</span>
              <button type="button" onClick={() => void load()} className="ml-2 inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline">
                <RefreshCw aria-hidden="true" size={14} />
                {localize('Refresh')}
              </button>
            </div>
          </header>

          <div className="min-w-0 space-y-6">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-8">
              <fieldset disabled={isSaving} className="grid min-w-0 gap-5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="booking-name">{localize('Name')}</Label>
                    <Input id="booking-name" name="name" type="text" autoComplete="name" maxLength={100} required className="border-border" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="booking-email">{localize('Email address')}</Label>
                    <Input id="booking-email" name="email" type="email" autoComplete="email" maxLength={254} required className="border-border" />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="booking-phone">{localize('Phone')}</Label>
                    <Input id="booking-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} className="border-border" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="booking-service">{localize('Service')}</Label>
                    <Input id="booking-service" name="service" type="text" maxLength={120} className="border-border" />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="booking-date">{localize('Date')}</Label>
                    <Input id="booking-date" name="bookingDate" type="date" className="border-border" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="booking-time">{localize('Time')}</Label>
                    <Input id="booking-time" name="bookingTime" type="time" className="border-border" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="booking-notes">{localize('Notes')}</Label>
                  <textarea
                    id="booking-notes"
                    name="notes"
                    rows={3}
                    maxLength={3000}
                    className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 md:text-sm"
                  />
                </div>
                <div role="status" aria-live="polite">
                  {status === 'saved' && message && <p className="mb-3 rounded-md bg-primary/10 px-3 py-2 text-sm">{message}</p>}
                </div>
                <div role="alert">
                  {status === 'error' && message && <p className="mb-3 text-sm">{message}</p>}
                </div>
                <Button type="submit" variant="black" className="w-full justify-between sm:w-auto">
                  {isSaving ? localize('Saving…') : localize('Save booking')}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </fieldset>
            </form>

            <section aria-label={localize('Bookings list')}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{localize('Saved bookings')}</h2>
                <span className="text-sm text-muted-foreground">{bookings.length}</span>
              </div>
              {loading ? (
                <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">{localize('Loading bookings…')}</p>
              ) : loadError ? (
                <p role="alert" className="rounded-xl border border-border bg-card p-5 text-sm">{loadError}</p>
              ) : bookings.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  {localize('No bookings yet. Save your first booking with the form above.')}
                </p>
              ) : (
                <ul className="space-y-3">
                  {bookings.map((b) => (
                    <li key={b.id} className="rounded-xl border border-border bg-card p-4 text-card-foreground">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{b.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{b.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDelete(b.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                          aria-label={`${localize('Delete')} ${b.name}`}
                        >
                          <Trash2 aria-hidden="true" size={14} />
                          {localize('Delete')}
                        </button>
                      </div>
                      <dl className="mt-3 grid gap-1 text-sm">
                        {b.phone && (<div className="flex gap-2"><dt className="text-muted-foreground">{localize('Phone')}:</dt><dd>{b.phone}</dd></div>)}
                        {b.service && (<div className="flex gap-2"><dt className="text-muted-foreground">{localize('Service')}:</dt><dd>{b.service}</dd></div>)}
                        {(b.bookingDate || b.bookingTime) && (
                          <div className="flex gap-2">
                            <dt className="text-muted-foreground">{localize('When')}:</dt>
                            <dd>{[b.bookingDate, b.bookingTime].filter(Boolean).join(' · ')}</dd>
                          </div>
                        )}
                        {b.notes && <dd className="text-muted-foreground">{b.notes}</dd>}
                        <div className="flex gap-2 text-xs text-muted-foreground"><dt>{localize('Saved')}:</dt><dd>{formatCreated(b.createdAt)}</dd></div>
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
