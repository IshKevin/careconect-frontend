import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CalendarCheck,
  Video,
  Smartphone,
  ShieldCheck,
  HeartHandshake,
  FileHeart,
  Stethoscope,
  UserRound,
  Search,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

const FEATURES = [
  { icon: CalendarCheck, title: 'Book in minutes', text: 'See real availability and book a slot that suits you, in person or by video.' },
  { icon: Video, title: 'Secure video visits', text: 'Encrypted calls straight from your browser. Nothing to install, never recorded.' },
  { icon: Smartphone, title: 'Pay your way', text: 'MTN MoMo, Airtel Money or card through Pesapal. Prices always in RWF.' },
  { icon: FileHeart, title: 'Your health record', text: 'Medical history, allergies and medications in one place, shared with your doctor.' },
  { icon: HeartHandshake, title: 'Family can sponsor', text: 'A relative can pay for your care, and only sees what you choose to share.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'Built around Rwanda’s data protection law. Emails never contain health details.' },
];

const STEPS = [
  { icon: Search, title: 'Find a doctor', text: 'Search by specialty and see each doctor’s fee and free slots.' },
  { icon: CalendarCheck, title: 'Book and pay', text: 'Choose a time, then pay securely with mobile money or card.' },
  { icon: Video, title: 'Meet your doctor', text: 'Join the video visit from your appointment page when it is time.' },
];

const AUDIENCES = [
  {
    icon: UserRound,
    title: 'Patients',
    points: ['Book and manage appointments', 'Video consultations', 'Invoices and receipts', 'Keep your health record'],
  },
  {
    icon: Stethoscope,
    title: 'Doctors',
    points: ['Set your weekly schedule', 'See today’s patients at a glance', 'Consult by video', 'Track invoices and revenue'],
  },
  {
    icon: HeartHandshake,
    title: 'Sponsors',
    points: ['Link to a relative with their approval', 'Book on their behalf', 'Pay their invoices', 'No access to records unless shared'],
  },
];

function AppPreview() {
  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-200/60 via-sky-100/60 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_24px_60px_-20px_rgb(15_23_42/0.25)] ring-1 ring-slate-900/5 backdrop-blur">
        <div className="relative aspect-[4/3] min-h-[300px]">
          <Image src="/assets/doctor.jpg" alt="A doctor ready for a video consultation" fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-transparent" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" /> Live consultation
          </div>
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl bg-white/95 p-3 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Video className="size-5" /></span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Dr. Aline Uwase</p>
                <p className="text-xs text-slate-500">General Practice · Today, 10:00</p>
              </div>
            </div>
            <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white">Join call</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-10 -left-8 hidden rounded-2xl border border-border bg-white p-3 shadow-lg sm:block">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-5" /></span>
          <div>
            <p className="text-xs text-slate-500">Payment received</p>
            <p className="text-sm font-semibold text-slate-900">RWF 5,000 · MoMo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px] bg-[radial-gradient(900px_420px_at_75%_0%,theme(colors.brand.100/.8),transparent_70%),radial-gradient(700px_380px_at_0%_10%,theme(colors.sky.100/.7),transparent_70%)]" />
      <Header />

      <main className="relative flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-28 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-medium text-brand-700 shadow-sm">
              <span className="size-1.5 rounded-full bg-brand-500" /> Now welcoming patients across Rwanda
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Healthcare that comes <span className="bg-gradient-to-r from-brand-600 to-sky-600 bg-clip-text text-transparent">to you</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Book trusted doctors, meet them by secure video and pay with mobile money, all in one place. Families can sponsor a relative’s care.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Create a free account <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6">
              {[
                ['24/7', 'Online booking'],
                ['RWF', 'Local pricing'],
                ['0', 'Apps to install'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-1 text-xl font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <AppPreview />
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-t border-border bg-slate-50/60 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-brand-600">Everything in one place</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Care without the waiting room</h2>
              <p className="mt-4 text-slate-600">From the first booking to the receipt, IsanoMed keeps every step simple and secure.</p>
            </div>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="group rounded-2xl border border-border bg-white p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-brand-600">How it works</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">See a doctor in three steps</h2>
            </div>
            <ol className="relative mt-14 grid gap-8 md:grid-cols-3">
              <div aria-hidden className="absolute left-[16%] right-[16%] top-6 hidden h-px bg-gradient-to-r from-brand-200 via-brand-300 to-brand-200 md:block" />
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative text-center">
                  <span className="relative mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-brand-600/20">
                    <Icon className="size-5" />
                    <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-white text-xs font-semibold text-brand-700 ring-1 ring-brand-200">{i + 1}</span>
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-600">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Audiences */}
        <section id="for-you" className="scroll-mt-20 border-t border-border bg-slate-50/60 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-brand-600">Who it is for</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">One platform, three ways to use it</h2>
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {AUDIENCES.map(({ icon: Icon, title, points }) => (
                <div key={title} className="rounded-2xl border border-border bg-white p-7 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-5" /></span>
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-500" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-sky-700 px-6 py-14 text-center shadow-xl sm:px-12">
              <div aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-2xl" />
              <div aria-hidden className="absolute -bottom-24 -left-16 size-72 rounded-full bg-sky-300/20 blur-2xl" />
              <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ready when you are</h2>
              <p className="relative mx-auto mt-4 max-w-xl text-brand-50/90">Create your account in under a minute. Booking is free; you only pay for the consultation.</p>
              <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
                  <Link href="/register">Get started <ArrowRight className="size-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>
              <p className="relative mt-6 inline-flex items-center gap-1.5 text-xs text-brand-50/80"><Lock className="size-3.5" /> Encrypted video and secure payments</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
