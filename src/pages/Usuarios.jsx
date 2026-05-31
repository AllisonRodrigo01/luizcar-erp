import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus, Edit2, Trash2, Users, ShieldCheck, Wrench, Headphones, X } from 'lucide-react';
import { api, API_URL } from '../lib/api';

const roleConfig = {
  'Admin': { icon: ShieldCheck, color: 'var(--color-secondary)', bg: 'rgba(59,130,246,0.08)' },
  'Mecanico': { icon: Wrench, color: 'var(--color-info)', bg: 'rgba(14,165,233,0.08)' },
  'Atendimento': { icon: Headphones, color: 'var(--color-warning)', bg: 'rgba(217,119,6,0.08)' },
};

const emptyForm = { nome: '', login: '', email: '', senha: '', nivel_acesso: 'Atendimento' };

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.query('SELECT id, nome, login, email, nivel_acesso FROM usuarios ORDER BY nome');
      setUsuarios(res.rows || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Erro ao carregar lista de funcionários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); setError(''); };
  const openEdit = (u) => { setForm({ nome: u.nome, login: u.login, email: u.email || '', senha: '', nivel_acesso: u.nivel_acesso }); setEditingId(u.id); setShowModal(true); setError(''); };
  const confirmDelete = (u) => { setDeleteTarget(u); setShowDeleteModal(true); };

  const handleSave = async () => {
    if (!form.nome || !form.login) { setError('Nome e login são obrigatórios.'); return; }
    if (!editingId && !form.senha) { setError('Senha é obrigatória para novos funcionários.'); return; }
    setSaving(true);
    setError('');
    try {
      let res;
      if (editingId) {
        const payload = { action: 'atualizar_usuario', id: editingId, nome: form.nome, login: form.login, email: form.email, nivel_acesso: form.nivel_acesso };
        if (form.senha) payload.senha = form.senha;
        res = await fetch(API_URL, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: 'criar_usuario', nome: form.nome, login: form.login, email: form.email, senha: form.senha, nivel_acesso: form.nivel_acesso }),
        });
      }
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao salvar');
      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setError(error.message || 'Erro ao salvar. Verifique se o login já existe.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'delete', table: 'usuarios', where: 'id = ?', whereArgs: [deleteTarget.id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      setError(error.message || 'Erro ao excluir funcionário.');
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

      {error && (
        <div style={{
          padding: '0.75rem 1rem', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
          color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
          fontSize: '0.8125rem', fontWeight: 500
        }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container"><table>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Login</th>
              <th>E-mail</th>
              <th>Nível de Acesso</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando...</td></tr>
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
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{user.email || '-'}</td>
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
          </table></div>
      </div>

      {showModal && (
        <Modal title={editingId ? 'Editar Funcionário' : 'Novo Funcionário'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nome Completo *</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="Nome do funcionário"
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} data-gramm="false" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Login *</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="Nome de usuário para login"
                value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} data-gramm="false" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">E-mail</label>
              <input className="input-field" style={{ width: '100%' }} type="email" placeholder="email@exemplo.com (para recuperar senha)"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} data-gramm="false" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">{editingId ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
              <input className="input-field" style={{ width: '100%' }} type="password" placeholder="••••••"
                value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} data-gramm="false" />
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
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Funcionário'}
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
