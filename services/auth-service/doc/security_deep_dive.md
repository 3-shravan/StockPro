# 🔐 StockPro Auth-Service — Security Architecture Deep Dive

A complete, in-depth explanation of how every HTTP request is secured, how JWTs are generated and
validated, and how role-based access control works — all traced through the actual code.

---

## 1. The Big Picture

```
              ┌──────────────────────────────────────────────────────────────┐
              │                  StockPro Auth-Service                       │
              │                                                              │
 HTTP         │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
 Request ────►│  │  Filter Chain │───►│  Controller  │───►│   Service    │  │
              │  │ (JwtAuthFilter)    │ (AuthController)  │(AuthServiceImpl) │
              │  └──────────────┘    └──────────────┘    └──────────────┘  │
              │                                                    │         │
              │                                           ┌────────┴──────┐ │
              │                                           │  Repository   │ │
              │                                           │  (MySQL DB)   │ │
              │                                           └───────────────┘ │
              └──────────────────────────────────────────────────────────────┘
```

The security system has **three layers**:

| Layer | Component | Responsibility |
|---|---|---|
| **1 — Filter** | `JwtAuthFilter` | Validates JWT on every request before it reaches the controller |
| **2 — URL Access** | `SecurityConfig` | Declares which endpoints are public vs. authenticated |
| **3 — Method Access** | `@PreAuthorize` | Enforces role-level rules on specific controller methods |

---

## 2. Why JWT Instead of Sessions?

Traditional web apps use **server-side sessions**:

```
Client                     Server
  │                           │
  │──── POST /login ─────────►│
  │◄─── Set-Cookie: SESS=x ───│  ← Server stores session in memory/DB
  │                           │
  │──── GET /orders ─────────►│  ← Server looks up session in DB
  │◄─── 200 OK ───────────────│
```

**Problem**: Every request hits the DB to look up the session. Doesn't scale horizontally.

StockPro uses **stateless JWTs** instead:

```
Client                     Server
  │                           │
  │──── POST /login ─────────►│
  │◄─── { "token": "eyJ..." } │  ← Server signs a token and forgets about it
  │                           │
  │──── GET /orders ─────────►│  Authorization: Bearer eyJ...
  │     (token in header)     │  ← Server just VERIFIES the signature — no DB hit
  │◄─── 200 OK ───────────────│
```

**The server's memory is the secret key**, not a session store.

---

## 3. JWT Anatomy

A JWT is three Base64-encoded segments separated by dots:

```
eyJhbGciOiJIUzI1NiJ9  .  eyJzdWIiOiJhbGljZUBleGFtcGxlLmNvbSIsInVzZXJJZCI6NDIsInJvbGUiOiJNQU5BR0VSIiwiZGVwYXJ0bWVudCI6IldhcmVob3VzZSIsImlhdCI6MTcxMzQyMzAwMCwiZXhwIjoxNzEzNTA5NDAwfQ  .  SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
     ▲                                                            ▲                                                                                                                                         ▲
  HEADER                                                       PAYLOAD                                                                                                                                  SIGNATURE
```

### Header (decoded)
```json
{
  "alg": "HS256"
}
```

### Payload (decoded) — what StockPro puts in the token
```json
{
  "sub": "alice@example.com",
  "userId": 42,
  "role": "MANAGER",
  "department": "Warehouse",
  "iat": 1713423000,
  "exp": 1713509400
}
```

> [!IMPORTANT]
> The payload is **not encrypted** — anyone can decode it with Base64.
> Never put passwords, credit cards, or sensitive data in a JWT.
> The **signature** is what makes it tamper-proof.

### Signature
```
HMAC-SHA256(
    Base64(header) + "." + Base64(payload),
    secret_key                              ← only the server knows this
)
```

If anyone changes even one character in the payload, the signature check fails. That's the entire
security guarantee of a JWT.

---

## 4. The Security Filter Chain — Step by Step

