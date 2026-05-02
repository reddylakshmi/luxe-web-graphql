// config/env.ts must be the very first import so dotenv loads before anything else reads process.env
import { config, CORS_ORIGIN_LIST } from './config/env';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';

import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { verifyToken, type JwtPayload } from './lib/jwt';

export type ApolloContext = { user: JwtPayload | null };

async function start() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    includeStacktraceInErrorResponses: config.NODE_ENV !== 'production',
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: (origin, cb) => {
        // Allow requests with no origin (curl, server-to-server, Postman)
        if (!origin || CORS_ORIGIN_LIST.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<ApolloContext> => {
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) return { user: null };
        try {
          return { user: verifyToken(auth.slice(7)) };
        } catch {
          return { user: null };
        }
      },
    }),
  );

  // Health check used by Docker / load-balancer probes
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', env: config.APP_ENV })
  );

  app.listen(config.PORT, () => {
    console.log(`\n🚀  GraphQL server ready  [${config.APP_ENV}]`);
    console.log(`   Local:    http://localhost:${config.PORT}/graphql`);
    console.log(`   Sandbox:  https://studio.apollographql.com/sandbox/explorer`);
    console.log(`             (set endpoint to http://localhost:${config.PORT}/graphql)\n`);
    if (config.JAVA_API_URL) {
      console.log(`   Java API: ${config.JAVA_API_URL}`);
    } else {
      console.log(`   Java API: (not configured — using mock data)\n`);
    }
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
