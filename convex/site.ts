import { httpAction } from "./_generated/server";
import { buildLandingPage } from "./lib/landing";

export const serveLanding = httpAction(async (_ctx, _request) => {
  return new Response(buildLandingPage(), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
});