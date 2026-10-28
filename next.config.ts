import type { NextConfig } from "next";

// Patch for Node 22/25 experimental localstorage issue on SSR / Next build tools
// In certain environments, localStorage is defined as a broken Proxy but getItem is not a function.
if (typeof globalThis !== 'undefined' && globalThis.localStorage && typeof globalThis.localStorage.getItem !== 'function') {
  delete (globalThis as any).localStorage;
}

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