Spring Security wraps every HTTP request in a **chain of filters**. Think of it as a series of
security guards, each checking a different thing before the request reaches your controller.

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                  Spring Filter Chain                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  1. JwtAuthFilter  (OUR filter — runs first)    │   │
│  │     • Reads "Authorization: Bearer <token>"     │   │
│  │     • Validates signature + expiry              │   │
│  │     • Checks in-memory blacklist                │   │
│  │     • Populates SecurityContext with email+role │   │
│  └─────────────────────┬───────────────────────────┘   │
│                        │                                │
│  ┌─────────────────────▼───────────────────────────┐   │
│  │  2. AuthorizationFilter  (Spring built-in)       │   │
│  │     • Checks SecurityConfig rules               │   │
│  │     • /auth/register, /auth/login → permitAll   │   │
│  │     • all other → must be authenticated         │   │
│  └─────────────────────┬───────────────────────────┘   │
│                        │                                │
└────────────────────────┼────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   DispatcherServlet  │
              │   (AuthController)   │
              │                      │
              │  @PreAuthorize checks│  ← Layer 3: role-level check
              └──────────────────────┘
```

---

## 5. Full Request Lifecycle — Two Complete Examples

### Example A: `POST /auth/login` (Public — No JWT Required)

```
Client                  JwtAuthFilter         SecurityConfig       AuthController     AuthService
  │                          │                     │                    │                 │
  │── POST /auth/login ─────►│                     │                    │                 │
  │   { email, password }    │                     │                    │                 │
  │                          │                     │                    │                 │
  │                    [No Authorization            │                    │                 │
  │                     header present]             │                    │                 │
  │                          │                     │                    │                 │
  │                          │── pass through ─────►│                    │                 │
  │                          │                     │                    │                 │
  │                          │               [/auth/login               │                 │
  │                          │                in permitAll list]        │                 │
  │                          │                     │                    │                 │
  │                          │                     │── forward ────────►│                 │
  │                          │                     │                    │                 │
  │                          │                     │                    │── login() ─────►│
  │                          │                     │                    │                 │
  │                          │                     │                    │          [find by email]
  │                          │                     │                    │          [verify password]
  │                          │                     │                    │          [update lastLoginAt]
  │                          │                     │                    │          [generate JWT]
  │                          │                     │                    │                 │
  │                          │                     │                    │◄── AuthResponse │
  │                          │                     │                    │    { token,     │
  │                          │                     │                    │      userId,    │
  │◄─────────────────────────────────── 200 OK ────│                    │      role,      │
  │  { token, userId,        │                     │                    │      dept,      │
  │    role, department,     │                     │                    │      message }  │
  │    message }             │                     │                    │                 │
