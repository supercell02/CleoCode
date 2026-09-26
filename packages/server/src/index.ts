import { Hono } from 'hono'
import { sentry } from "@sentry/hono/bun";
import * as Sentry from "@sentry/hono/bun";
import { HTTPException } from 'hono/http-exception';
import sessions from './routes/sessions';
import { requireAuth } from './middleware/require-auth';
import chat from './routes/chat';
import auth from './routes/auth';
import billing from './routes/billing';


const app = new Hono();

app.use(
  sentry(app, {
    dsn: "https://93d3802af068af465c12df795065b261@o4512044691030016.ingest.de.sentry.io/4512044709052496",
    tracesSampleRate: 1.0,
    enableLogs: true,
    sendDefaultPii: true,
  }),
);

app.get("/debug-sentry", () => {
  // Send a log before throwing the error
  Sentry.logger.info('User triggered test error', {
    action: 'test_error_endpoint',
  });
  // Send a test metric before throwing the error
  Sentry.metrics.count('test_counter', 1);
  throw new Error("My first Sentry error!");
});

app.onError((error, c) => {
    if(error instanceof HTTPException) {
        Sentry.logger.warn("Handled HTTP error",{
            status: error.status,
            message: error.message || "Request failed",
            path: c.req.path,
            method: c.req.method,
        })

        return c.json({
            error: error.message || "Request failed",
        }, error.status);
    };

    Sentry.logger.error("Unhandled  Server error",{
        path: c.req.path,
        method: c.req.method,
        message: error instanceof Error ? error.message : "Unknown error" ,
    });

    const isDevelopment = process.env.NODE_ENV !== "production";

    if (isDevelopment) {
      console.error("Unhandled server error", {
        path: c.req.path,
        method: c.req.method,
        error,
      });
    }
    
    return c.json({
      error: isDevelopment && error instanceof Error
        ? error.message
        : "Internal server error",
    }, 500);
});

app.use("/sessions/*",requireAuth);
app.use("/chat/*",requireAuth);
app.use("/billing/checkout",requireAuth);
app.use("/billing/portal",requireAuth);

const routes = app
  .route('/auth', auth)
  .route('/billing', billing)
  .route('/sessions', sessions)
  .route('/chat',chat)
  

export type AppType = typeof routes;

export default {port: 3000, fetch: app.fetch, idleTimeout: 255};