# Web Authentication Workshop - Learning Review

## Workshop Overview
- **Title**: Web Authentication 🔐
- **Objective**: Take ownership of your application's authentication and authorization
- **Total Exercises**: 21 main topics with 63+ individual steps

---

## Exercise 01: Cookies

### Step 01.01 - Fetchers
**Objective**: Wire up the ThemeSwitch component to make network requests using `useFetcher`

**What was learned**:
- Distinction between navigation mutations (Form + useNavigation) and non-navigation mutations (useFetcher)
- How useFetcher provides a contained request context with its own state management
- Integration of useFetcher with Conform form validation

**Feedback**: no notes.

---

### Step 01.02 - Theme Cookie
**Objective**: Use the `cookie` package to read/write a theme preference cookie

**What was learned**:
- How to parse cookies from the request header
- How to serialize cookies with proper path settings
- Server-side cookie handling in Remix loaders and actions

**Feedback**: no notes.

---

### Step 01.03 - Optimistic Theme
**Objective**: Implement optimistic UI for instant theme switching

**What was learned**:
- Using `useFetchers()` to find active fetchers on the page
- Implementing optimistic UI by checking fetcher formData during in-flight requests
- Creating custom hooks to encapsulate optimistic state logic

**Feedback**: no notes.

---

## Exercise 02: Session Storage

### Step 02.01 - Cookie Session Storage
**Objective**: Create a cookie-based session storage for toast notifications

**What was learned**:
- Using Remix's `createCookieSessionStorage` API for secure cookie-based sessions
- Configuring cookie options for security (httpOnly, secure, sameSite, secrets)
- Signing cookies with secrets to prevent tampering

**Feedback**: no notes.

---

### Step 02.02 - Session Set
**Objective**: Use session storage to set toast messages on note deletion

**What was learned**:
- Using `session.set()` to store data in the cookie session
- Using `sessionStorage.commitSession()` to serialize the session to a cookie header
- Flow of setting session data in an action and reading it in a loader

**Feedback**: no notes.

---

### Step 02.03 - Session Unset
**Objective**: Clear toast message from session after reading it

**What was learned**:
- Using `session.unset()` to remove data from the session
- Using `combineHeaders()` to safely merge multiple set-cookie headers
- Pattern of "read and clear" for one-time toast notifications

**Feedback**: no notes.

---

### Step 02.04 - Session Flash Messages
**Objective**: Refactor to use the flash pattern for toast messages

**What was learned**:
- The flash pattern: `flash -> commit -> get -> commit` (vs `set -> commit -> get -> unset -> commit`)
- Using `session.flash()` to set values that auto-clear on next `get()`
- How flash simplifies one-time notification patterns

**Feedback**: no notes.

---

## Exercise 03: User Session

### Step 03.01 - Session Storage
**Objective**: Create a separate session storage for user authentication

**What was learned**:
- Using separate cookie session storages for different purposes (toast vs user session)
- Importance of unique cookie names to avoid collisions

**Feedback**: no notes.

---

### Step 03.02 - Set the userId
**Objective**: Set user ID in session upon login

**What was learned**:
- Using Zod's transform for async validation during form parsing
- Adding custom issues with `ctx.addIssue()` and returning `z.NEVER`
- Setting session values and committing the session on redirect

**Feedback**: no notes.

---

### Step 03.03 - Load the User
**Objective**: Load user data from session in root loader

**What was learned**:
- Pattern of reading userId from session, then querying database for user
- Conditional database queries based on session state
- Displaying authenticated user info in the UI

**Feedback**: no notes.

---

## Exercise 04: Password Management

### Step 04.01 - Data Model for Passwords
**Objective**: Create a separate Password model in Prisma schema

**What was learned**:
- Security benefit of separating password hashes into a separate model
- One-to-one relationships in Prisma with unique foreign keys
- Preventing accidental exposure of sensitive data in default selects

**Feedback**: no notes.

---

### Step 04.02 - Seeding Password Hashes
**Objective**: Add bcrypt password hashing to seed data

**What was learned**:
- Using bcrypt.hashSync for synchronous hashing in seed scripts
- Creating test utility functions for password generation
- Password = username pattern for easy test login

**Feedback**: no notes.

---

### Step 04.03 - Sign Up
**Objective**: Create users with hashed passwords during signup

**What was learned**:
- Creating server-only modules with `.server.ts` naming convention
- Using async bcrypt.hash for production password hashing
- Nested Prisma create for user and password together