```

---

### Example B: `PUT /auth/deactivate/5` (ADMIN Only — JWT Required)

```
Client              JwtAuthFilter              SecurityConfig    AuthController     AuthService
  │                      │                          │                 │                │
  │── PUT /deactivate/5 ►│                          │                 │                │
  │   Authorization:     │                          │                 │                │
  │   Bearer eyJ...      │                          │                 │                │
  │                      │                          │                 │                │
  │               [Extract token]                   │                 │                │
  │               [jwtUtil.isTokenStructurallyValid]│                 │                │
  │                      │                          │                 │                │
  │               ┌──────┴──────┐                   │                 │                │
  │          [VALID?]      [INVALID / EXPIRED]       │                 │                │
  │               │             │                   │                 │                │
  │               │     writeError(401)              │                 │                │
  │               │     "Token expired"              │                 │                │
  │               │                                  │                 │                │
  │        [Check blacklist]                         │                 │                │
  │               │                                  │                 │                │
  │           ┌───┴──────┐                           │                 │                │
  │     [NOT BLACKLISTED] [BLACKLISTED]              │                 │                │
  │               │        │                         │                 │                │
  │               │   writeError(401)                │                 │                │
  │               │   "Token revoked"                │                 │                │
  │               │                                  │                 │                │
  │         [Set SecurityContext]                     │                 │                │
  │         email = jwtUtil.extractEmail(token)      │                 │                │
  │         role  = jwtUtil.extractRole(token)       │                 │                │
  │         authority = "ROLE_ADMIN"                 │                 │                │
  │                      │                           │                 │                │
  │                      │── pass through ──────────►│                 │                │
  │                      │                           │                 │                │
  │                      │                    [anyRequest().           │                │
  │                      │                     authenticated()]        │                │
  │                      │                    [SecurityContext has      │                │
  │                      │                     authentication → OK]    │                │
  │                      │                           │                 │                │
  │                      │                           │── forward ─────►│                │
  │                      │                           │                 │                │
  │                      │                           │         [@PreAuthorize           │
  │                      │                           │          hasRole('ADMIN')]        │
  │                      │                           │                 │                │
  │                      │                           │         ┌───────┴───────┐        │
  │                      │                           │   [Is ADMIN?]   [Not ADMIN]      │
  │                      │                           │         │              │          │
  │                      │                           │         │     throw AccessDenied  │
  │                      │                           │         │     → 403 Forbidden     │
  │                      │                           │         │                         │
  │                      │                           │         │── deactivateUser(5) ───►│
  │                      │                           │         │                         │
  │◄──────────────────────────────── 200 OK ─────────│         │◄── void ───────────────│
  │  { "message": "User│                             │                 │                │
  │    deactivated" }   │                             │                 │                │
```

---

## 6. JwtAuthFilter — Detailed Code Walkthrough

```java
@Override
protected void doFilterInternal(request, response, filterChain) {

    // ─── STEP 1: Check for the Authorization header ───────────────────────────
    String authHeader = request.getHeader("Authorization");

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        // No token → just pass the request on.
        // Spring Security will handle unauthenticated access to protected endpoints.
        filterChain.doFilter(request, response);
        return;
    }

    //  "Bearer eyJhbGci..." → "eyJhbGci..."
    String token = authHeader.substring(7);

    // ─── STEP 2: Structural validation ───────────────────────────────────────
    // JwtUtil.isTokenStructurallyValid() calls extractAllClaims() which verifies:
    //   ✔ The HMAC-SHA256 signature matches
    //   ✔ The token has not expired (exp claim > now)
    if (!jwtUtil.isTokenStructurallyValid(token)) {
        writeError(response, 401, "Token is invalid or has expired");
        return;                                   // ← short-circuit, don't proceed
    }

    // ─── STEP 3: Blacklist check ──────────────────────────────────────────────
    // Tokens are added to the blacklist on:
    //   • POST /auth/logout
    //   • POST /auth/refresh (the OLD token is blacklisted)
    if (!authService.validateToken(token)) {
        writeError(response, 401, "Token has been revoked");
        return;
    }

    // ─── STEP 4: Populate the SecurityContext ─────────────────────────────────
    // Spring Security reads from SecurityContextHolder to know who the current user is.
    // We tell it: "this request belongs to alice@example.com with role MANAGER"
    String email = jwtUtil.extractEmail(token);     // from "sub" claim
    String role  = jwtUtil.extractRole(token);      // from "role" claim

    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
        email,               // ← principal (who they are)
        null,                // ← credentials (not needed — JWT already proved identity)
        List.of(new SimpleGrantedAuthority("ROLE_" + role))   // ← "ROLE_MANAGER"
    );

    SecurityContextHolder.getContext().setAuthentication(auth);

    // ─── STEP 5: Continue the filter chain ───────────────────────────────────
    filterChain.doFilter(request, response);
}
```

> [!NOTE]
> `writeError()` in the filter writes JSON **directly to the HTTP response** and returns.
> It does this because `@RestControllerAdvice` (GlobalExceptionHandler) only intercepts
> exceptions that reach the **DispatcherServlet**. Filter-level errors bypass it entirely.

---

## 7. Role-Based Access Control (RBAC)

### How Roles Flow Through the System

```
Registration          Database          JWT Claim        Spring Security
─────────────         ─────────         ─────────        ───────────────
RegisterRequest  ──►  users.role   ──►  "role":"ADMIN" ──►  ROLE_ADMIN
role = Role.ADMIN     VARCHAR(10)       in JWT payload       (GrantedAuthority)
(enum validated)      @Enumerated                            checked by
                      (STRING)                               @PreAuthorize
