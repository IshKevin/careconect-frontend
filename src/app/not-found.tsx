"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Frown, Home, MessageCircle, ArrowRight, Zap, Star, Waves, Shield, Compass } from "lucide-react";

export default function NotFound() {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 text-white">
      {/* Mouse-following teal gradient */}
      <div
        className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full opacity-40 blur-3xl pointer-events-none transition-all duration-700 ease-out -z-40"
        style={{
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.6) 0%, rgba(6, 182, 212, 0.4) 50%, transparent 70%)',
          left: mousePosition.x - 144,
          top: mousePosition.y - 144,
        }}
      />

      {/* Teal Gradient Background */}
      <div className="absolute inset-0 -z-50 bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900" />
      <div className="absolute inset-0 -z-45 bg-teal-500/10" />
      <div className="absolute inset-0 -z-44 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.3),transparent)]" />

      {/* Animated Teal Grid */}
      <div className="absolute inset-0 -z-35 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%2314b8a6' fill-opacity='1'%3e%3ccircle cx='30' cy='30' r='1.5'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")` }} />

      {/* Floating Geometric Shapes - Responsive sizes */}
      <div className="absolute inset-0 -z-30 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-[5%] sm:left-[10%] w-24 sm:w-32 h-24 sm:h-32 border border-teal-300/20 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
        <div className="absolute top-[60%] right-[10%] sm:right-[15%] w-16 sm:w-24 h-16 sm:h-24 border border-teal-400/30 rotate-45 animate-pulse" />
        <div className="absolute bottom-[20%] left-[15%] sm:left-[20%] w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-lg animate-bounce" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[15%] right-[20%] sm:right-[25%] w-14 sm:w-20 h-14 sm:h-20 border-2 border-teal-300/25 hexagon animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Floating Teal Orbs - Responsive */}
      <div className="absolute inset-0 -z-20 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full animate-float bg-gradient-to-r from-teal-400/30 to-cyan-400/30 backdrop-blur-sm`}
            style={{
              width: `${Math.random() * 4 + 3}px`,
              height: `${Math.random() * 4 + 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-teal-900/20 to-transparent" />

      {/* Main Content - Fully Responsive */}
      <div className="relative w-full max-w-6xl mx-auto">
        {/* Glassmorphic Card - Responsive */}
        <div className="relative group">
          {/* Teal Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500 rounded-2xl sm:rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />

          {/* Main Glass Card */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-teal-950/30 border border-teal-300/30 backdrop-blur-2xl shadow-2xl">
            {/* Inner Teal Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 via-transparent to-transparent pointer-events-none" />

            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-300/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

            <div className="relative p-6 sm:p-12 lg:p-16 text-center">
              {/* Interactive Header Badge - Responsive */}
              <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-full bg-teal-950/40 border border-teal-300/30 backdrop-blur-xl mb-6 sm:mb-8 group/badge hover:bg-teal-950/60 transition-all duration-500 hover:scale-105 sm:hover:scale-110">
                <div className="relative">
                  <Waves className="h-5 sm:h-6 w-5 sm:w-6 text-teal-300 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-2 sm:w-3 h-2 sm:h-3 bg-red-500 rounded-full animate-ping" />
                </div>
                <span className="uppercase tracking-wider text-xs sm:text-sm font-bold text-white/95 group-hover/badge:text-teal-300 transition-colors">
                  Ocean Lost
                </span>
                <Compass className="h-5 sm:h-6 w-5 sm:w-6 text-teal-300 animate-spin" style={{ animationDuration: '8s' }} />
              </div>

              {/* Holographic 404 Display - Responsive */}
              <div className="relative mb-8 sm:mb-12 group/number">
                {/* Holographic background layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 bg-clip-text blur-3xl opacity-40 scale-110" />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-300 via-teal-200 to-cyan-300 bg-clip-text blur-xl opacity-60" />

                {/* Main 404 text with glitch effect - Responsive */}
                <h1 className="relative text-[80px] sm:text-[140px] lg:text-[180px] xl:text-[200px] font-black leading-none tracking-tight bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl group-hover/number:animate-pulse">
                  4
                  <div className="inline-block relative">
                    <Frown className="h-[0.6em] w-[0.6em] translate-y-2 sm:translate-y-3 text-teal-100/90 animate-bounce drop-shadow-lg" />
                    {/* Glitch particles around the frown */}
                    <Star className="absolute -top-1 sm:-top-2 -left-1 sm:-left-2 h-3 sm:h-4 w-3 sm:w-4 text-teal-300 animate-ping" />
                    <Star className="absolute -bottom-1 sm:-bottom-2 -right-1 sm:-right-2 h-2 sm:h-3 w-2 sm:w-3 text-cyan-300 animate-ping" style={{ animationDelay: '0.5s' }} />
                  </div>
                  4
                </h1>

                {/* Scan line effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400/30 to-transparent h-1 sm:h-2 animate-scan" />
              </div>

              {/* Enhanced Title Section - Responsive */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white/95 mb-4 bg-gradient-to-r from-white via-teal-200 to-teal-100 bg-clip-text text-transparent">
                  Drifted Into The Deep
                </h2>
                <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent flex-1" />
                  <Waves className="h-4 sm:h-5 w-4 sm:w-5 text-teal-400 animate-pulse" />
                  <div className="h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent flex-1" />
                </div>
                <p className="text-base sm:text-xl text-white/80 max-w-sm sm:max-w-lg mx-auto leading-relaxed px-4">
                  This page has been swept away by the <span className="text-teal-300 font-semibold">digital tide</span>.
                  Let&apos;s navigate you back to <span className="text-cyan-300 font-semibold">safe waters</span>!
                </p>
              </div>

              {/* Futuristic Action Buttons - Fully Responsive */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-12 px-4">
                <Link href="/" className="w-full sm:w-auto group/home">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white border-0 px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-teal-500/25 transition-all duration-500 hover:scale-105 sm:hover:scale-110 relative overflow-hidden text-sm sm:text-lg">
                    {/* Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 opacity-0 group-hover/home:opacity-100 blur-xl transition-opacity duration-500" />
                    <div className="relative flex items-center justify-center">
                      <Home className="h-5 sm:h-6 w-5 sm:w-6 mr-3 sm:mr-4 group-hover/home:rotate-12 transition-transform duration-300" />
                      <span className="font-bold">Return to Shore</span>
                      <ArrowRight className="h-5 sm:h-6 w-5 sm:w-6 ml-3 sm:ml-4 group-hover/home:translate-x-2 transition-transform duration-300" />
                    </div>
                  </Button>
                </Link>

                <Link href="mailto:support@isanomed.org" className="w-full sm:w-auto group/support">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-teal-300/40 text-white hover:bg-teal-500/20 hover:border-teal-300 backdrop-blur-xl px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 sm:hover:scale-110 group-hover/support:border-teal-300 relative overflow-hidden text-sm sm:text-lg"
                  >
                    {/* Button shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-300/10 to-transparent -translate-x-full group-hover/support:translate-x-full transition-transform duration-700" />
                    <div className="relative flex items-center justify-center">
                      <MessageCircle className="h-5 sm:h-6 w-5 sm:w-6 mr-3 sm:mr-4 group-hover/support:scale-125 transition-transform duration-300" />
                      <span className="font-bold">Send SOS</span>
                    </div>
                  </Button>
                </Link>
              </div>

              {/* Interactive Status Cards - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-teal-300/20 px-4">
                {[
                  { icon: Waves, label: 'Ocean Status', status: 'Calm', color: 'text-teal-400' },
                  { icon: Zap, label: 'Current Speed', status: '2.5 knots', color: 'text-cyan-400' },
                  { icon: Shield, label: 'Navigation', status: 'Active', color: 'text-teal-300' }
                ].map((item, index) => (
                  <div key={index} className="group/card p-3 sm:p-4 rounded-lg sm:rounded-xl bg-teal-950/20 border border-teal-300/30 backdrop-blur-xl hover:bg-teal-950/40 transition-all duration-300 hover:scale-105">
                    <item.icon className={`h-5 sm:h-6 w-5 sm:w-6 ${item.color} mx-auto mb-2 group-hover/card:scale-125 transition-transform duration-300`} />
                    <p className="text-white/60 text-xs sm:text-sm">{item.label}</p>
                    <p className={`${item.color} font-bold text-sm sm:text-lg`}>{item.status}</p>
                  </div>
                ))}
              </div>

              {/* Easter Egg Button - Responsive */}
              <div className="mt-6 sm:mt-8">
                <button
                  onClick={() => {
                    const tealColors = ['#14b8a6', '#06b6d4', '#0891b2', '#0e7490'];
                    document.documentElement.style.setProperty('--glow-color', tealColors[Math.floor(Math.random() * tealColors.length)]);
                  }}
                  className="px-3 sm:px-4 py-2 rounded-full bg-teal-950/20 border border-teal-300/30 text-white/60 hover:text-white hover:bg-teal-950/40 text-xs sm:text-sm transition-all duration-300 hover:scale-105"
                >
                  🌊 Change Tides
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Multi-layer Teal Glow - Responsive */}
          <div className="absolute -bottom-8 sm:-bottom-12 left-1/2 transform -translate-x-1/2 w-4/5 h-12 sm:h-20 bg-gradient-to-r from-teal-500/20 via-teal-400/40 to-cyan-500/20 rounded-full blur-2xl sm:blur-3xl" />
          <div className="absolute -bottom-4 sm:-bottom-8 left-1/2 transform -translate-x-1/2 w-3/5 h-8 sm:h-12 bg-gradient-to-r from-teal-400/30 via-teal-300/50 to-cyan-400/30 rounded-full blur-xl sm:blur-2xl" />
        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(3deg); }
            66% { transform: translateY(5px) rotate(-2deg); }
          }
          @keyframes scan {
            0% { transform: translateX(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
          }
          .animate-float { animation: float ease-in-out infinite; }
          .animate-scan { 
            animation: scan 3s ease-in-out infinite;
            animation-delay: 2s;
          }
          .hexagon {
            clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          }
          
          /* Responsive breakpoints adjustments */
          @media (max-width: 640px) {
            .animate-float {
              animation-duration: 6s;
            }
          }
        `}</style>
      </div>
    </div>
  );
}