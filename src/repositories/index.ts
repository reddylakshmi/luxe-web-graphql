/**
 * Repository factory — single switch-point between mock and production data sources.
 *
 * Mock mode  (default, JAVA_API_URL not set):
 *   Reads products/users/promos from JSON files in graphql-api/data/.
 *   No external dependencies; server starts immediately.
 *
 * Production mode (JAVA_API_URL set in .env):
 *   Proxies all calls to the Java REST API.
 *   Set JAVA_API_KEY for authenticated endpoints.
 *
 * To go live: add JAVA_API_URL=https://api.luxe.com to the appropriate .env file.
 * No resolver code changes required.
 */

import { MockProductRepository }    from './mock/MockProductRepository';
import { MockCartRepository }        from './mock/MockCartRepository';
import { MockUserRepository }        from './mock/MockUserRepository';
import { MockEngagementRepository }  from './mock/MockEngagementRepository';
import { JavaProductRepository }     from './java/JavaProductRepository';
import { JavaCartRepository }        from './java/JavaCartRepository';
import { JavaUserRepository }        from './java/JavaUserRepository';
import { JavaApiClient }             from './java/JavaApiClient';

import type { IProductRepository, ICartRepository, IUserRepository, IEngagementRepository } from './types';

export type Repositories = {
  products:   IProductRepository;
  cart:       ICartRepository;
  users:      IUserRepository;
  engagement: IEngagementRepository;
};

export function createRepositories(opts: {
  javaApiUrl?: string;
  javaApiKey?: string;
}): Repositories {
  if (opts.javaApiUrl) {
    const client = new JavaApiClient(opts.javaApiUrl, opts.javaApiKey);
    console.log(`[repo] Using Java API at ${opts.javaApiUrl}`);
    return {
      products:   new JavaProductRepository(client),
      cart:       new JavaCartRepository(client),
      users:      new JavaUserRepository(client),
      engagement: new MockEngagementRepository(),
    };
  }

  console.log('[repo] Using mock JSON data (set JAVA_API_URL to switch to production API)');
  return {
    products:   new MockProductRepository(),
    cart:       new MockCartRepository(),
    users:      new MockUserRepository(),
    engagement: new MockEngagementRepository(),
  };
}

export * from './types';
