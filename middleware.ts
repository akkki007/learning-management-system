import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/complete-profile",
  "/api/webhooks/clerk",
  "/api/user/complete-profile",
  "/api/user/check-profile",
]);

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes to pass through
  if (isPublicRoute(request)) {
    return;
  }

  // For protected routes, ensure user is authenticated
  const { userId } = await auth();

  if (!userId) {
    // Redirect to sign-in for non-API routes
    if (!request.nextUrl.pathname.startsWith("/api/")) {
      return Response.redirect(new URL("/sign-in", request.url));
    }
    // Return 401 for API routes
    return new Response("Unauthorized", { status: 401 });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
