'use client';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function AuthScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState('welcome'); // welcome, signin, signup, forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    const { error } = await signInWithEmail(email, password);
    if (error) setError(error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message);
    setLoading(false);
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    const { error } = await signUpWithEmail(email, password);
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for a confirmation link!');
      setMode('signin');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) { setError('Enter your email address'); return; }
    setLoading(true);
    setError('');
    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset link sent! Check your email.');
      setMode('signin');
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,165,116,0.2)',
    borderRadius: 14, fontFamily: "'DM Sans', sans-serif",
    fontSize: 15, color: '#4A3F35', outline: 'none',
    transition: 'border-color 0.3s',
  };

  const btnPrimary = {
    width: '100%', padding: '14px', borderRadius: 100, border: 'none',
    background: 'linear-gradient(135deg, #E8976B, #D4764A)',
    color: 'white', fontFamily: "'DM Sans', sans-serif",
    fontSize: 16, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.3s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFF8F0 0%, #FEF0E4 30%, #F5EBE0 60%, #EDE4DA 100%)',
      fontFamily: "'Instrument Serif', 'Georgia', serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '-10%', right: '-5%', width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,151,107,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', left: '-10%', width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,168,130,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 400, width: '100%', position: 'relative', zIndex: 1,
      }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(232,151,107,0.1)', padding: '10px 24px',
            borderRadius: 100, marginBottom: 20,
            fontSize: 14, fontFamily: "'DM Sans', sans-serif",
            color: '#C4764A', fontWeight: 500,
          }}>
            ☀️ Daily Shine
          </div>
          <h1 style={{
            fontSize: 34, fontWeight: 400, color: '#3D3028',
            lineHeight: 1.2, marginBottom: 10,
          }}>
            {mode === 'welcome' ? 'Your positivity journey starts here' :
             mode === 'signup' ? 'Create your account' :
             mode === 'forgot' ? 'Reset your password' :
             'Welcome back'}
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: '#A8957F', lineHeight: 1.5,
          }}>
            {mode === 'welcome' ? 'Sign in to save your progress across all your devices.' :
             mode === 'signup' ? 'Start tracking your growth today.' :
             mode === 'forgot' ? "We'll send you a reset link." :
             'Pick up right where you left off.'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212,165,116,0.15)',
          borderRadius: 24, padding: 28,
        }}>
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 14, marginBottom: 16,
              background: 'rgba(200,100,100,0.08)', border: '1px solid rgba(200,100,100,0.12)',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: '#A06050',
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              padding: '12px 16px', borderRadius: 14, marginBottom: 16,
              background: 'rgba(130,180,130,0.08)', border: '1px solid rgba(130,180,130,0.12)',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: '#5A8A5A',
            }}>
              {message}
            </div>
          )}

          {/* Welcome / Sign In mode */}
          {(mode === 'welcome' || mode === 'signin') && (
            <div>
              {/* Google button */}
              <button onClick={handleGoogle} style={{
                width: '100%', padding: '14px', borderRadius: 100,
                border: '1px solid rgba(212,165,116,0.2)',
                background: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
                color: '#4A3F35', transition: 'all 0.3s', marginBottom: 16,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
              }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(212,165,116,0.2)' }} />
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#A8957F',
                }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(212,165,116,0.2)' }} />
              </div>

              {/* Email form */}
              <div onSubmit={handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="Email address" style={inputStyle}
                />
                <input
                  type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Password" style={inputStyle}
                  onKeyDown={e => e.key === 'Enter' && handleEmailSignIn(e)}
                />
                <button onClick={handleEmailSignIn} disabled={loading} style={{
                  ...btnPrimary,
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>

              {/* Links */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginTop: 16,
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              }}>
                <button onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} style={{
                  background: 'none', border: 'none', color: '#A8957F',
                  cursor: 'pointer', textDecoration: 'underline',
                }}>
                  Forgot password?
                </button>
                <button onClick={() => { setMode('signup'); setError(''); setMessage(''); }} style={{
                  background: 'none', border: 'none', color: '#C4764A',
                  cursor: 'pointer', fontWeight: 600,
                }}>
                  Create account
                </button>
              </div>
            </div>
          )}

          {/* Sign Up mode */}
          {mode === 'signup' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="Email address" style={inputStyle}
                />
                <input
                  type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Password (min 6 characters)" style={inputStyle}
                  onKeyDown={e => e.key === 'Enter' && handleEmailSignUp(e)}
                />
                <button onClick={handleEmailSignUp} disabled={loading} style={{
                  ...btnPrimary,
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
              <button onClick={() => { setMode('signin'); setError(''); setMessage(''); }} style={{
                background: 'none', border: 'none', color: '#A8957F',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, marginTop: 16, width: '100%', textAlign: 'center',
              }}>
                Already have an account? <span style={{ color: '#C4764A', fontWeight: 600 }}>Sign in</span>
              </button>
            </div>
          )}

          {/* Forgot Password mode */}
          {mode === 'forgot' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="Email address" style={inputStyle}
                  onKeyDown={e => e.key === 'Enter' && handleForgotPassword(e)}
                />
                <button onClick={handleForgotPassword} disabled={loading} style={{
                  ...btnPrimary,
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
              <button onClick={() => { setMode('signin'); setError(''); setMessage(''); }} style={{
                background: 'none', border: 'none', color: '#A8957F',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, marginTop: 16, width: '100%', textAlign: 'center',
              }}>
                Back to <span style={{ color: '#C4764A', fontWeight: 600 }}>Sign in</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
