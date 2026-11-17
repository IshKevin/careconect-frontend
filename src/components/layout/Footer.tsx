import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative text-white">
      {/* Shiny gradient background */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500" />

      {/* Global blur for glass effect */}
      <div className="absolute inset-0 -z-20 bg-transparent supports-[backdrop-filter]:backdrop-blur-3xl" />

      {/* Fine noise texture */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{ backgroundImage: "url('/assets/noise.png')", backgroundSize: "auto" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Crystal-clear glass panel */}
        <div className="relative rounded-3xl bg-white/5 backdrop-blur-3xl ring-1 ring-white/20 shadow-lg overflow-hidden">
          {/* Inner scrim for readability */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          <div className="relative p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              {/* Company Info */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-white text-teal-700 font-extrabold grid place-items-center mr-3 shadow-md">
                    N
                  </div>
                  <span className="text-xl font-extrabold tracking-tight drop-shadow-md">
                    IsanoMed
                  </span>
                </div>
                <p className="text-white/95 mb-5 max-w-md leading-relaxed">
                  Connecting patients with healthcare professionals for better
                  health outcomes. Your trusted partner in healthcare management
                  and accessibility.
                </p>
                <div className="space-y-3 text-white/90">
                  <a
                    href="tel:+15551234567"
                    className="flex items-center hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" aria-hidden="true" />
                    +1 (555) 123-4567
                  </a>
                  <a
                    href="mailto:info@nexuscare.com"
                    className="flex items-center hover:text-white transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                    info@nexuscare.com
                  </a>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5" aria-hidden="true" />
                    <span>123 Healthcare Ave, Medical City, MC 12345</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
                <ul className="space-y-2">
                  {[
                    { href: "/", label: "Home" },
                    { href: "#services", label: "Services" },
                    { href: "#about", label: "About Us" },
                    { href: "/login", label: "Patient Portal" },
                    { href: "/register", label: "Register" },
                  ].map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-white/90 hover:text-white hover:underline underline-offset-4 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Services</h3>
                <ul className="space-y-2 text-white/90">
                  <li className="hover:text-white transition-colors">Online Consultations</li>
                  <li className="hover:text-white transition-colors">Appointment Booking</li>
                  <li className="hover:text-white transition-colors">Health Records</li>
                  <li className="hover:text-white transition-colors">Emergency Care</li>
                  <li className="hover:text-white transition-colors">Specialist Referrals</li>
                </ul>
              </div>
            </div>

            {/* Footer bottom */}
            <div className="border-t border-white/20 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    aria-label={`Social Link ${i}`}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 ring-1 ring-white/20 transition-colors"
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </a>
                ))}
              </div>

              <p className="text-sm text-white/85">
                © {year} <span className="font-semibold">IsanoMed</span>. All
                rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
