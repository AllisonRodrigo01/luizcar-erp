import React, { useState } from 'react';
import { Car, Plus, Search, Edit2, Trash2, X, User } from 'lucide-react';

const emptyForm = { placa: '', marca: '', modelo: '', ano: new Date().getFullYear(), cor: '', cliente: '', quilometragem: '', combustivel: 'Flex', observacoes: '' };

const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
  }} onClick={onClose}>
    <div className="glass-panel" style={{
      width: '100%', maxWidth: '620px',
      boxShadow: 'var(--shadow-xl)', animation: 'fadeIn 0.2s ease'
    }} onClick={e => e.stopPropagation()}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)'
      }}>
        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: '1.5rem' }}>{children}</div>
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

  const [clientes] = useState(['João Silva', 'Maria Oliveira', 'Carlos Santos', 'Ana Paula Costa']);

  const [veiculos, setVeiculos] = useState([
    { id: 1, placa: 'ABC-1234', marca: 'Honda', modelo: 'Civic', ano: 2020, cliente: 'João Silva', cor: 'Prata', quilometragem: '45.000', combustivel: 'Flex', observacoes: '' },
    { id: 2, placa: 'XYZ-9876', marca: 'Toyota', modelo: 'Corolla', ano: 2022, cliente: 'Maria Oliveira', cor: 'Preto', quilometragem: '22.000', combustivel: 'Flex', observacoes: '' },
    { id: 3, placa: 'DEF-5678', marca: 'Volkswagen', modelo: 'Gol', ano: 2018, cliente: 'Carlos Santos', cor: 'Branco', quilometragem: '91.500', combustivel: 'Gasolina', observacoes: 'Motor barulhando' },
    { id: 4, placa: 'GHI-1122', marca: 'Fiat', modelo: 'Strada', ano: 2023, cliente: 'Ana Paula Costa', cor: 'Vermelho', quilometragem: '8.000', combustivel: 'Flex', observacoes: '' },
  ]);

  const filtered = veiculos.filter(v =>
    v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (v) => { setForm({ ...v }); setEditingId(v.id); setShowModal(true); };
  const confirmDelete = (v) => { setDeleteTarget(v); setShowDeleteModal(true); };

  const handleSave = () => {
    if (!form.placa || !form.marca || !form.modelo) return;
    if (editingId) {
      setVeiculos(prev => prev.map(v => v.id === editingId ? { ...v, ...form } : v));
    } else {
      const newId = Math.max(...veiculos.map(v => v.id)) + 1;
      setVeiculos(prev => [...prev, { ...form, id: newId }]);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    setVeiculos(prev => prev.filter(v => v.id !== deleteTarget.id));
    setShowDeleteModal(false);
    setDeleteTarget(null);
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
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Car size={40} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
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
                  <span>{v.cliente}</span>
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
      {showModal && (
        <Modal title={editingId ? 'Editar Veículo' : 'Novo Veículo'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 0.75rem' }}>
            <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
              <label className="input-label">Placa *</label>
              <input className="input-field" style={{ width: '100%', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px' }}
                placeholder="ABC-1234" value={form.placa}
                onChange={e => setForm(p => ({ ...p, placa: e.target.value.toUpperCase() }))} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Marca *</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="Honda..."
                value={form.marca} onChange={e => setForm(p => ({ ...p, marca: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Modelo *</label>
              <input className="input-field" style={{ width: '100%' }} placeholder="Civic..."
                value={form.modelo} onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Ano</label>
              <input className="input-field" style={{ width: '100%' }} type="number" min="1990" max="2030"
                value={form.ano} onChange={e => setForm(p => ({ ...p, ano: e.target.value }))} />
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
                value={form.quilometragem} onChange={e => setForm(p => ({ ...p, quilometragem: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
              <label className="input-label">Proprietário / Cliente</label>
              <select className="input-field" style={{ width: '100%' }}
                value={form.cliente} onChange={e => setForm(p => ({ ...p, cliente: e.target.value }))}>
                <option value="">Selecione o cliente...</option>
                {clientes.map(c => <option key={c}>{c}</option>)}
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
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>Excluir Veículo?</h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              O veículo <strong style={{ color: 'var(--color-text-main)' }}>{deleteTarget.marca} {deleteTarget.modelo} ({deleteTarget.placa})</strong> será removido permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleDelete} style={{ background: 'var(--color-danger)' }}>Sim, Excluir</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Veiculos;