```

### The Three Enforcement Points

```
┌─────────────────────────────────────────────────────────────────┐
│  Point 1: Input (Registration)                                  │
│                                                                 │
│  RegisterRequest.role is typed as Role enum                     │
│  → Jackson rejects "SUPERUSER" with 400 before we even run     │
│  → Compiler rejects setRole("ADMIN") — must be Role.ADMIN      │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────┐
│  Point 2: Storage (@Enumerated)                                 │
│                                                                 │
│  @Enumerated(EnumType.STRING) on User.role                      │
│  → Database column is VARCHAR(10)                               │
│  → Only STAFF/MANAGER/OFFICER/ADMIN can be written              │
│  → Hibernate throws on any other value                          │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────┐
│  Point 3: API Access (@PreAuthorize)                            │
│                                                                 │
│  @PreAuthorize("hasRole('ADMIN')")                              │
│  → Spring reads ROLE_ADMIN from SecurityContext                 │
│  → If not present → 403 Forbidden                              │
│  → Role comes from the JWT, which was signed at login time      │
└─────────────────────────────────────────────────────────────────┘
```

### Endpoint-to-Role Access Matrix

| Endpoint | Public | STAFF | MANAGER | OFFICER | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| `POST /auth/register` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/logout` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/refresh` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /auth/profile/{id}` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `PUT /auth/profile/{id}` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `PUT /auth/password` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /auth/users` | ❌ | ❌ | ✅ | ❌ | ✅ |
| `PUT /auth/deactivate/{id}` | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 8. JWT Lifecycle

```
   ┌───────────────────────────────────────────────────────────────────┐
   │                     JWT Complete Lifecycle                         │
   └───────────────────────────────────────────────────────────────────┘

   POST /auth/register
         │
         ▼
   User saved to DB
   (role = STAFF by default)
         │
         ▼
   POST /auth/login ──────────────────────────────────────────────────────►
         │                                                                 │
         ▼                                                                 │
   [verify password]                                                       │
         │                                                                 │
         ▼                                                           [token in use]
   JwtUtil.generateToken()                                                 │
         │                                                                 │
         ▼                                                                 │
   JWT (valid 24h) ─────────────────────────────────────────────────────  │
         │                                                                 │
         │                    ┌────────────────────────────────────────┐   │
         │                    │         POST /auth/refresh              │   │
         │                    │                                        │   │
         │                    │  Old token → blacklisted               │   │
         │                    │  New token generated (fresh 24h)       │◄──┘
         │                    └────────────────────────────────────────┘
         │
         │                    ┌────────────────────────────────────────┐
         │                    │         POST /auth/logout               │
         │                    │                                        │
         └───────────────────►│  Token added to blacklist              │
                              │  ┌─────────────────────────────────┐  │
                              │  │  Set<String> blacklistedTokens  │  │
                              │  │  (ConcurrentHashSet in memory)  │  │
                              │  └─────────────────────────────────┘  │
                              │                                        │
                              │  Any future use of this token          │
                              │  → validateToken() returns false       │
                              │  → JwtAuthFilter writes 401            │
                              └────────────────────────────────────────┘
```

> [!WARNING]
> The in-memory blacklist is cleared on **application restart**. For production
> multi-instance deployments, replace it with Redis or a shared DB table.

---

## 9. Password Security — BCrypt Flow

```
Registration:
  raw password "myPass123"
         │
         ▼
  BCryptPasswordEncoder.encode("myPass123")
         │                         ▲
         │               Adds random 16-byte salt,
         │               runs 10 rounds of Blowfish
         ▼
  "$2a$10$abcdef..."  ──► saved to users.password_hash
  (60-char BCrypt hash)


Login:
  raw password "myPass123"         stored hash "$2a$10$abcdef..."
         │                                    │
         └─────────────────┬──────────────────┘
                           ▼
           passwordEncoder.matches("myPass123", "$2a$10$abcdef...")
                           │
                     [extracts salt from hash,
                      re-runs BCrypt with same salt,
                      compares result]
                           │
                     true / false
```

Even if the DB leaks, BCrypt hashes **cannot be reversed** — attackers must brute-force each
hash individually (extremely slow with 10 rounds).

---

## 10. SecurityConfig — Decisions Explained

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // ← Activates @PreAuthorize/@PostAuthorize on methods
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ① CSRF disabled
            //   CSRF attacks work by tricking a browser into making authenticated requests.
            //   With stateless JWTs (no cookies), there's nothing to hijack — CSRF is irrelevant.
            .csrf(AbstractHttpConfigurer::disable)

            // ② Stateless sessions
            //   Tells Spring: never create or use an HttpSession.
            //   Each request must prove identity via the JWT header, every time.
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ③ URL-level access rules
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/register", "/auth/login").permitAll()
                .anyRequest().authenticated()  // ← everything else needs a valid JWT
            )

            // ④ Place JwtAuthFilter BEFORE Spring's UsernamePasswordAuthenticationFilter
            //   Spring's own filter only handles form-login.
            //   We insert ours first so our JWT check runs before anything else.
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

---

## 11. What Happens If Someone Tampers With the JWT?

Suppose an attacker intercepts Alice's (STAFF) token and tries to change her role to ADMIN:

```
Original payload:  { "sub": "alice@stockpro.com", "role": "STAFF", ... }
Tampered payload:  { "sub": "alice@stockpro.com", "role": "ADMIN", ... }