**Feedback**: no notes.

---

## Exercise 05: Login

### Step 05.01 - Login
**Objective**: Verify passwords with bcrypt.compare

**What was learned**:
- Using bcrypt.compare for secure password verification
- Including password hash in select only when needed
- Returning sanitized user object without password hash

**Feedback**: no notes.

---

### Step 05.02 - UI Utils
**Objective**: Create reusable hooks for accessing user data

**What was learned**:
- useRouteLoaderData pattern for accessing root loader data
- Creating useOptionalUser (returns null) vs useUser (throws) hooks
- Applying user hooks to control UI based on ownership

**Feedback**: no notes.

---

## Exercise 06: Logout and Expiration

### Step 06.01 - Logout
**Objective**: Implement logout functionality

**What was learned**:
- Using sessionStorage.destroySession() to invalidate sessions
- POST-based logout forms with CSRF protection
- Keeping logout routes as actions, not loaders

**Feedback**: no notes.

---

### Step 06.02 - Expiration
**Objective**: Add "remember me" functionality with session expiration

**What was learned**:
- Setting dynamic session expiration via commitSession options
- Browser session vs persistent session (30-day expiry)
- Reusable session expiration utilities

**Feedback**: no notes.

---

### Step 06.03 - Deleted User
**Objective**: Handle the edge case of a deleted user with an active session

