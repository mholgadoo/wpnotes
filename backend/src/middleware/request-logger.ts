import type { FastifyRequest } from "fastify";

export async function requestLogger(request: FastifyRequest) {
  request.log.info(
    { method: request.method, url: request.url },
    "incoming request",
  );
}
