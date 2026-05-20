import { createServerFn } from "@tanstack/react-start";
import { getSessionServer, signOutServer, signUpWithEmailServer } from "./auth.server";

export { getUserFromToken } from "./auth.server";

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  return getSessionServer();
});

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  return signOutServer();
});

export const signUpWithEmailFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { email: string; password: string } }) => {
    return signUpWithEmailServer(data);
  }
);
