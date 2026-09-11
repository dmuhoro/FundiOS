import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { handleWebhook } from "./whatsapp";

const http = httpRouter();
auth.addHttpRoutes(http);

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