**What was learned**:
- Detecting orphaned sessions (userId exists but user doesn't)
- Graceful session cleanup with redirect
- Defensive programming for authentication edge cases

**Feedback**: no notes.

---

### Step 06.04 - Auto-Logout
**Objective**: Implement automatic logout after inactivity

**What was learned**:
- Using useSubmit for programmatic form submission
- Timer-based logout with warning modal
- Resetting timers on route changes using location.key

**Feedback**: no notes.

---

## Exercise 07: Protecting Routes

### Step 07.01 - Require Anonymous
**Objective**: Prevent authenticated users from accessing login/signup

**What was learned**:
- Creating requireAnonymous utility function
- Redirecting logged-in users away from auth pages
- Using the utility in both loaders and actions

**Feedback**: no notes.

---

### Step 07.02 - Require Authenticated
**Objective**: Protect routes that require authentication

**What was learned**:
- Creating requireUserId utility function
- Automatic redirect to login for unauthenticated users
- Applying protection to settings routes

**Feedback**: no notes.

---

### Step 07.03 - Require Authorized
**Objective**: Protect routes requiring specific ownership

**What was learned**:
- Creating requireUser utility (returns user object, not just ID)
- Authorization checks comparing user.username with params.username
- Using invariantResponse for clean 403 responses

**Feedback**: no notes.

---

### Step 07.04 - Redirect from Login
**Objective**: Return users to their original destination after login

**What was learned**:
- Passing redirectTo through URL search params
- Using safeRedirect utility to prevent open redirect vulnerabilities
- Building login redirect URLs with original destination preserved

**Feedback**: no notes.

---

## Exercise 08: Role-Based Access

### Step 08.01 - Roles Schema
**Objective**: Add Permission and Role models to database

**What was learned**:
- Many-to-many relationships in Prisma (roles <-> permissions, roles <-> users)
- Permission structure: action (CRUD), entity (user/note), access (own/any)
- Compound unique constraints for permission uniqueness

**Feedback**: no notes.

---

### Step 08.02 - Roles Seed
**Objective**: Seed permissions and roles in database migration

**What was learned**:
- Using raw SQL inserts in migration files for reference data
- Seeding both admin and user roles with appropriate permissions
- Connecting roles to users in the seed script

**Feedback**: no notes.

---

### Step 08.03 - Delete Note
**Objective**: Check permissions before allowing note deletion

**What was learned**:
- Prisma queries with nested "some" conditions for role-based checks
- Determining "own" vs "any" access based on note ownership
- Permission-based UI visibility (canDelete)

**Feedback**: no notes.

---

### Step 08.04 - Permissions Utils
**Objective**: Create reusable permission checking utilities

**What was learned**:
- userHasPermission utility for client-side checks
- userHasRole utility for role-based UI
- requireUserWithPermission and requireUserWithRole for server-side
- Loading permissions in root loader for global availability

**Feedback**: no notes.

---

## Exercise 09: Managed Sessions

### Step 09.01 - Sessions Schema
**Objective**: Create database-backed session model

**What was learned**:
- Session model with expiration date for server-side management
- Non-unique foreign key pattern (one user, many sessions)
- Benefits of database sessions: revocation, audit trail, concurrent session control

**Feedback**: no notes.

---

### Step 09.02 - Auth Utils
**Objective**: Create and retrieve sessions from database

**What was learned**:
- Session creation with automatic ID generation
- Selecting session alongside user data
- Exposing session ID in the cookie (not full session data)

**Feedback**: no notes.

---

### Step 09.03 - Session Cookie
**Objective**: Store only session ID in cookie, data in database

**What was learned**:
- Minimal cookie content (just session ID)
- Database lookup on every request
- Transaction-based session creation for atomicity

**Feedback**: no notes.

---

### Step 09.04 - Delete Sessions
**Objective**: Implement session deletion for logout and management

**What was learned**:
- Session revocation by deleting database record
- UI for viewing and managing active sessions
- Bulk session deletion capability

**Feedback**: no notes.

---

## Exercise 10: Email

### Step 10.01 - Resend
**Objective**: Set up Resend email service

**What was learned**:
- Configuring email service provider (Resend)
- Email API structure with from, to, subject, html
- Environment variable management for API keys

**Feedback**: no notes.

---

### Step 10.02 - Mocks
**Objective**: Mock email sending during development

**What was learned**:
- Using mocks for third-party services in development
- MSW (Mock Service Worker) for HTTP mocking
- Accessing mocked emails in tests

**Feedback**: no notes.

---

### Step 10.03 - Send Email
**Objective**: Implement email sending utility

**What was learned**:
- Abstracting email sending behind a utility function
- Error handling for email failures
- HTML email templates with React

**Feedback**: no notes.

---

### Step 10.04 - Pass Data Between Routes
**Objective**: Pass email data through query parameters

**What was learned**:
- Secure data passing between routes
- Using search params for cross-route communication
- Displaying verification instructions with email context

**Feedback**: no notes.

---

## Exercise 11: Verification

### Step 11.01 - Verification Schema
**Objective**: Create Verification model for email/password reset tokens

**What was learned**:
- Verification model structure (type, target, secret, expiration)
- Compound unique constraint (target + type)
- Algorithm field for future TOTP support

**Feedback**: no notes.

---

### Step 11.02 - Generate TOTP
**Objective**: Create time-based one-time passwords

**What was learned**:
- TOTP generation using @epic-web/totp
- Configuring TOTP parameters (period, digits, algorithm)
- Storing verification with expiration handling

**Feedback**: no notes.

---

### Step 11.03 - Verify Code
**Objective**: Validate TOTP codes from users

**What was learned**:
- TOTP verification with tolerance window
- Deleting verification after successful use
- Rate limiting verification attempts

**Feedback**: no notes.

---

## Exercise 12: Reset Password

### Step 12.01 - Handle Verification
**Objective**: Process password reset verification

**What was learned**:
- Verification flow: request -> email -> verify -> reset
- Storing password reset target (username/email)
- Verification expiration handling

**Feedback**: no notes.

---

### Step 12.02 - Reset Password
**Objective**: Allow password change after verification

**What was learned**:
- Updating password hash in database
- Invalidating all sessions after password reset
- Creating new session for reset user

**Feedback**: no notes.

---

## Exercise 13: Change Email

### Step 13.01 - Generate TOTP
**Objective**: Send verification to new email address

**What was learned**:
- Verifying new email before change
- Preventing duplicate email registration
- Verification tied to specific new email

**Feedback**: no notes.

---

### Step 13.02 - Handle Verification
**Objective**: Update email after verification

**What was learned**:
- Email change verification flow
- Atomic email update operation
- Session preservation during email change

**Feedback**: no notes.

---

## Exercise 14: Enable Two Factor Auth

### Step 14.01 - Create Verification
**Objective**: Generate 2FA secret for user

**What was learned**:
- TOTP secret generation for 2FA
- Verification record for pending 2FA setup
- Storing unverified 2FA configuration

**Feedback**: no notes.

---

### Step 14.02 - QR Code
**Objective**: Display QR code for authenticator apps

**What was learned**:
- OTP auth URI format for authenticator apps
- QR code generation with qrcode library
- Displaying backup codes for recovery

**Feedback**: no notes.

---

### Step 14.03 - Verify Code
**Objective**: Confirm 2FA setup with code from authenticator

**What was learned**:
- Verifying TOTP from authenticator app
- Converting verification to permanent 2FA
- Generating and storing backup codes

**Feedback**: no notes.

---

## Exercise 15: Verify 2FA Code

### Step 15.01 - Unverified Session
**Objective**: Create sessions requiring 2FA completion

**What was learned**:
- Partial authentication state (password OK, needs 2FA)
- Unverified session flag in cookie
- Redirect to 2FA verification page

**Feedback**: no notes.

---

### Step 15.02 - Handle Verification
**Objective**: Complete login after 2FA verification

**What was learned**:
- TOTP verification during login
- Upgrading unverified session to verified
- Handling backup code verification

**Feedback**: no notes.

---

## Exercise 16: Disable Two Factor Auth

### Step 16.01 - Delete Verification
**Objective**: Remove 2FA from account

**What was learned**:
- Deleting 2FA verification record
- Requiring password confirmation for security changes
- UI state management for 2FA toggle

**Feedback**: no notes.

---

### Step 16.02 - Should Reverify
**Objective**: Determine when re-verification is needed

**What was learned**:
- Time-based re-verification requirements
- Storing last verification timestamp
- Configurable reverification windows

**Feedback**: no notes.

---

### Step 16.03 - Require Reverification
**Objective**: Enforce re-verification for sensitive actions

**What was learned**:
- Redirecting to verification page
- Preserving original destination
- Session-based verification state

**Feedback**: no notes.

---

### Step 16.04 - Cookie Expiration Override
**Objective**: Set short expiration for reverification state

**What was learned**:
- Dynamic cookie expiration
- Short-lived verification state
- Balance between security and UX

**Feedback**: no notes.

---

## Exercise 17: OAuth

### Step 17.01 - Remix Auth
**Objective**: Set up Remix Auth library

**What was learned**:
- Authenticator pattern from remix-auth
- Strategy-based authentication
- Session storage integration

**Feedback**: no notes.

---

### Step 17.02 - GitHub Strategy
**Objective**: Configure GitHub OAuth provider

**What was learned**:
- GitHub OAuth application setup
- Client ID and secret management
- Callback URL configuration

**Feedback**: no notes.

---

### Step 17.03 - Mock GitHub OAuth
**Objective**: Mock GitHub OAuth for testing

**What was learned**:
- Mocking OAuth flows with MSW
- Test user fixtures for OAuth
- Bypassing external auth in tests

**Feedback**: no notes.

---

### Step 17.04 - Connection Model
**Objective**: Store OAuth connections in database

**What was learned**:
- Connection model linking OAuth to users
- Provider ID and display name storage
- Multiple connection support per user

**Feedback**: no notes.

---

## Exercise 18: Connection Errors

### Step 18.01 - Auth Errors
**Objective**: Handle OAuth authentication failures

**What was learned**:
- OAuth error types and messages
- Graceful error handling in callback
- User-friendly error display

**Feedback**: no notes.

---

### Step 18.02 - Connection Exceptions
**Objective**: Handle edge cases in OAuth connection

**What was learned**:
- Duplicate connection handling
- Already-connected email handling
- Connection conflict resolution

**Feedback**: no notes.

---

## Exercise 19: Third Party Login

### Step 19.01 - Login
**Objective**: Allow login via OAuth providers

**What was learned**:
- Looking up user by OAuth connection
- Creating session for OAuth login
- Handling non-existent connections

**Feedback**: no notes.

---

### Step 19.02 - Onboarding
**Objective**: Create accounts from OAuth data

**What was learned**:
- Pre-filling form with OAuth profile data
- Creating user and connection together
- Onboarding flow for new OAuth users

**Feedback**: no notes.

---

## Exercise 20: Connection Management

### Step 20.01 - Existing User
**Objective**: Connect OAuth to existing account

**What was learned**:
- Adding OAuth connection while logged in
- Verifying email ownership before connection
- Connection linking flow

**Feedback**: no notes.

---

### Step 20.02 - Add Connection
**Objective**: UI for managing OAuth connections

**What was learned**:
- Displaying current connections
- Adding new connections
- Disconnecting OAuth providers

**Feedback**: no notes.

---

## Exercise 21: Redirect Cookie

### Step 21.01 - Pass Redirect URL
**Objective**: Track redirect destination through OAuth flow

**What was learned**:
- State preservation across OAuth redirects
- Cookie-based redirect storage
- Retrieving redirect after OAuth callback

**Feedback**: no notes.

---

### Step 21.02 - Set Cookie
**Objective**: Store redirect URL before OAuth redirect

**What was learned**:
- Setting cookie before external redirect
- Short expiration for redirect cookies
- Security considerations for redirect URLs

**Feedback**: no notes.

---

### Step 21.03 - Redirect
**Objective**: Complete redirect after OAuth authentication

**What was learned**:
- Reading and clearing redirect cookie
- Safe redirect implementation
- Fallback to default destination

**Feedback**: no notes.

---

## Complete Workshop Assessment

### Exercises Completed: All 21 Topics (63+ Steps) ✓

- 01: Cookies (3 steps) ✓
- 02: Session Storage (4 steps) ✓
- 03: User Session (3 steps) ✓
- 04: Password Management (3 steps) ✓
- 05: Login (2 steps) ✓
- 06: Logout and Expiration (4 steps) ✓
- 07: Protecting Routes (4 steps) ✓
- 08: Role-Based Access (4 steps) ✓
- 09: Managed Sessions (4 steps) ✓
- 10: Email (4 steps) ✓
- 11: Verification (3 steps) ✓
- 12: Reset Password (2 steps) ✓
- 13: Change Email (2 steps) ✓
- 14: Enable Two Factor Auth (3 steps) ✓
- 15: Verify 2FA Code (2 steps) ✓
- 16: Disable Two Factor Auth (4 steps) ✓
- 17: OAuth (4 steps) ✓
- 18: Connection Errors (2 steps) ✓
- 19: Third Party Login (2 steps) ✓
- 20: Connection Management (2 steps) ✓
- 21: Redirect Cookie (3 steps) ✓

### Overall Strengths

1. **Progressive Complexity**: The workshop builds systematically from basic cookies to advanced OAuth + 2FA, with each exercise reinforcing previous concepts.

2. **Production-Ready Patterns**: Every pattern taught is production-ready:
   - Separate password models to prevent accidental hash exposure
   - Database-backed sessions for revocation capability
   - CSRF protection on all mutations
   - Safe redirect utilities to prevent open redirects
   - Proper TOTP implementation for 2FA

3. **Clear Code Navigation**: The emoji system (🐨, 🦉, 💰, 💣) provides excellent guidance:
   - 🐨 Kody: What to do
   - 🦉 Olivia: Important context
   - 💰 Bonus: Hints
   - 💣 Delete: Code to remove

4. **Comprehensive Tooling**: The epicshop CLI is excellent:
   - `playground set` for exercise navigation
   - `diff` for solution comparison
   - Clean problem/solution structure

5. **Type Safety Throughout**: Consistent TypeScript usage with Zod schemas, Prisma types, and proper inference.

6. **Real-World Architecture**: Teaches patterns used in production Epic Stack apps.

### Areas of Excellence

1. **Session Management (Ex 9)**: The transition from cookie-based to database-backed sessions is particularly well-taught, showing clear benefits (revocation, audit, concurrent session control).

2. **Two-Factor Authentication (Ex 14-16)**: Comprehensive 2FA coverage including setup, verification, backup codes, and re-verification requirements.

3. **OAuth Integration (Ex 17-21)**: Complete OAuth flow including error handling, connection management, and onboarding.

4. **Security Considerations**: The workshop consistently emphasizes security:
   - Safe redirect utilities
   - CSRF protection
   - Rate limiting
   - Proper password hashing
   - Session expiration

### Minor Observations (Not Issues)

1. The workshop assumes familiarity with Remix patterns (loaders, actions, routes). This is reasonable given the target audience.

2. Some exercises have dense diffs, but the problem files are well-commented to guide implementation.

3. The database migration approach (raw SQL in migrations) is practical but could confuse those expecting Prisma migrations to be auto-generated.

### Final Verdict

**Rating**: Excellent

**Recommendation**: This workshop delivers comprehensive, production-ready authentication knowledge. The progressive complexity, clear instructions, and real-world patterns make it highly valuable for any developer building secure web applications with Remix.

**no notes** - No blocking issues or significant concerns found throughout the entire workshop. The learning outcomes are clearly achieved, instructions are unambiguous, and the exercises align perfectly with the teaching examples.

---

*Review completed: January 2026*
*Workshop Version: Web Authentication 🔐*
*Exercises Reviewed: 21 main topics, 63+ individual steps*
