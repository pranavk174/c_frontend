// This file intentionally left empty.
// Socket proxying is handled via Next.js custom server (see server.ts).
// This placeholder prevents Next.js from throwing 404 on /api/socket path checks.
export const dynamic = "force-dynamic";
export async function GET() {
    return new Response("Socket proxy is active via custom server.", {
        status: 200,
    });
}
