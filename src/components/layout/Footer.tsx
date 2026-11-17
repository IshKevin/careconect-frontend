import Link from 'next/link';
import { Logo } from './Logo';

// Public site footer (landing page).
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            Book trusted doctors, meet them by secure video and pay with mobile money or card. Built in Rwanda, for Rwanda.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Product</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
            <li><a href="#features" className="hover:text-slate-900">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-slate-900">How it works</a></li>
            <li><Link href="/register" className="hover:text-slate-900">Create an account</Link></li>
            <li><Link href="/login" className="hover:text-slate-900">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
            <li><a href="mailto:support@isanomed.org" className="hover:text-slate-900">support@isanomed.org</a></li>
            <li>Kigali, Rwanda</li>
            <li className="text-xs text-slate-400">In an emergency, call 912.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <p>© {year} IsanoMed. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-slate-700">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-700">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
