import type { Metadata } from 'next';
import { BookingsClient } from './bookings-client';

export const metadata: Metadata = {
  title: 'Bookings',
};

export default function BookingsPage() {
  return <BookingsClient />;
}
