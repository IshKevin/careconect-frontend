"use client";

import Link from "next/link";
import Image from "next/image";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(1200px_600px_at_80%_-10%,#99f6e4_0%,transparent_60%),radial-gradient(900px_500px_at_-10%_10%,#d1fae5_0%,transparent_55%)] bg-white/60 dark:bg-neutral-950">
      {/* subtle noise overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[url('/assets/noise.png')] opacity-[0.06] mix-blend-overlay"
      />
      <Header />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center px-6 lg:px-8 py-24 gap-16">
        {/* decorative glow */}
        <div
          aria-hidden
          className="absolute inset-x-0 -top-16 mx-auto h-64 w-[42rem] rounded-full blur-3xl bg-gradient-to-tr from-teal-300/30 via-cyan-300/30 to-emerald-300/30"
        />

        {/* Text */}
        <div className="relative flex-1 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 px-3 py-1 shadow-sm">
            <span className="inline-block size-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Now accepting new patients
            </span>
          </div>

          <h1 className="mt-6 text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-gray-900 dark:text-white">
            Welcome to <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500">
              IsanoMed
            </span>{" "}
            <br />
            Your Health, <br />
            Our Priority
          </h1>

          <p className="mt-6 text-lg text-gray-700/90 dark:text-gray-300 leading-relaxed">
            Simplify your healthcare journey by connecting with trusted doctors and seamless appointment booking.
            Experience personalized support tailored to your needs, wherever you are.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              asChild
              className="px-8 py-4 text-lg text-white shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 transition-shadow
                         bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700
                         focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label="Register for IsanoMed"
            >
              <Link href="/register">
                Register
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="inline-block px-8 py-4 text-lg text-teal-700 dark:text-teal-300 border-teal-300/60 dark:border-teal-700/60
                         bg-white/60 dark:bg-white/5 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-white/10
                         ring-1 ring-black/5 dark:ring-white/10 focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <a href="#services" aria-label="Explore our services">
                Explore Services
              </a>
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="relative flex-1 max-w-lg">
          <div className="absolute -inset-4 rounded-[2rem] bg-white/40 dark:bg-white/10 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-xl" />
          <div className="relative rounded-[1.6rem] overflow-hidden">
            <Image
              src="/assets/hero-image.jpg"
              alt="Patient consulting a doctor via IsanoMed"
              width={900}
              height={700}
              priority
              className="object-cover w-full h-96"
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        id="services"
        className="relative py-24"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-teal-50/70 via-white/80 to-white dark:from-teal-900/20 dark:via-neutral-950 dark:to-neutral-950" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <Badge
              variant="secondary"
              className="uppercase tracking-widest mb-3 bg-white/60 dark:bg-white/10 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10"
            >
              Our Services
            </Badge>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Your Health, Our Priority — Seamless Care.
            </h2>
            <p className="text-gray-800/90 dark:text-gray-300 text-lg leading-relaxed">
              We connect you with trusted doctors, enable smart health payments, and secure your communications with HIPAA-compliant technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                img: "/assets/doctor.jpg",
                title: "Trusted Healthcare Access",
                desc: "Get connected to your desired care provider with assurance of better treatment.",
              },
              {
                img: "/assets/payment.jpg",
                title: "Smart Health Payments",
                desc: "Low-cost, transparent payments via blockchain and mobile money.",
              },
              {
                img: "/assets/chat.jpg",
                title: "Secure Health Communication",
                desc: "HIPAA-compliant SMS/USSD and app chats with appointment tracking.",
              },
            ].map(({ img, title, desc }) => (
              <Card
                key={title}
                className="group relative overflow-hidden rounded-2xl bg-white/55 dark:bg-white/5 backdrop-blur-2xl
                           ring-1 ring-black/5 dark:ring-white/10 shadow-lg transition-all duration-300
                           hover:shadow-xl hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                bg-gradient-to-tr from-teal-200/20 via-transparent to-emerald-200/20" />
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={img}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <CardTitle className="px-6 pt-6 text-2xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-gray-700 dark:text-gray-300">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-teal-50/60 to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-center text-4xl font-extrabold mb-16 text-gray-900 dark:text-white">
            Get in Touch
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  ),
                  title: "Phone Support",
                  desc: "Call us for immediate assistance",
                  value: "+1 (555) 123-4567",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: "Email Support",
                  desc: "Send us your questions anytime",
                  value: "info@nexuscare.com",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                  title: "Visit Us",
                  desc: "Come see us in person",
                  value: (
                    <>
                      123 Healthcare Ave
                      <br />
                      Medical City, MC 12345
                    </>
                  ),
                },
              ].map(({ icon, title, desc, value }) => (
                <div
                  key={title}
                  className="flex gap-5 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 p-5 shadow-sm"
                >
                  <div className="flex items-center justify-center rounded-xl bg-teal-100/70 dark:bg-teal-900/30 ring-1 ring-teal-200/70 dark:ring-teal-800/50 w-12 h-12 text-teal-700 dark:text-teal-300">
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-1">{desc}</p>
                    <p className="text-teal-700 dark:text-teal-300 font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-white/40 dark:bg-white/10 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-xl" />
              <div className="relative rounded-[1.6rem] overflow-hidden">
                <Image
                  src="/assets/hero-image.jpg"
                  alt="Contact IsanoMed team"
                  width={900}
                  height={700}
                  className="object-cover w-full h-96"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
