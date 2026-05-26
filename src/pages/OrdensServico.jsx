import React, { useCallback, useEffect, useState } from 'react';
import { Wrench, Plus, Search, Edit2, Trash2, Eye, Calendar, MessageSquare, X, Printer, Filter } from 'lucide-react';
import { api } from '../lib/api';

const statusOptions = ['Orçamento', 'Aberta', 'Em andamento', 'Aguardando Peça', 'Concluída', 'Cancelada'];

const emptyForm = {
  cliente_id: '', veiculo_id: '', mecanico_id: '', descricao_problema: '', servicos_executados: '',
  mao_de_obra: 0, pecas_custo: 0, comissao_percentual: 10, status: 'Orçamento',
  data_entrada: new Date().toISOString().split('T')[0]
};

const statusConfig = {
  'Orçamento': { bg: 'rgba(37,99,235,0.08)', text: '#2563eb', label: 'Orçamento' },
  'Aberta': { bg: 'rgba(2,132,199,0.08)', text: '#0284c7', label: 'Aberta' },
  'Em andamento': { bg: 'rgba(217,119,6,0.08)', text: '#d97706', label: 'Em andamento' },
  'Aguardando Peça': { bg: 'rgba(234,88,12,0.08)', text: '#ea580c', label: 'Aguardando Peça' },
  'Concluída': { bg: 'rgba(5,150,105,0.08)', text: '#059669', label: 'Concluída' },
  'Cancelada': { bg: 'rgba(220,38,38,0.08)', text: '#dc2626', label: 'Cancelada' },
};

