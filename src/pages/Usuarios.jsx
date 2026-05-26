import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus, Edit2, Trash2, Users, ShieldCheck, Wrench, Headphones, X, Key } from 'lucide-react';
import { api } from '../lib/api';

const roleConfig = {
  'Admin': { icon: ShieldCheck, color: 'var(--color-secondary)', bg: 'rgba(99,102,241,0.08)' },
  'Mecanico': { icon: Wrench, color: 'var(--color-info)', bg: 'rgba(2,132,199,0.08)' },
  'Atendimento': { icon: Headphones, color: 'var(--color-warning)', bg: 'rgba(217,119,6,0.08)' },
};

const emptyForm = { nome: '', login: '', senha: '', nivel_acesso: 'Atendimento' };

const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
  }} onClick={onClose}>
    <div className="glass-panel" style={{
      width: '100%', maxWidth: '500px',
      boxShadow: 'var(--shadow-xl)', animation: 'fadeIn 0.2s ease'
    }} onClick={e => e.stopPropagation()}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)'
      }}>
        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', borderRadius: '4px' }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: '1.5rem' }}>{children}</div>
    </div>
  </div>
);

async function hashSenha(senha) {
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.query('SELECT id, nome, login, nivel_acesso FROM usuarios ORDER BY nome');
      setUsuarios(res.rows || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (u) => { setForm({ nome: u.nome, login: u.login, senha: '', nivel_acesso: u.nivel_acesso }); setEditingId(u.id); setShowModal(true); };
  const confirmDelete = (u) => { setDeleteTarget(u); setShowDeleteModal(true); };

  const handleSave = async () => {
    if (!form.nome || !form.login) return;
    if (!editingId && !form.senha) return;
    try {
      const data = { nome: form.nome, login: form.login, nivel_acesso: form.nivel_acesso };
      if (editingId) {
        await api.update('usuarios', data, 'id = ?', [editingId]);
        if (form.senha) {
          const senha_hash = await hashSenha(form.senha);
          await api.update('usuarios', { senha_hash }, 'id = ?', [editingId]);
        }
      } else {
        const senha_hash = await hashSenha(form.senha);
        await api.insert('usuarios', { ...data, senha_hash });
      }
      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete('usuarios', 'id = ?', [deleteTarget.id]);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-header-title">Gerenciar Funcionários</div>
          <div className="page-header-subtitle">Crie e gerencie os perfis de acesso dos colaboradores.</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <UserPlus size={16} /> Novo Funcionário
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Login</th>
              <th>Nível de Acesso</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando...</td></tr>
            ) : usuarios.map((user) => {
              const cfg = roleConfig[user.nivel_acesso] || roleConfig['Atendimento'];
              const Icon = cfg.icon;
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: `hsl(${(user.id * 70) % 360}, 55%, 48%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 600, fontSize: '0.75rem'
                      }}>
                        {user.nome.charAt(0)}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>{user.nome}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{user.login}</td>
                  <td>
                    <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={10} strokeWidth={2} /> {user.nivel_acesso}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ padding: '0.35rem', marginRight: '2px' }} onClick={() => openEdit(user)}>
                      <Edit2 size={14} color="var(--color-primary)" />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '0.35rem', color: 'var(--color-danger)' }} onClick={() => confirmDelete(user)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && usuarios.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum funcionário cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editingId ? 'Editar Funcionário' : 'Novo Funcionário'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nome Completo *</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="Nome do funcionário"
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Login *</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="usuario.login"
                value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">{editingId ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
              <input className="input-field" style={{ width: '100%' }} type="password" placeholder="••••••"
                value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nível de Acesso *</label>
              <select className="input-field" style={{ width: '100%' }}
                value={form.nivel_acesso} onChange={e => setForm(f => ({ ...f, nivel_acesso: e.target.value }))}>
                <option value="Admin">Admin</option>
                <option value="Mecanico">Mecânico</option>
                <option value="Atendimento">Atendimento</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editingId ? 'Salvar Alterações' : 'Cadastrar Funcionário'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal && deleteTarget && (
        <Modal title="Confirmar Exclusão" onClose={() => setShowDeleteModal(false)}>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'rgba(220,38,38,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
            }}>
              <Trash2 size={22} color="var(--color-danger)" />
            </div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>Excluir Funcionário?</h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              O funcionário <strong style={{ color: 'var(--color-text-main)' }}>{deleteTarget.nome}</strong> será removido permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleDelete}
                style={{ background: 'var(--color-danger)' }}>Sim, Excluir</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Usuarios;
