CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"service" text,
	"booking_date" text,
	"booking_time" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
