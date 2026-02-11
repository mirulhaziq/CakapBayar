/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Prevent Turbopack from bundling Prisma (causes binary engine issues)
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;
