import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type { User } from '../repositories/types';

// Claims shape mirrors Okta's standard OIDC token.
// When switching to real Okta, replace sign/verify with jose JWKS verification
// against https://{okta-domain}/oauth2/default/v1/keys — claim names stay identical.
export type JwtPayload = {
  sub: string;          // user ID  (Okta: sub)
  email: string;
  given_name: string;   // Okta standard
  family_name: string;  // Okta standard
  name: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
};

const ISSUER   = 'https://mock.okta.luxe.dev/oauth2/default';
const AUDIENCE = 'api://luxe';

export function signMockToken(user: User): string {
  return jwt.sign(
    {
      email:       user.email,
      given_name:  user.firstName,
      family_name: user.lastName,
      name:        `${user.firstName} ${user.lastName}`,
    },
    config.MOCK_JWT_SECRET,
    {
      subject:   user.id,
      issuer:    ISSUER,
      audience:  AUDIENCE,
      expiresIn: config.JWT_EXPIRY_SECONDS,
    }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.MOCK_JWT_SECRET, {
    issuer:   ISSUER,
    audience: AUDIENCE,
  }) as JwtPayload;
}