Attacker rebuilds:  Base64(header) + "." + Base64(tampered_payload) + "." + ORIGINAL_SIGNATURE
```

When `JwtUtil.extractAllClaims()` runs:

```java
Jwts.parser()
    .verifyWith(signingKey())            // ← uses server's secret key
    .build()
    .parseSignedClaims(token)           // ← recomputes HMAC-SHA256 over header+payload
                                         //   Result ≠ original signature
                                         //   → throws SignatureException (extends JwtException)
```

The filter catches it:

```java
} catch (JwtException ex) {
    log.warn("JWT filter — malformed / invalid token ...");
    writeError(response, request, HttpStatus.UNAUTHORIZED, "Invalid token. Please log in again.");
    return;   // ← request dies here, never reaches the controller
}
```

**The attacker gets a 401. The tampered role is never used.**

---

## 12. Complete Component Responsibility Map

```
┌──────────────────┬──────────────────────────────────────────────────────┐
│ Component        │ Responsibility                                        │
├──────────────────┼──────────────────────────────────────────────────────┤
│ SecurityConfig   │ Declares public vs. protected URLs, disables CSRF,   │
│                  │ enforces stateless sessions, registers JwtAuthFilter  │
├──────────────────┼──────────────────────────────────────────────────────┤
│ JwtAuthFilter    │ Extracts + validates JWT from every request,          │
│                  │ populates SecurityContext, writes filter-level 401    │
├──────────────────┼──────────────────────────────────────────────────────┤
│ JwtUtil          │ Stateless JWT operations: generate, parse, validate  │
│                  │ signature + expiry. Knows nothing about blacklist.   │
├──────────────────┼──────────────────────────────────────────────────────┤
│ AuthServiceImpl  │ Business logic: register/login/logout/refresh.        │
│                  │ Owns the blacklist. Encodes passwords on register.    │
├──────────────────┼──────────────────────────────────────────────────────┤
│ AuthController   │ Thin HTTP layer: validate input, delegate to service, │
│                  │ return correct HTTP status codes.                     │
├──────────────────┼──────────────────────────────────────────────────────┤
│ Role (enum)      │ Compile-time + DB-level enforcement of valid roles.   │
├──────────────────┼──────────────────────────────────────────────────────┤
│ User entity      │ @Enumerated(STRING) — invalid role = Hibernate error. │
├──────────────────┼──────────────────────────────────────────────────────┤
│ GlobalException  │ Translates all exceptions into consistent JSON        │
│ Handler          │ ErrorResponse. Logs WARN on 4xx, ERROR on 5xx.       │
├──────────────────┼──────────────────────────────────────────────────────┤
│ BCrypt           │ One-way password hashing with per-user salt.          │
│ PasswordEncoder  │ Makes plaintext passwords impossible to recover.      │
└──────────────────┴──────────────────────────────────────────────────────┘
```

---

## 13. Quick Reference — HTTP Status Codes

| Scenario | Code | Who sends it |
|---|---|---|
| Login successful | `200 OK` | Controller |
| Registration successful | `201 Created` | Controller |
| No JWT in request (protected endpoint) | `401 Unauthorized` | JwtAuthFilter / GlobalExceptionHandler |
| Token expired | `401 Unauthorized` | JwtAuthFilter |
| Token blacklisted (logged out) | `401 Unauthorized` | JwtAuthFilter |
| Token tampered (bad signature) | `401 Unauthorized` | JwtAuthFilter |
| Valid JWT but wrong role | `403 Forbidden` | GlobalExceptionHandler |
| Validation failure (`@Valid`) | `400 Bad Request` | GlobalExceptionHandler |
| Invalid role name in request body | `400 Bad Request` | GlobalExceptionHandler |
| Email already registered | `409 Conflict` | GlobalExceptionHandler |
| User ID not found | `404 Not Found` | GlobalExceptionHandler |
| Wrong password | `401 Unauthorized` | GlobalExceptionHandler |
| Deactivated account tries to login | `403 Forbidden` | GlobalExceptionHandler |
| Unexpected server crash | `500 Internal Server Error` | GlobalExceptionHandler |
