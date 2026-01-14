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

## Summary of Completed Exercises (1-5)

The first five exercises provide a solid foundation for web authentication:

1. **Cookies**: Basic cookie handling for preferences
2. **Session Storage**: Secure cookie-based sessions with signing
3. **User Session**: Authentication state management
4. **Password**: Secure password storage with bcrypt
5. **Login**: Password verification and user utilities

All exercises completed without notable issues. The workshop provides clear, progressive learning with well-scaffolded exercises.

---

## Remaining Exercises (6-21)

The remaining exercises cover:
- Logout and session expiration
- Route protection (require auth)
- Role-based access control
- Managed sessions (database-backed)
- Email verification flows
- Password reset
- Two-factor authentication (2FA)
- OAuth integration
- Connection management

---

