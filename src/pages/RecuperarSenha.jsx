import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

const RecuperarSenha = () => {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.sendRecuperarSenha(email);
      setResetLink(data.resetLink || '');
      setEnviado(true);
    } catch (err) {
      setError(err.message || 'Erro ao enviar e-mail');
    } finally {
      setLoading(false);
    }
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
          background: 'var(--color-primary)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <Car size={32} color="white" />
        </div>
        
        <h2 style={{ marginBottom: '0.5rem' }}>Recuperar Senha</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem', textAlign: 'center' }}>
          Digite seu login (e-mail cadastrado) e enviaremos um link para redefinir sua senha.
        </p>

        {enviado ? (
          <div style={{ textAlign: 'center', width: '100%' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle2 size={48} color="var(--color-success)" />
            </div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-success)' }}>
              {resetLink ? 'Link Gerado!' : 'E-mail Enviado!'}
            </h3>
            {resetLink ? (
              <>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Seu login não é um e-mail válido. Use o link abaixo para redefinir sua senha:
                </p>
                <a href={resetLink} className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', marginBottom: '1rem', wordBreak: 'break-all' }}>
                  {resetLink}
                </a>
              </>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Verifique sua caixa de entrada (e a pasta de spam) para redefinir sua senha.
              </p>
            )}
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRecuperar} style={{ width: '100%' }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontSize: '0.8125rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-danger-light)', borderRadius: 'var(--radius-md)' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label className="input-label">Login (e-mail cadastrado)</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--color-text-muted)' }}>
                  <Mail size={18} />
                </div>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '100%', paddingLeft: '2.5rem' }} 
                  placeholder="seu@email.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-gramm="false" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
            
            <Link to="/login" style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem'
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