import { GoogleOAuthProvider } from '@react-oauth/google';

export function GoogleAuthProvider({ children }) {
  return (
    <GoogleOAuthProvider
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '738325871972-17u1a4eg758tb79nte81oijres6rachm.apps.googleusercontent.com'}
    >
      {children}
    </GoogleOAuthProvider>
  );
}