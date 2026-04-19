import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * Protect dashboard pages only.
     * Allow: /login, /register, ALL /api routes, static assets, _next, favicon
     */
    "/((?!login|register|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
