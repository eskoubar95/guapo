import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const rawPort = process.env.PORT ?? "8080";
const port = Number.parseInt(rawPort, 10);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: ${rawPort}`);
}
const app = createApp();

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`guapo-slack-notify listening on ${info.port}`);
  }
);
