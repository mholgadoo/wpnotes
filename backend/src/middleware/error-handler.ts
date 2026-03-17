import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  request.log.error(error);

  const statusCode = error.statusCode ?? 500;
  const message =
    statusCode === 500 ? "Internal Server Error" : error.message;

  reply.status(statusCode).send({
    error: true,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
}
