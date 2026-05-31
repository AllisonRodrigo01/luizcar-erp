import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Car, ArrowLeft, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { api } from '../lib/api';

const ResetarSenha = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (senha.length < 4) {
      setError('A senha deve ter no mínimo 4 caracteres');
      return;
    }
    if (senha !== confirmar) {
      setError('As senhas não conferem');
      return;
    }
    setLoading(true);
    try {
      await api.resetarSenha(token, senha);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100vw',
      background: 'radial-gradient(circle at center, var(--color-bg-surface), var(--color-bg-base))'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        padding: '3rem 2rem', width: '100%', maxWidth: '400px',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
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

        {success ? (
          <div style={{ textAlign: 'center', width: '100%' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle2 size={48} color="var(--color-success)" />
            </div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-success)' }}>Senha Redefinida!</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Sua senha foi alterada com sucesso. Faça login com sua nova senha.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
              Ir para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ width: '100%' }}>
            <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Redefinir Senha</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem', textAlign: 'center' }}>
              Escolha uma nova senha para sua conta.
            </p>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontSize: '0.8125rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-danger-light)', borderRadius: 'var(--radius-md)' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--color-text-muted)' }}>
                  <Lock size={18} />
                </div>
                <input type="password" className="input-field" style={{ width: '100%', paddingLeft: '2.5rem' }}
                  placeholder="Mínimo 4 caracteres"
                  value={senha} onChange={e => setSenha(e.target.value)} required minLength={4} data-gramm="false" />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label className="input-label">Confirmar Senha</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--color-text-muted)' }}>
                  <Lock size={18} />
                </div>
                <input type="password" className="input-field" style={{ width: '100%', paddingLeft: '2.5rem' }}
                  placeholder="Repita a nova senha"
                  value={confirmar} onChange={e => setConfirmar(e.target.value)} required minLength={4} data-gramm="false" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={loading}>
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
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

export default ResetarSenha;