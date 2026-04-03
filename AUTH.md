# Authentication System

## Overview
StartupIQ Copilot now includes a premium login & signup system with:
- Beautiful glassmorphism UI matching the main dashboard
- Smooth animations with Framer Motion
- Form validation & error handling
- Password strength indicator (Signup only)
- Session persistence via localStorage
- Mock authentication backend (development)

## Features

### 🎨 UI/UX
- Soft gradient background (purple/indigo) with animated floating blobs
- Glassmorphic card design with backdrop blur
- Input field focus animations (icon color + border highlight)
- Button hover effects (scale + gradient shift)
- Error/success messages with smooth transitions
- Password visibility toggle
- Responsive design (mobile & desktop)

### 🔐 Authentication Flow
1. **Login Page**
   - Email & password fields
   - "Remember me" checkbox
   - "Forgot password?" link (UI only)
   - Switch to Signup
   - Error/loading states

2. **Signup Page**
   - Email, password, confirm password fields
   - Password strength indicator (Weak → Strong)
   - Password match validation
   - Terms & conditions checkbox
   - Switch to Login
   - Success message on account creation

3. **Session Management**
   - Auth token stored in `localStorage`
   - Remember email option for login
   - Logout button in main dashboard
   - Auto-redirect to login if session expires

## Mock Backend Endpoints

### `POST /api/auth/signup`
Create a new account.
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
Returns: `{ token, userId, email }`

### `POST /api/auth/login`
Log in to existing account.
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```
Returns: `{ token, userId, email }`

### `POST /api/auth/logout`
Log out (invalidate token).
Returns: `{ success: true }`

### `GET /api/auth/me`
Get current user info.
Headers: `Authorization: Bearer <token>`
Returns: `{ email }`

## Testing

1. **Create Account**
   - Go to http://localhost:3003/
   - Click "Create account"
   - Fill in email, password (8+ chars), confirm
   - Agree to terms
   - Click "Create account"
   - Should redirect to dashboard

2. **Login**
   - Go to http://localhost:3003/
   - Enter email & password
   - Click "Login"
   - Should redirect to dashboard

3. **Logout**
   - In dashboard, click LogOut icon (top-right)
   - Should redirect back to login

## Production Checklist

Before deploying, replace mock auth with:
- [ ] Real database (PostgreSQL, MongoDB, etc.)
- [ ] Password hashing (bcrypt)
- [ ] JWT tokens with expiration
- [ ] Email verification
- [ ] Password reset flow
- [ ] Rate limiting (login attempts)
- [ ] Security headers (CORS, CSRF)
- [ ] OAuth integration (Google, GitHub)

## Files

- `src/components/Login.tsx` - Login component
- `src/components/Signup.tsx` - Signup component
- `src/App.tsx` - Auth routing logic
- `server.ts` - Mock auth backend endpoints

## Design System Colors

- Primary: Indigo-600 → Purple-600 (gradients)
- Background: Slate-50 → Indigo-50 → Purple-50
- Accents: Green (success), Red (error), Yellow (warning)
- Text: Slate-900 (primary), Slate-600 (secondary), Slate-400 (tertiary)

## Next Steps

1. Replace mock auth with real backend
2. Add email verification
3. Implement password reset flow
4. Add OAuth providers
5. Set up SSL/TLS certificates
6. Add rate limiting & security headers
7. Implement 2FA (optional)
