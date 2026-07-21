/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 es un módulo nativo: no debe empaquetarse, se usa tal cual
  // desde el runtime del servidor.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
