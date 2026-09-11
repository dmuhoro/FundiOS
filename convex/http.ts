import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { handleWebhook } from "./whatsapp";
import { serveLanding } from "./site";
import { serveCapture } from "./campaignHttp";

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({
  path: "/",
  method: "GET",
  handler: serveLanding,
});
http.route({
  pathPrefix: "/c/",
  method: "GET",
  handler: serveCapture,
});
http.route({
  pathPrefix: "/c/",
  method: "POST",
  handler: serveCapture,
});
http.route({
  path: "/api/whatsapp/webhook",
  method: "GET",
  handler: handleWebhook,
});
http.route({
  path: "/api/whatsapp/webhook",
  method: "POST",
  handler: handleWebhook,
});

export default http;