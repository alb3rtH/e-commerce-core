import { Injectable } from '@nestjs/common';
import { importPKCS8, JWTPayload, SignJWT } from 'jose';

// Standard RFC 7519 claims (controlled by the library, not the user)
interface StandardClaims {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
}

type CustomPayload<T> = T extends StandardClaims
  ? Omit<T, keyof StandardClaims>
  : T;

type Algorithm = 'HS256' | 'RS256';

interface SignerConfig {
  algorithm?: Algorithm;
  secret?: Uint8Array | string;
  privateKey?: string;
  // Standard claims configured in constructor (no payload)
  issuer?: string;
  audience?: string | string[];
  expiresIn?: string | number; // '2h', '1d'
  notBefore?: string | number;
  subject?: string;
  jwtId?: string | (() => string);
}

@Injectable()
export class JwtService<TCustom extends Record<string, unknown>> {
  constructor(private config: SignerConfig) {}

  /**
   * Signs a JWT token with the provided custom claims.
   *
   * @remarks
   * This method creates a new JWT using the configured algorithm (defaults to HS256).
   * It automatically applies standard registered claims (issuer, audience, etc.) and
   * resolves the signing key based on the specified algorithm (HMAC or RSA/ECDSA).
   *
   * @param customClaims - Custom payload claims to include in the token. These will be
   *                       merged with the standard claims configured in the instance.
   * @returns A promise that resolves to the signed JWT string.
   *
   * @throws {Error} If no secret key is provided for HMAC algorithms (HS*).
   * @throws {Error} If no private key is provided for asymmetric algorithms.
   *
   * @example
   * ```typescript
   * const token = await jwtService.signToken({
   *   userId: '123',
   *   role: 'admin'
   * });
   * // Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * ```
   */
  async signToken(customClaims: CustomPayload<TCustom>): Promise<string> {
    const signer = new SignJWT(customClaims as JWTPayload);
    signer.setProtectedHeader({
      alg: this.config.algorithm || 'HS256',
      typ: 'jwt',
    });

    this.applyStandarClaims(signer);
    const key = await this.resolveKey();
    return signer.sign(key);
  }

  /**
   * Applies standard registered claims to the SignJWT instance.
   *
   * @remarks
   * Applied claims include:
   * - `iat` (Issued At): Always automatically set to the current timestamp.
   * - `exp` (Expiration Time): If configured in `expiresIn`.
   * - `nbf` (Not Before): If configured in `notBefore`.
   * - `iss` (Issuer): If configured in `issuer`.
   * - `aud` (Audience): If configured in `audience`.
   * - `sub` (Subject): If configured in `subject`.
   * - `jwtid` (JWT ID): If configured. Can be a string or a function that returns
   *   a string (useful for generating unique dynamic IDs).
   *
   * @param signer - SignJWT instance to which the claims will be applied.
   * @returns void
   *
   * @internal
   */
  private applyStandarClaims(signer: SignJWT): void {
    const c = this.config;

    signer.setIssuedAt(); // siempre automático

    if (c.expiresIn) signer.setExpirationTime(c.expiresIn);
    if (c.notBefore) signer.setNotBefore(c.notBefore);
    if (c.issuer) signer.setIssuer(c.issuer);
    if (c.audience) signer.setAudience(c.audience);
    if (c.subject) signer.setSubject(c.subject);
    if (c.jwtId) {
      const jwtid = typeof c.jwtId === 'function' ? c.jwtId() : c.jwtId;
      signer.setJti(jwtid);
    }
  }

  /**
   * Resolves and returns the appropriate signing key based on the configured algorithm.
   *
   * @remarks
   * - For HMAC algorithms (HS256, HS384, HS512): uses `config.secret`.
   *   If it's a string, it's encoded to Uint8Array. If already Uint8Array, used directly.
   * - For asymmetric algorithms (RS*, ES*, PS*): uses `config.privateKey`
   *   and imports it in PKCS#8 format via `importPKCS8`.
   *
   * @returns A promise that resolves to the key ready for signing
   *          (Uint8Array for HMAC, CryptoKey for asymmetric).
   *
   * @throws {Error} "Secret key are Required for HMAC" - If secret key is missing
   *                 for HMAC algorithms.
   * @throws {Error} "private key are required" - If private key is missing
   *                 for asymmetric algorithms.
   *
   * @internal
   */
  private async resolveKey(): Promise<Uint8Array | CryptoKey> {
    if (this.config.algorithm?.startsWith('HS')) {
      if (!this.config.secret)
        throw new Error('Secret key is required for HMAC');
      return typeof this.config.secret == 'string'
        ? new TextEncoder().encode(this.config.secret)
        : this.config.secret;
    }

    if (!this.config.privateKey)
      throw new Error('private key are required for asymmetric algorithms');

    return importPKCS8(this.config.privateKey, this.config.algorithm!);
  }
}
