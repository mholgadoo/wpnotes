import type { FastifyReply, FastifyRequest } from "fastify";
import { supabaseAdmin } from "../../config/supabase.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
    userEmail?: string;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return reply
      .status(401)
      .send({ error: true, message: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return reply
      .status(403)
      .send({ error: true, message: "Invalid or expired token" });
  }

  request.userId = user.id;
  request.userEmail = user.email;
}
