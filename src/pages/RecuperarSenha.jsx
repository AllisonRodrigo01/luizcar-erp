import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const RecuperarSenha = () => {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleRecuperar = (e) => {
    e.preventDefault();
    // Simulação do envio de e-mail (futura integração com Netlify Functions / Resend)
    setTimeout(() => {
      setEnviado(true);
    }, 1000);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at center, var(--color-bg-surface), var(--color-bg-base))'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        padding: '3rem 2rem',
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ 
          width: '60px', height: '60px', 
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
          marginBottom: '1rem'
        }}>
          <Car size={32} color="white" />
        </div>
        
        <h2 style={{ marginBottom: '0.5rem' }}>Recuperar Senha</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem', textAlign: 'center' }}>
          Digite seu e-mail cadastrado e enviaremos um link para você redefinir sua senha.
        </p>

        {enviado ? (
          <div style={{ textAlign: 'center', width: '100%' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle2 size={48} color="var(--color-success)" />
            </div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-success)' }}>E-mail Enviado!</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Verifique sua caixa de entrada (e a pasta de spam) para redefinir sua senha.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRecuperar} style={{ width: '100%' }}>
            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label className="input-label">E-mail Cadastrado</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--color-text-muted)' }}>
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  className="input-field" 
                  style={{ width: '100%', paddingLeft: '2.5rem' }} 
                  placeholder="seu@email.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              Enviar Link de Recuperação
            </button>
            
            <Link to="/login" style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem',
              transition: 'color var(--transition-fast)'
            }}>
              <ArrowLeft size={16} /> Voltar ao Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default RecuperarSenha;