const Modal = ({ title, onClose, children, show, maxWidth = '600px' }) => (
  <div className="modal-overlay" style={{ display: show ? 'flex' : 'none' }} onClick={onClose}>
    <div className="modal-content" style={{ maxWidth }} onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const OrdensServico = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [company, setCompany] = useState({ nome: 'REDE LOPES', telefone: '', email: '', cnpj: '', endereco: '' });
  const [loading, setLoading] = useState(true);

  const vehicleLabel = (os) => `${os.marca || ''} ${os.modelo || ''}${os.placa ? ` (${os.placa})` : ''}`.trim();
  const selectedVehicleLabel = (veiculo) => `${veiculo.marca || ''} ${veiculo.modelo || ''}${veiculo.placa ? ` (${veiculo.placa})` : ''}`.trim();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [osResult, clientesResult, veiculosResult, mecanicosResult] = await Promise.all([
        api.query(`SELECT os.id, os.data_entrada, os.status, os.mao_de_obra, os.pecas_custo, os.total, os.descricao_problema, os.servicos_executados, os.comissao_percentual, os.cliente_id, os.veiculo_id, os.mecanico_id, c.nome as cliente_nome, c.telefone as cliente_telefone, v.marca, v.modelo, v.placa, u.nome as mecanico_nome FROM ordens_servico os LEFT JOIN clientes c ON os.cliente_id = c.id LEFT JOIN veiculos v ON os.veiculo_id = v.id LEFT JOIN usuarios u ON os.mecanico_id = u.id ORDER BY os.id DESC`),
        api.query('SELECT id, nome FROM clientes ORDER BY nome'),
        api.query('SELECT id, marca, modelo, placa FROM veiculos ORDER BY marca, modelo'),
        api.query("SELECT id, nome FROM usuarios WHERE nivel_acesso = 'Mecanico' OR nivel_acesso = 'Admin' ORDER BY nome")
      ]);

      setOrdens(osResult.rows || []);
      setClientes(clientesResult.rows || []);
      setVeiculos(veiculosResult.rows || []);
      setMecanicos(mecanicosResult.rows || []);

      try {
        const configRes = await api.query('SELECT chave, valor FROM configuracoes');
        const cfg = {};
        (configRes.rows || []).forEach(r => { cfg[r.chave] = r.valor; });
        const endereco = [cfg.logradouro, cfg.numero, cfg.complemento, cfg.bairro, cfg.cidade, cfg.uf].filter(Boolean).join(', ');
        setCompany({
          nome: cfg.razao_social || cfg.nome_fantasia || 'REDE LOPES',
          telefone: cfg.telefone || '',
          email: cfg.email || '',
          cnpj: cfg.cnpj || '',
          endereco
        });
      } catch (error) {
        setCompany({ nome: 'REDE LOPES', telefone: '', email: '', cnpj: '', endereco: '' });
      }
    } catch (error) {
      console.error('Erro ao buscar ordens de serviço:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = ordens.filter(os => {
    const veiculo = vehicleLabel(os);
    const matchSearch = os.id.toString().includes(searchTerm) ||
      (os.cliente_nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      veiculo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'todos' || os.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };

  const openEdit = (os) => {
    setForm({
      cliente_id: os.cliente_id || '', veiculo_id: os.veiculo_id || '', mecanico_id: os.mecanico_id || '',
      descricao_problema: os.descricao_problema || '', servicos_executados: os.servicos_executados || '',
      mao_de_obra: Number(os.mao_de_obra || 0), pecas_custo: Number(os.pecas_custo || 0),
      comissao_percentual: Number(os.comissao_percentual || 10), status: os.status || 'Orçamento',
      data_entrada: os.data_entrada || new Date().toISOString().split('T')[0]
    });
    setEditingId(os.id); setShowModal(true);
  };

  const openView = (os) => { setViewTarget(os); setShowViewModal(true); };
  const confirmDelete = (os) => { setDeleteTarget(os); setShowDeleteModal(true); };

  const handleSave = async () => {
    const total = Number(form.mao_de_obra) + Number(form.pecas_custo);
    const args = [
      form.cliente_id || null, form.veiculo_id || null, form.mecanico_id || null,
      form.data_entrada, form.status, form.descricao_problema, form.servicos_executados,
      Number(form.mao_de_obra), Number(form.pecas_custo), total, Number(form.comissao_percentual)
    ];
    try {
      if (editingId) {
        await api.execute({
          sql: 'UPDATE ordens_servico SET cliente_id = ?, veiculo_id = ?, mecanico_id = ?, data_entrada = ?, status = ?, descricao_problema = ?, servicos_executados = ?, mao_de_obra = ?, pecas_custo = ?, total = ?, comissao_percentual = ? WHERE id = ?',
          args: [...args, editingId]
        });
      } else {
        await api.execute({
          sql: 'INSERT INTO ordens_servico (cliente_id, veiculo_id, mecanico_id, data_entrada, status, descricao_problema, servicos_executados, mao_de_obra, pecas_custo, total, comissao_percentual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args
        });
      }
      setShowModal(false); await fetchData();
    } catch (error) { console.error('Erro ao salvar ordem de serviço:', error); }
  };

  const handleDelete = async () => {
    try {
      await api.execute({ sql: 'DELETE FROM ordens_servico WHERE id = ?', args: [deleteTarget.id] });
      setShowDeleteModal(false); setDeleteTarget(null); await fetchData();
    } catch (error) { console.error('Erro ao excluir ordem de serviço:', error); }
  };

  const handleWhatsApp = (os) => {
    let telefone = (os.cliente_telefone || '').replace(/\D/g, '');
    if (telefone && !telefone.startsWith('55')) telefone = `55${telefone}`;
    const text = encodeURIComponent(`Olá ${os.cliente_nome || ''}! Sobre a sua Ordem de Serviço #${os.id} referente ao ${vehicleLabel(os)}, o status atual é: *${os.status}*. O valor total estimado é R$ ${(Number(os.mao_de_obra) + Number(os.pecas_custo)).toFixed(2)}.`);
    window.open(`https://wa.me/${telefone}?text=${text}`, '_blank');
  };

  const handlePrint = () => { window.print(); };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-header-title">Ordens de Serviço</div>
          <div className="page-header-subtitle">Gerencie os orçamentos, aprovações, andamento de manutenções e faturamento.</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Novo Orçamento
        </button>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="input-field" style={{ width: '100%', paddingLeft: '2.25rem', marginBottom: 0 }}
            placeholder="Buscar por número da OS, cliente ou veículo..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} color="var(--color-text-muted)" />
          <select className="input-field" style={{ marginBottom: 0, padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="todos">Todos os status</option>
            {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-container"><table style={{ minWidth: '900px' }}>
          <thead>
            <tr>
              <th>O.S. #</th>
              <th>Cliente / Veículo</th>
              <th>Data Entrada</th>
              <th>Mecânico</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando...</td></tr>
            ) : filtered.map((os) => {
              const totalVal = Number(os.total || os.mao_de_obra || 0) + (os.total ? 0 : Number(os.pecas_custo || 0));
              const cfg = statusConfig[os.status] || statusConfig['Orçamento'];
              return (
                <tr key={os.id}>
                  <td style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>#{os.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--color-bg-base)', border: '1px solid var(--color-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Wrench size={14} color="var(--color-text-muted)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>{os.cliente_nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{vehicleLabel(os)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                      <Calendar size={13} color="var(--color-text-muted)" />
                      {new Date(os.data_entrada).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{os.mecanico_nome}</td>
                  <td>
                    <span className="badge" style={{ background: cfg.bg, color: cfg.text }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, textAlign: 'right', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>
                    R$ {totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ padding: '0.35rem' }} title="Visualizar" onClick={() => openView(os)}><Eye size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: '0.35rem' }} title="WhatsApp" onClick={() => handleWhatsApp(os)}><MessageSquare size={14} color="var(--color-success)" /></button>
                    <button className="btn btn-ghost" style={{ padding: '0.35rem' }} title="Editar" onClick={() => openEdit(os)}><Edit2 size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: '0.35rem', color: 'var(--color-danger)' }} title="Excluir" onClick={() => confirmDelete(os)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhuma ordem de serviço localizada.</td></tr>
            )}
          </tbody>
        </table></div>
      </div>

      {/* Modals */}
        <Modal show={showModal} title={editingId ? `Editar Orçamento #${editingId}` : 'Criar Novo Orçamento'} onClose={() => setShowModal(false)} maxWidth="720px">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 0.75rem' }}>
            <div style={{ gridColumn: '1 / 3', marginBottom: '0.75rem' }}>
              <label className="input-label">Cliente *</label>
              <select className="input-field" style={{ width: '100%' }} value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '3 / 5', marginBottom: '0.75rem' }}>
              <label className="input-label">Veículo *</label>
              <select className="input-field" style={{ width: '100%' }} value={form.veiculo_id} onChange={e => setForm({ ...form, veiculo_id: e.target.value })}>
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{selectedVehicleLabel(v)}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / 2', marginBottom: '0.75rem' }}>
              <label className="input-label">Data Entrada *</label>
              <input type="date" className="input-field" style={{ width: '100%' }} value={form.data_entrada} onChange={e => setForm({ ...form, data_entrada: e.target.value })} />
            </div>
            <div style={{ gridColumn: '2 / 4', marginBottom: '0.75rem' }}>
              <label className="input-label">Mecânico Responsável</label>
              <select className="input-field" style={{ width: '100%' }} value={form.mecanico_id} onChange={e => setForm({ ...form, mecanico_id: e.target.value })}>
                <option value="">Selecione...</option>
                {mecanicos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '4 / 5', marginBottom: '0.75rem' }}>
              <label className="input-label">Status *</label>
              <select className="input-field" style={{ width: '100%' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / 3', marginBottom: '0.75rem' }}>
              <label className="input-label">Mão de Obra (R$)</label>
              <input type="number" className="input-field" style={{ width: '100%' }} value={form.mao_de_obra} onChange={e => setForm({ ...form, mao_de_obra: Number(e.target.value) })} />
            </div>
            <div style={{ gridColumn: '3 / 4', marginBottom: '0.75rem' }}>
              <label className="input-label">Preço Peças (R$)</label>
              <input type="number" className="input-field" style={{ width: '100%' }} value={form.pecas_custo} onChange={e => setForm({ ...form, pecas_custo: Number(e.target.value) })} />
            </div>
            <div style={{ gridColumn: '4 / 5', marginBottom: '0.75rem' }}>
              <label className="input-label">Comissão (%)</label>
              <input type="number" className="input-field" style={{ width: '100%' }} value={form.comissao_percentual} onChange={e => setForm({ ...form, comissao_percentual: Number(e.target.value) })} />
            </div>
            <div style={{ gridColumn: '1 / 5', marginBottom: '0.75rem' }}>
              <label className="input-label">Descrição do Problema / Diagnóstico</label>
              <textarea className="input-field" style={{ width: '100%', height: '52px', resize: 'none', fontFamily: 'inherit' }}
                value={form.descricao_problema} onChange={e => setForm({ ...form, descricao_problema: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / 5', marginBottom: '0.75rem' }}>
              <label className="input-label">Serviços Executados</label>
              <textarea className="input-field" style={{ width: '100%', height: '52px', resize: 'none', fontFamily: 'inherit' }}
                value={form.servicos_executados} onChange={e => setForm({ ...form, servicos_executados: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>Confirmar e Salvar</button>
          </div>
        </Modal>

        <Modal show={showViewModal} title={`Detalhamento da Ordem de Serviço #${viewTarget?.id || ''}`} onClose={() => setShowViewModal(false)} maxWidth="700px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--color-text-main)' }} className="print-area">
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{company.nome}</h2>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                  {company.cnpj && <span>CNPJ: {company.cnpj}<br /></span>}
                  {company.endereco && <span>{company.endereco}<br /></span>}
                  Tel: {company.telefone || '-'} | {company.email || '-'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comprovante de OS</h3>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--color-primary)' }}>#{viewTarget.id}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'var(--color-bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Cliente</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: '2px' }}>{viewTarget.cliente_nome}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Data de Abertura: {new Date(viewTarget.data_entrada).toLocaleDateString('pt-BR')}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Veículo</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: '2px' }}>{vehicleLabel(viewTarget)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Técnico: {viewTarget.mecanico_nome}</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>Diagnóstico / Descrição</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>{viewTarget.descricao_problema || 'Nenhum diagnóstico detalhado registrado.'}</p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>Serviços Executados</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>{viewTarget.servicos_executados || 'Sem observações adicionais.'}</p>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>Resumo de Custos</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--color-bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Mão de Obra / Serviços</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>R$ {Number(viewTarget.mao_de_obra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Peças de Reposição</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>R$ {Number(viewTarget.pecas_custo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontWeight: 700 }}>Total Estimado</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--color-success)', fontFamily: 'monospace' }}>
                    R$ {Number(viewTarget.total || (Number(viewTarget.mao_de_obra || 0) + Number(viewTarget.pecas_custo || 0))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '2rem', borderTop: '1px dashed var(--color-border)', paddingTop: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '80%', borderBottom: '1px solid var(--color-border)', margin: '0 auto 0.5rem' }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Assinatura do Técnico</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '80%', borderBottom: '1px solid var(--color-border)', margin: '0 auto 0.5rem' }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Assinatura do Cliente</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }} className="no-print">
              <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handlePrint}>
                <Printer size={14} /> Imprimir
              </button>
              <button className="btn btn-primary" onClick={() => setShowViewModal(false)}>Fechar</button>
            </div>
          </div>
        </Modal>

        <Modal show={showDeleteModal} title="Confirmar Exclusão" onClose={() => setShowDeleteModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem' }}>Tem certeza de que deseja excluir permanentemente a Ordem de Serviço <strong>#{deleteTarget?.id}</strong>?</p>
            <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>Esta ação é permanente e os dados financeiros associados serão perdidos.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ background: 'var(--color-danger)' }} onClick={handleDelete}>Excluir Definitivamente</button>
            </div>
          </div>
        </Modal>
    </div>
  );
};

export default OrdensServico;
