import React, { useCallback, useEffect, useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, X, Phone, Mail, User, CheckCircle, XCircle, Filter } from 'lucide-react';
import { api } from '../lib/api';

const emptyForm = { nome: '', telefone: '', email: '', cpf: '', endereco: '', ativo: 1 };

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState('todos');

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.query('SELECT * FROM clientes ORDER BY nome');
      const mapped = (res.rows || []).map(row => ({
        ...row,
        cpf: row.cpf_cnpj || ''
      }));
      setClientes(mapped);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = clientes.filter(c => {
    const matchSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefone.includes(searchTerm) || c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpf.includes(searchTerm);
    const matchStatus = filterStatus === 'todos' || (filterStatus === 'ativo' ? c.ativo : !c.ativo);
    return matchSearch && matchStatus;
  });

  const openNew = () => { setForm({ ...emptyForm }); setErrorMsg(''); setEditingId(null); setShowModal(true); };
  const openEdit = (c) => { setForm({ ...c }); setErrorMsg(''); setEditingId(c.id); setShowModal(true); };
  const confirmDelete = (c) => { setDeleteTarget(c); setShowDeleteModal(true); };

  const handleSave = async () => {
    if (!form.nome || !form.telefone) return;
    setErrorMsg('');
    const data = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      email: form.email?.trim() || null,
      cpf_cnpj: form.cpf?.trim() || null,
      endereco: form.endereco?.trim() || null,
      ativo: Number(form.ativo)
    };
    try {
      if (editingId) {
        await api.update('clientes', data, 'id = ?', [editingId]);
      } else {
        await api.insert('clientes', {
          ...data,
          criado_em: new Date().toISOString().split('T')[0]
        });
      }
      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      setErrorMsg(error.message || 'Erro ao salvar cliente. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete('clientes', 'id = ?', [deleteTarget.id]);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
    }
  };

  const fieldStyle = { width: '100%', marginBottom: '1rem' };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-header-title">Clientes</div>
          <div className="page-header-subtitle">{filtered.length} cliente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} strokeWidth={2} /> Novo Cliente
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input-field"
            style={{ width: '100%', paddingLeft: '2.25rem', marginBottom: 0 }}
            placeholder="Buscar por nome, telefone, email ou CPF..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} color="var(--color-text-muted)" />
          {['todos', 'ativo', 'inativo'].map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className="btn"
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
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

      {/* Tabela */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
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
              {loading ? (
                <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando...</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: `hsl(${(c.id * 60) % 360}, 55%, 48%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 600, fontSize: '0.75rem'
                      }}>
                        {c.nome.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>{c.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.endereco}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem', fontSize: '0.8125rem' }}>
                      <Phone size={12} color="var(--color-text-muted)" /> {c.telefone}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <Mail size={12} /> {c.email}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{c.cpf}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{c.criado_em}</td>
                  <td>
                    <span className="badge" style={{
                      background: c.ativo ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                      color: c.ativo ? 'var(--color-success)' : 'var(--color-danger)'
                    }}>
                      {c.ativo ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => openEdit(c)}
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem', marginRight: '2px' }}
                      title="Editar"
                    >
                      <Edit2 size={14} color="var(--color-primary)" />
                    </button>
                    <button
                      onClick={() => confirmDelete(c)}
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem' }}
                      title="Excluir"
                    >
                      <Trash2 size={14} color="var(--color-danger)" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <Modal title={editingId ? 'Editar Cliente' : 'Novo Cliente'} onClose={() => { setShowModal(false); setErrorMsg(''); }}>
          {errorMsg && (
            <div style={{
              background: 'rgba(220,38,38,0.08)', color: 'var(--color-danger)',
              padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem',
              marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <XCircle size={15} /> {errorMsg}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label className="input-label">Nome Completo *</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="Nome do cliente"
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div style={fieldStyle}>
              <label className="input-label">Telefone *</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="(00) 00000-0000"
                value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
            </div>
            <div style={fieldStyle}>
              <label className="input-label">CPF</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="000.000.000-00"
                value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} />
            </div>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label className="input-label">E-mail</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="email@exemplo.com" type="email"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label className="input-label">Endereço</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="Rua, número, bairro"
                value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} />
            </div>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label className="input-label">Status</label>
              <select className="input-field" style={{ width: '100%' }}
                value={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: Number(e.target.value) }))}>
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => { setShowModal(false); setErrorMsg(''); }}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Confirmação Delete */}
      {showDeleteModal && deleteTarget && (
        <Modal title="Confirmar Exclusão" onClose={() => setShowDeleteModal(false)}>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'rgba(220,38,38,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
            }}>
              <Trash2 size={22} color="var(--color-danger)" />
            </div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>Excluir Cliente?</h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              O cliente <strong style={{ color: 'var(--color-text-main)' }}>{deleteTarget.nome}</strong> será removido permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleDelete}
                style={{ background: 'var(--color-danger)' }}>
                Sim, Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Clientes;
