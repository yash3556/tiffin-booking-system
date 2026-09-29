import { createMiddleware } from "hono/factory";

export type AuthEnv = {
  Variables: {
    authSession: {
      user: {
        id: string;
      };
    };
  };
};

type SessionLookup = (
  headers: Headers
) => Promise<AuthEnv["Variables"]["authSession"] | null>;

const lookupAuthSession: SessionLookup = async (headers) => {
  const { auth } = await import("../lib/auth.js");
  const session = await auth.api.getSession({ headers });
  return session ? { user: { id: session.user.id } } : null;
};

export function createAuthMiddleware(
  getSession: SessionLookup = lookupAuthSession
) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const session = await getSession(c.req.raw.headers);

    if (!session) {
      return c.json(
        { success: false, message: "Authentication required" },
        401
      );
    }

    c.set("authSession", session);
    await next();
  });
}

export const authMiddleware = createAuthMiddleware();
