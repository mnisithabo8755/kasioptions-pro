'use client';

import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SubmissionState = 'idle' | 'invalid' | 'sending' | 'sent' | 'error';

export function ContactForm() {
  const { localize } = useAppTranslations();
  const [state, setState] = useState<SubmissionState>('idle');
  const isSending = state === 'sending';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    if (!String(fields.get('name') ?? '').trim() || !String(fields.get('message') ?? '').trim()) {
      setState('invalid');
      return;
    }

    const body = new URLSearchParams();
    fields.forEach((value, name) => {
      if (typeof value === 'string') body.append(name, value.trim());
    });

    setState('sending');
    try {
      const response = await fetch('/__forms.html', { method: 'POST', body });
      if (!response.ok) {
        setState('error');
        return;
      }
      form.reset();
      setState('sent');
    } catch {
      setState('error');
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
              <Mail aria-hidden="true" size={20} />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight lg:text-5xl">{localize('Contact us')}</h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground lg:text-base">
              {localize('Send us a question or share your feedback. We’ll reply to the email address you provide.')}
            </p>
          </header>

          <form
            name="contact"
            method="post"
            action="/__forms.html"
            onSubmit={handleSubmit}
            className="min-w-0 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-8"
          >
            <input type="hidden" name="form-name" value="contact" />
            <div hidden>
              <label>
                Leave this field empty
                <input name="bot-field" autoComplete="off" tabIndex={-1} />
              </label>
            </div>

            <fieldset disabled={isSending} className="grid min-w-0 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="contact-name">{localize('Name')}</Label>
                <Input id="contact-name" name="name" type="text" autoComplete="name" maxLength={100} required className="border-border" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact-email">{localize('Email address')}</Label>
                <Input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required className="border-border" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact-message">{localize('Message')}</Label>
                <textarea
                  id="contact-message"
                  name="message"
                  aria-describedby="contact-message-note"
                  rows={5}
                  maxLength={3000}
                  required
                  className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 md:text-sm"
                />
                <p id="contact-message-note" className="text-xs leading-relaxed text-muted-foreground">
                  {localize('Do not include passwords, payment details, or account credentials.')}
                </p>
              </div>

              <div>
                <div role="status">
                  {state === 'sent' && (
                    <p className="mb-3 rounded-md bg-primary/10 px-3 py-2 text-sm">
                      {localize('Your message was sent. Thank you!')}
                    </p>
                  )}
                </div>
                <div role="alert">
                  {state === 'invalid' && <p className="mb-3 text-sm">{localize('Enter your name and a message.')}</p>}
                  {state === 'error' && <p className="mb-3 text-sm">{localize('Your message couldn’t be sent. Please try again.')}</p>}
                </div>
                <Button type="submit" variant="black" className="w-full justify-between sm:w-auto">
                  {isSending ? localize('Sending…') : localize('Send message')}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </main>
  );
}
