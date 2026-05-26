import React, { useCallback, useEffect, useState } from 'react';
import { Car, Plus, Search, Edit2, Trash2, X, User } from 'lucide-react';
import { api } from '../lib/api';

const emptyForm = { placa: '', marca: '', modelo: '', ano: new Date().getFullYear(), cor: '', cliente: '', quilometragem: '', combustivel: 'Flex', observacoes: '' };

const Modal = ({ title, onClose, children, show }) => (
  <div className="modal-overlay" style={{ display: show ? 'flex' : 'none' }} onClick={onClose}>
    <div className="modal-content" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const corOptions = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Verde', 'Amarelo', 'Marrom', 'Bege', 'Laranja', 'Outro'];
const combustivelOptions = ['Flex', 'Gasolina', 'Etanol', 'Diesel', 'GNV', 'Elétrico', 'Híbrido'];

const marcaColors = { Honda: '#e22', Toyota: '#c00', Volkswagen: '#06c', Ford: '#039', Chevrolet: '#c60', Hyundai: '#039', Fiat: '#900', Renault: '#f50', Nissan: '#c00', Mitsubishi: '#a00' };

const Veiculos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [veiculosRes, clientesRes] = await Promise.all([
        api.query('SELECT v.*, c.nome as cliente_nome FROM veiculos v LEFT JOIN clientes c ON v.cliente_id = c.id ORDER BY v.placa'),
        api.query('SELECT id, nome FROM clientes ORDER BY nome')
      ]);
      setVeiculos(veiculosRes.rows || []);
      setClientes(clientesRes.rows || []);
    } catch (error) {
      console.error('Erro ao carregar veículos/clientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = veiculos.filter(v => {
    const placa = v.placa || '';
    const modelo = v.modelo || '';
    const marca = v.marca || '';
    const cliente = v.cliente_nome || '';
    return placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (v) => { setForm({ ...v }); setEditingId(v.id); setShowModal(true); };
  const confirmDelete = (v) => { setDeleteTarget(v); setShowDeleteModal(true); };

  const handleSave = async () => {
    if (!form.placa || !form.marca || !form.modelo) return;
    const data = {
      placa: form.placa.toUpperCase(),
      marca: form.marca,
      modelo: form.modelo,
      ano: Number(form.ano) || null,
      cor: form.cor || null,
      cliente_id: Number(form.cliente_id) || null
    };
    try {
      if (editingId) {
        await api.update('veiculos', data, 'id = ?', [editingId]);
      } else {
        await api.insert('veiculos', {
          ...data,
          criado_em: new Date().toISOString().split('T')[0]
        });
      }
      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete('veiculos', 'id = ?', [deleteTarget.id]);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir veículo:', error);
    }
  };

  const f = { marginBottom: '1rem' };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-header-title">Veículos</div>
          <div className="page-header-subtitle">{filtered.length} veículo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Novo Veículo
        </button>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="input-field" style={{ width: '100%', paddingLeft: '2.25rem', marginBottom: 0 }}
            placeholder="Buscar por placa, modelo, marca ou cliente..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} data-gramm="false" />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel empty-state" style={{ padding: '3rem' }}>
          <Car size={40} className="empty-state-icon" />
          <p style={{ fontSize: '0.875rem' }}>Nenhum veículo encontrado.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filtered.map(v => (
            <div key={v.id} className="glass-panel" style={{
              padding: '1.25rem', position: 'relative', overflow: 'hidden',
              transition: 'box-shadow 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: marcaColors[v.marca] || 'var(--color-primary)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem',
                      background: 'var(--color-bg-base)', padding: '0.2rem 0.5rem',
                      borderRadius: '4px', border: '1px solid var(--color-border)', letterSpacing: '1px',
                      color: 'var(--color-text-main)'
                    }}>{v.placa}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-main)' }}>{v.marca} {v.modelo}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{v.ano} · {v.cor} · {v.combustivel}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.15rem' }}>
                  <button onClick={() => openEdit(v)} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
                    <Edit2 size={14} color="var(--color-primary)" />
                  </button>
                  <button onClick={() => confirmDelete(v)} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
                    <Trash2 size={14} color="var(--color-danger)" />
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  <User size={12} color="var(--color-text-muted)" />
                  <span>{v.cliente_nome || 'Sem proprietário'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {v.quilometragem ? `${v.quilometragem} km` : '—'}
                </div>
              </div>
              {v.observacoes && (
                <div style={{
                  marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-warning)',
                  background: 'rgba(217, 119, 6, 0.06)', padding: '0.35rem 0.6rem', borderRadius: '4px'
                }}>
                  {v.observacoes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
        <Modal show={showModal} title={editingId ? 'Editar Veículo' : 'Novo Veículo'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 0.75rem' }}>
            <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
              <label className="input-label">Placa *</label>
              <input className="input-field" style={{ width: '100%', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px' }}
                placeholder="ABC-1234" value={form.placa}
                onChange={e => setForm(p => ({ ...p, placa: e.target.value.toUpperCase() }))} data-gramm="false" />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Marca *</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="Honda..."
                value={form.marca} onChange={e => setForm(p => ({ ...p, marca: e.target.value }))} data-gramm="false" />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Modelo *</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="Civic..."
                value={form.modelo} onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))} data-gramm="false" />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Ano</label>
              <input className="input-field" style={{ width: '100%' }} type="number" min="1990" max="2030"
                value={form.ano} onChange={e => setForm(p => ({ ...p, ano: e.target.value }))} data-gramm="false" />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Cor</label>
              <select className="input-field" style={{ width: '100%' }}
                value={form.cor} onChange={e => setForm(p => ({ ...p, cor: e.target.value }))}>
                <option value="">Selecione...</option>
                {corOptions.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Combustível</label>
              <select className="input-field" style={{ width: '100%' }}
                value={form.combustivel} onChange={e => setForm(p => ({ ...p, combustivel: e.target.value }))}>
                {combustivelOptions.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Quilometragem</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="45.000"
                value={form.quilometragem} onChange={e => setForm(p => ({ ...p, quilometragem: e.target.value }))} data-gramm="false" />
            </div>
            <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
              <label className="input-label">Proprietário / Cliente</label>
              <select className="input-field" style={{ width: '100%' }}
                value={form.cliente_id} onChange={e => setForm(p => ({ ...p, cliente_id: e.target.value }))}>
                <option value="">Selecione o cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
              <label className="input-label">Observações</label>
              <textarea className="input-field" style={{ width: '100%', minHeight: '60px', resize: 'none' }}
                placeholder="Problemas relatados, observações..."
                value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editingId ? 'Salvar Alterações' : 'Cadastrar Veículo'}
            </button>
          </div>
        </Modal>

        <Modal show={showDeleteModal} title="Confirmar Exclusão" onClose={() => setShowDeleteModal(false)}>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'rgba(220,38,38,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
            }}>
              <Trash2 size={22} color="var(--color-danger)" />
            </div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>Excluir Veículo?</h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              O veículo <strong style={{ color: 'var(--color-text-main)' }}>{deleteTarget?.marca || ''} {deleteTarget?.modelo || ''} ({deleteTarget?.placa || ''})</strong> será removido permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleDelete} style={{ background: 'var(--color-danger)' }}>Sim, Excluir</button>
            </div>
          </div>
        </Modal>
    </div>
  );
};

export default Veiculos;
