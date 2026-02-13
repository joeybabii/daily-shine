'use client';
import { AuthProvider, useAuth } from './lib/AuthProvider';
import AuthScreen from './lib/AuthScreen';
import DailyShine from './DailyShine';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #FFF8F0 0%, #FEF0E4 30%, #F5EBE0 60%, #EDE4DA 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center', fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{
            fontSize: 14, color: '#C4764A', fontWeight: 500,
            background: 'rgba(232,151,107,0.1)', padding: '10px 24px',
            borderRadius: 100, display: 'inline-block',
          }}>
            ☀️ Daily Shine
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <DailyShine user={user} />;
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
