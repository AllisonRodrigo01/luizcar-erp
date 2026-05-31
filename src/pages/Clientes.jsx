import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, X, Phone, Mail, CheckCircle, XCircle, Filter, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';

const initForm = { nome: '', telefone: '', email: '', cpf: '', endereco: '', ativo: 1 };

const Modal = ({ title, onClose, children, show }) => (
  <div className="modal-overlay" style={{ display: show ? 'flex' : 'none' }} onClick={onClose}>
    <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const Clientes = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDelModal, setShowDelModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [form, setForm] = useState({ ...initForm });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.query('SELECT * FROM clientes ORDER BY nome');
      const list = (res.rows || []).map(r => ({ ...r, cpf: r.cpf_cnpj || '' }));
      setClientes(list);
    } catch (e) {
      console.error('Erro carregar clientes:', e);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = clientes.filter(c => {
    if (!c) return false;
    const s = (search || '').toLowerCase();
    const nome = (c.nome || '').toLowerCase();
    const tel = (c.telefone || '');
    const email = (c.email || '').toLowerCase();
    const cpf = (c.cpf || '');
    const matchSearch = nome.includes(s) || tel.includes(s) || email.includes(s) || cpf.includes(s);
    const matchStatus = filterStatus === 'todos' || (filterStatus === 'ativo' ? c.ativo : !c.ativo);
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setForm({ ...initForm });
    setError('');
    setShowNewModal(true);
  };

  const openEdit = (c) => {
    if (!c) return;
    setForm({ nome: c.nome || '', telefone: c.telefone || '', email: c.email || '', cpf: c.cpf || '', endereco: c.endereco || '', ativo: c.ativo ?? 1 });
    setError('');
    setEditTarget(c);
    setShowEditModal(true);
  };

  const confirmDel = (c) => {
    if (!c) return;
    setDelTarget(c);
    setShowDelModal(true);
  };

  const handleWhatsApp = (c) => {
    let telefone = (c.telefone || '').replace(/\D/g, '');
    if (telefone && !telefone.startsWith('55')) telefone = `55${telefone}`;
    const text = encodeURIComponent('Olá, sou LuizCar! Tudo bem?');
    window.open(`https://wa.me/${telefone}?text=${text}`, '_blank');
  };

  const save = async () => {
    if (!form.nome || !form.telefone) {
      setError('Preencha nome e telefone obrigatórios');
      return;
    }
    setError('');
    const data = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      email: form.email?.trim() || null,
      cpf_cnpj: form.cpf?.trim() || null,
      endereco: form.endereco?.trim() || null,
      ativo: Number(form.ativo),
    };
    try {
      if (editTarget && editTarget.id) {
        await api.update('clientes', data, 'id = ?', [editTarget.id]);
      } else {
        await api.insert('clientes', { ...data, criado_em: new Date().toISOString().split('T')[0] });
      }
      setShowNewModal(false);
      setShowEditModal(false);
      setEditTarget(null);
      await load();
    } catch (e) {
      setError(e.message || 'Erro ao salvar');
    }
  };

  const remove = async () => {
    if (!delTarget || !delTarget.id) return;
    try {
      await api.delete('clientes', 'id = ?', [delTarget.id]);
      setShowDelModal(false);
      setDelTarget(null);
      await load();
    } catch (e) {
      console.error('Erro ao excluir:', e);
    }
  };

  const closeModals = () => {
    setShowNewModal(false);
    setShowEditModal(false);
    setShowDelModal(false);
    setEditTarget(null);
    setDelTarget(null);
    setError('');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-header-title">Clientes</div>
          <div className="page-header-subtitle">{filtered.length} cliente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} strokeWidth={2} /> Novo Cliente
        </button>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text" className="input-field"
            style={{ width: '100%', paddingLeft: '2.25rem', marginBottom: 0 }}
            placeholder="Buscar por nome, telefone, email ou CPF..."
            value={search} onChange={e => setSearch(e.target.value)} data-gramm="false"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} color="var(--color-text-muted)" />
          {['todos', 'ativo', 'inativo'].map(f => (
            <button key={f} onClick={() => setFilterStatus(f)} className="btn"
              style={{
                padding: '0.4rem 0.75rem', fontSize: '0.75rem',
                background: filterStatus === f ? 'var(--color-primary)' : 'transparent',
                color: filterStatus === f ? 'white' : 'var(--color-text-muted)',
                border: filterStatus === f ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><p>Carregando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={40} className="empty-state-icon" />
            <p style={{ fontSize: '0.875rem' }}>Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="table-container"><table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>CPF</th>
                <th>Cadastro</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const nome = c.nome || '';
                const telefone = c.telefone || '';
                const email = c.email || '';
                const cpf = c.cpf || '';
                const endereco = c.endereco || '';
                const criado_em = c.criado_em || '';
                const ativo = Boolean(c.ativo);
                const id = c.id;
                return (
                  <tr key={id ?? Math.random()}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: `hsl(${((id || 0) * 60) % 360}, 55%, 48%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 600, fontSize: '0.75rem'
                        }}>
                          {(nome || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>{nome}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{endereco}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem', fontSize: '0.8125rem' }}>
                        <Phone size={12} color="var(--color-text-muted)" /> {telefone}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <Mail size={12} /> {email}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{cpf}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{criado_em}</td>
                    <td>
                      <span className="badge" style={{
                        background: ativo ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                        color: ativo ? 'var(--color-success)' : 'var(--color-danger)',
                      }}>
                        {ativo ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleWhatsApp(c)} className="btn btn-ghost" style={{ padding: '0.35rem' }} title="WhatsApp">
                        <MessageSquare size={14} color="var(--color-success)" />
                      </button>
                      <button onClick={() => openEdit(c)} className="btn btn-ghost" style={{ padding: '0.35rem', marginRight: '2px' }} title="Editar">
                        <Edit2 size={14} color="var(--color-primary)" />
                      </button>
                      <button onClick={() => confirmDel(c)} className="btn btn-ghost" style={{ padding: '0.35rem' }} title="Excluir">
                        <Trash2 size={14} color="var(--color-danger)" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </div>

      <Modal title={editTarget ? 'Editar Cliente' : 'Novo Cliente'} show={showNewModal || showEditModal} onClose={closeModals}>
        {error && (
          <div style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <XCircle size={15} /> {error}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
            <label className="input-label">Nome Completo *</label>
            <input className="input-field" style={{ width: '100%' }} placeholder="Nome do cliente" data-gramm="false"
              value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">Telefone *</label>
            <input className="input-field" style={{ width: '100%' }} placeholder="(00) 00000-0000" data-gramm="false"
              value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">CPF</label>
            <input className="input-field" style={{ width: '100%' }} placeholder="000.000.000-00" data-gramm="false"
              value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
            <label className="input-label">E-mail</label>
            <input className="input-field" style={{ width: '100%' }} placeholder="email@exemplo.com" type="email" data-gramm="false"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
            <label className="input-label">Endereço</label>
            <input className="input-field" style={{ width: '100%' }} placeholder="Rua, número, bairro" data-gramm="false"
              value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
            <label className="input-label">Status</label>
            <select className="input-field" style={{ width: '100%' }}
              value={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: Number(e.target.value) }))}>
              <option value={1}>Ativo</option>
              <option value={0}>Inativo</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={closeModals}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>
            {editTarget ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </button>
        </div>
      </Modal>

      <Modal title="Confirmar Exclusão" show={showDelModal && !!delTarget} onClose={() => setShowDelModal(false)}>
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Trash2 size={22} color="var(--color-danger)" />
          </div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>Excluir Cliente?</h3>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            O cliente <strong style={{ color: 'var(--color-text-main)' }}>{(delTarget && delTarget.nome) || ''}</strong> será removido permanentemente.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setShowDelModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={remove} style={{ background: 'var(--color-danger)' }}>Sim, Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Clientes;