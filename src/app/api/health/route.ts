// GET /api/health — liveness for the container healthcheck. Unauthenticated and returns no data.
export async function GET() {
  return Response.json({ status: "ok" });
}
