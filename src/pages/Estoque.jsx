import React, { useCallback, useEffect, useState } from 'react';
import { Package, Plus, Search, Edit2, Trash2, X, AlertTriangle, DollarSign, Archive } from 'lucide-react';
import { api } from '../lib/api';

const emptyForm = { nome: '', quantidade: 0, estoque_minimo: 5, preco_custo: 0, preco_venda: 0 };

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

const Estoque = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [pecas, setPecas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.query('SELECT * FROM estoque ORDER BY nome');
      setPecas(res.rows || []);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = pecas.filter(p => (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const totalItens = pecas.reduce((acc, item) => acc + Number(item.quantidade), 0);
  const baixoEstoque = pecas.filter(p => Number(p.quantidade) <= Number(p.estoque_minimo)).length;
  const valorEstoqueCusto = pecas.reduce((acc, item) => acc + (Number(item.quantidade) * Number(item.preco_custo)), 0);
  const valorEstoqueVenda = pecas.reduce((acc, item) => acc + (Number(item.quantidade) * Number(item.preco_venda)), 0);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditingId(p.id); setShowModal(true); };
  const confirmDelete = (p) => { setDeleteTarget(p); setShowDeleteModal(true); };

  const handleSave = async () => {
    if (!form.nome) return;
    const data = {
      nome: form.nome,
      descricao: form.descricao || null,
      quantidade: Number(form.quantidade) || 0,
      estoque_minimo: Number(form.estoque_minimo) || 5,
      preco_custo: Number(form.preco_custo) || 0,
      preco_venda: Number(form.preco_venda) || 0,
      ativo: 1
    };
    try {
      if (editingId) {
        await api.update('estoque', data, 'id = ?', [editingId]);
      } else {
        await api.insert('estoque', {
          ...data,
          criado_em: new Date().toISOString().split('T')[0]
        });
      }
      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar item no estoque:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete('estoque', 'id = ?', [deleteTarget.id]);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir item do estoque:', error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-header-title">Controle de Estoque</div>
          <div className="page-header-subtitle">Gerencie peças, suprimentos e custos de reposição.</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Cadastrar Peça
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--color-secondary)' }}>
            <Package size={20} strokeWidth={1.8} />
          </div>
          <div>
            <div className="kpi-label">Total de Unidades</div>
            <div className="kpi-value">{totalItens}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: baixoEstoque > 0 ? 'rgba(220,38,38,0.08)' : 'rgba(5,150,105,0.08)', color: baixoEstoque > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            <AlertTriangle size={20} strokeWidth={1.8} />
          </div>
          <div>
            <div className="kpi-label">Abaixo do Mínimo</div>
            <div className="kpi-value" style={{ color: baixoEstoque > 0 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>{baixoEstoque}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(5,150,105,0.08)', color: 'var(--color-success)' }}>
            <DollarSign size={20} strokeWidth={1.8} />
          </div>
          <div>
            <div className="kpi-label">Patrimônio (Custo)</div>
            <div className="kpi-value">R$ {valorEstoqueCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(2,132,199,0.08)', color: 'var(--color-info)' }}>
            <Archive size={20} strokeWidth={1.8} />
          </div>
          <div>
            <div className="kpi-label">Faturamento Potencial</div>
            <div className="kpi-value">R$ {valorEstoqueVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="input-field" style={{ width: '100%', paddingLeft: '2.25rem', marginBottom: 0 }}
            placeholder="Buscar peças pelo nome..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-container"><table style={{ minWidth: '700px' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Peça / Suprimento</th>
              <th style={{ textAlign: 'center' }}>Qtd</th>
              <th style={{ textAlign: 'center' }}>Mín</th>
              <th style={{ textAlign: 'right' }}>Preço Custo</th>
              <th style={{ textAlign: 'right' }}>Preço Venda</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando...</td></tr>
            ) : filtered.map(p => {
              const isAlert = Number(p.quantidade) <= Number(p.estoque_minimo);
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>#{p.id}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{p.nome}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: isAlert ? 'var(--color-danger)' : 'var(--color-success)' }}>{p.quantidade}</td>
                  <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{p.estoque_minimo}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.8125rem' }}>R$ {Number(p.preco_custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 500, fontSize: '0.8125rem' }}>R$ {Number(p.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge" style={{
                      background: isAlert ? 'rgba(220,38,38,0.08)' : 'rgba(5,150,105,0.08)',
                      color: isAlert ? 'var(--color-danger)' : 'var(--color-success)'
                    }}>
                      {isAlert ? 'Repor' : 'Estável'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ padding: '0.35rem', marginRight: '2px' }} onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: '0.35rem', color: 'var(--color-danger)' }} onClick={() => confirmDelete(p)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhuma peça encontrada.</td></tr>
            )}
          </tbody>
        </table></div>
      </div>

      {showModal && (
        <Modal title={editingId ? 'Editar Peça' : 'Cadastrar Peça'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Descrição da Peça *</label>
              <input type="text" className="input-field" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Pastilha de freio dianteira Bosch" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Quantidade *</label>
                <input type="number" className="input-field" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: Number(e.target.value) })} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Estoque Mínimo *</label>
                <input type="number" className="input-field" value={form.estoque_minimo} onChange={e => setForm({ ...form, estoque_minimo: Number(e.target.value) })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Preço Custo (R$) *</label>
                <input type="number" step="0.01" className="input-field" value={form.preco_custo} onChange={e => setForm({ ...form, preco_custo: Number(e.target.value) })} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Preço Venda (R$) *</label>
                <input type="number" step="0.01" className="input-field" value={form.preco_venda} onChange={e => setForm({ ...form, preco_venda: Number(e.target.value) })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.nome}>Salvar</button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal title="Excluir Peça" onClose={() => setShowDeleteModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem' }}>Tem certeza de que deseja excluir a peça <strong>{deleteTarget?.nome}</strong>?</p>
            <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>Esta operação não poderá ser desfeita.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ background: 'var(--color-danger)' }} onClick={handleDelete}>Confirmar Exclusão</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Estoque;
