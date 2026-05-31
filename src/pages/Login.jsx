import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Lock, User, Shield, BarChart3, Wrench, Sparkles } from 'lucide-react';

const FeatureItem = ({ icon: Icon, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={16} color="white" />
    </div>
    <span>{text}</span>
  </div>
);

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const success = await login(username, password);
      if (success) navigate('/');
      else { setError('Usuário ou senha inválidos.'); setLoading(false); }
    } catch (err) {
      setError('Erro ao conectar ao servidor.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', width: '100vw',
      background: 'var(--color-bg-base)', fontFamily: "'Inter', sans-serif",
    }}>
      {/* Left Panel — Brand */}
      <div className="login-brand-panel" style={{
        flex: '1 1 55%', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.35)',
        }} />

        <div style={{
          position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '3rem', maxWidth: 500, textAlign: 'center',
        }}>
          <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="/logo_rede_lopes.png" alt="Rede Lopes" style={{
              width: 220, height: 220, objectFit: 'contain',
              marginBottom: '2.5rem', filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.5))',
            }} />
            <h1 style={{
              fontSize: '3rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0,
              lineHeight: 1.1, letterSpacing: '-0.03em',
            }}>
              Rede <span style={{ color: 'var(--color-primary)' }}>Lopes</span>
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 400 }}>
              Soluções inteligentes para sua empresa
            </p>
          </div>

          <div style={{
            width: '100%', background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '1.5rem 2rem', textAlign: 'left',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Powered by LuizCar ERP
            </p>
            <FeatureItem icon={Car} text="Gestão completa de oficinas" />
            <FeatureItem icon={BarChart3} text="Relatórios e faturamento em tempo real" />
            <FeatureItem icon={Wrench} text="Ordens de serviço ágeis e organizadas" />
            <FeatureItem icon={Shield} text="Controle de acesso por perfil" />
          </div>

          <p style={{
            position: 'absolute', bottom: '1.5rem', color: 'rgba(255,255,255,0.15)',
            fontSize: '0.7rem', letterSpacing: '0.05em',
          }}>
            &copy; 2026 Rede Lopes &middot; Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        flex: '0 0 440px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg-surface)', borderLeft: '1px solid var(--color-border)',
        padding: '3rem 2.5rem', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)',
        }} />

        <img src="/logo_luizcar.jpg" alt="LuizCar" style={{
          width: 80, height: 80, objectFit: 'contain',
          marginBottom: '1.25rem',
        }} />

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)', margin: 0, marginBottom: '0.2rem' }}>
          LuizCar
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '2.5rem', textAlign: 'center' }}>
          desenvolvido por <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Rede Lopes</span>
        </p>

        {error && (
          <div style={{
            background: 'var(--color-danger-light)', border: '1px solid rgba(239,68,68,0.2)',
            color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 10,
            width: '100%', marginBottom: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <div className="input-group">
            <label className="input-label">Usuário</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                <User size={17} />
              </div>
              <input type="text" className="input-field" style={{ width: '100%', paddingLeft: '2.5rem' }}
                placeholder="Digite seu usuário" value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }} required data-gramm="false" />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                <Lock size={17} />
              </div>
              <input type="password" className="input-field" style={{ width: '100%', paddingLeft: '2.5rem' }}
                placeholder="Sua senha" value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }} required data-gramm="false" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.75rem', marginTop: '-0.25rem' }}>
            <Link to="/recuperar-senha" style={{
              color: 'var(--color-primary)', textDecoration: 'none',
              fontSize: '0.8125rem', fontWeight: 500, transition: 'opacity 0.15s',
            }}>
              Esqueceu a senha?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary" style={{
            width: '100%', padding: '0.75rem', fontSize: '0.9375rem',
            borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
          }} disabled={loading}>
            {loading ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>

        <p style={{
          position: 'absolute', bottom: '1.25rem',
          color: 'var(--color-text-muted)', fontSize: '0.7rem',
        }}>
          v1.0.0 &middot; LuizCar ERP
        </p>
      </div>
    </div>
  );
};

export default Login;
