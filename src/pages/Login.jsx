import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Lock, User, Shield, Zap, BarChart2 } from 'lucide-react';

const FeatureItem = ({ icon: Icon, text }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem',
    padding: '0.5rem 0'
  }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '8px',
      background: 'rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0
    }}>
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

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        navigate('/');
      } else {
        setError('Usuário ou senha inválidos.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      background: 'var(--color-bg-base)',
      fontFamily: "'Inter', sans-serif"
    }}>

      {/* ===== LADO ESQUERDO — Marca Rede Lopes ===== */}
      <div style={{
        flex: '1 1 55%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        {/* Imagem de fundo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/rede_lopes_logo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.35) saturate(1.2)',
        }} />

        {/* Overlay gradiente sutil */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(10,15,40,0.7) 0%, rgba(0,30,80,0.5) 50%, rgba(10,15,40,0.8) 100%)',
        }} />

        {/* Conteúdo sobre o fundo */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          padding: '3rem',
          maxWidth: '520px',
          textAlign: 'center'
        }}>
          {/* Logo text grande e sutil */}
          <div style={{
            marginBottom: '2.5rem',
          }}>
            <h1 style={{
              fontSize: '3.5rem', fontWeight: 800,
              color: 'white',
              letterSpacing: '-1px',
              margin: 0,
              lineHeight: 1.1,
              textShadow: '0 2px 20px rgba(0,0,0,0.5)'
            }}>
              Rede <span style={{ color: '#60a5fa' }}>Lopes</span>
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '1rem',
              marginTop: '0.75rem',
              fontWeight: 400,
              letterSpacing: '0.02em'
            }}>
              A solução certa para empresas{' '}
              <span style={{ color: '#93c5fd', fontWeight: 600 }}>modernas</span>.
            </p>
          </div>

          {/* Divisor */}
          <div style={{
            width: '60px', height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            marginBottom: '2rem'
          }} />

          {/* Features */}
          <div style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '1.5rem 2rem',
            textAlign: 'left'
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.72rem', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: '1rem'
            }}>
              Powered by
            </p>
            <FeatureItem icon={Car} text="Gestão completa de oficinas mecânicas" />
            <FeatureItem icon={BarChart2} text="Relatórios e faturamento em tempo real" />
            <FeatureItem icon={Zap} text="Ordens de serviço ágeis e organizadas" />
            <FeatureItem icon={Shield} text="Controle de acesso por perfil de usuário" />
          </div>

          {/* Rodapé marca */}
          <p style={{
            position: 'absolute', bottom: '2rem',
            color: 'rgba(255,255,255,0.2)',
            fontSize: '0.75rem',
            letterSpacing: '0.05em'
          }}>
            © 2026 Rede Lopes · Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* ===== LADO DIREITO — Formulário ===== */}
      <div style={{
        flex: '0 0 420px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-surface)',
        borderLeft: '1px solid var(--color-border)',
        padding: '3rem 2.5rem',
        position: 'relative',
      }}>
        {/* Decoração top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #0ea5e9)'
        }} />

        {/* Logo do sistema */}
        <img
          src="/logo_rede_lopes.png"
          alt="Rede Lopes"
          style={{
            width: 64, height: 64,
            borderRadius: 16,
            objectFit: 'cover',
            boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
            marginBottom: '1.25rem',
          }}
        />

        <h2 style={{
          fontSize: '1.4rem', fontWeight: 700,
          color: 'var(--color-text-main)', margin: 0,
          marginBottom: '0.25rem'
        }}>
          LuizCar
        </h2>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.85rem',
          marginBottom: '2.5rem',
          textAlign: 'center'
        }}>
          desenvolvido por <span style={{ color: '#3b82f6', fontWeight: 600 }}>Rede Lopes</span>
        </p>

        {/* Erro */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--color-danger)',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            width: '100%',
            marginBottom: '1.25rem',
            textAlign: 'center',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <div className="input-group">
            <label className="input-label">Usuário</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '50%', left: '12px',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)'
              }}>
                <User size={17} />
              </div>
              <input
                type="text"
                className="input-field"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '50%', left: '12px',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)'
              }}>
                <Lock size={17} />
              </div>
              <input
                type="password"
                className="input-field"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.75rem', marginTop: '-0.25rem' }}>
            <Link to="/recuperar-senha" style={{
              color: 'var(--color-primary)', textDecoration: 'none',
              fontSize: '0.82rem', fontWeight: 500,
              transition: 'opacity 0.15s'
            }}>
              Esqueceu a senha?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%', padding: '0.75rem',
              fontSize: '0.95rem', borderRadius: '10px',
              background: loading ? '#64748b' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              border: 'none',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(59,130,246,0.4)',
              transition: 'all 0.3s ease',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        {/* Versão */}
        <p style={{
          position: 'absolute', bottom: '1.5rem',
          color: 'var(--color-text-muted)',
          fontSize: '0.72rem',
        }}>
          v1.0.0 · LuizCar ERP
        </p>
      </div>

      {/* Responsividade: esconde o painel esquerdo em telas pequenas */}
      <style>{`
        @media (max-width: 768px) {
          .login-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
