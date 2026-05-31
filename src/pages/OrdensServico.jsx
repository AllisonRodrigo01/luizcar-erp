import React, { useCallback, useEffect, useState } from 'react';
import { Wrench, Plus, Search, Edit2, Trash2, Eye, Calendar, MessageSquare, X, Printer, Filter } from 'lucide-react';
import { api } from '../lib/api';

const statusOptions = ['Orçamento', 'Aberta', 'Em Andamento', 'Aguardando Peça', 'Concluída', 'Cancelada'];

const emptyForm = {
  cliente_id: '', veiculo_id: '', mecanico_id: '', descricao_problema: '', servicos_executados: '',
  mao_de_obra: 0, pecas_custo: 0, status: 'Orçamento',
  data_entrada: new Date().toISOString().split('T')[0]
};

const statusConfig = {
  'Orçamento': { bg: 'rgba(29,78,216,0.08)', text: '#1d4ed8', label: 'Orçamento' },
  'Aberta': { bg: 'rgba(14,165,233,0.08)', text: '#0ea5e9', label: 'Aberta' },
  'Em Andamento': { bg: 'rgba(217,119,6,0.08)', text: '#d97706', label: 'Em Andamento' },
  'Aguardando Peça': { bg: 'rgba(234,88,12,0.08)', text: '#ea580c', label: 'Aguardando Peça' },
  'Concluída': { bg: 'rgba(22,163,74,0.08)', text: '#16a34a', label: 'Concluída' },
  'Cancelada': { bg: 'rgba(239,68,68,0.08)', text: '#ef4444', label: 'Cancelada' },
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

const fmtBRL = (v) => {
  if (v === null || v === undefined || v === '') return '';
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const CurrencyInput = ({ value, onChange, style }) => {
  const [focused, setFocused] = useState(false);
  const display = focused ? fmtBRL(value) : fmtBRL(value);
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    onChange(parseInt(digits || '0') / 100);
  };
  return (
    <div style={{ position: 'relative', ...style }}>
      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8125rem', color: 'var(--color-text-muted)', pointerEvents: 'none', zIndex: 1 }}>R$</span>
      <input type="text" className="input-field" inputMode="numeric"
        style={{ width: '100%', paddingLeft: '2.25rem', marginBottom: 0 }}
        value={display} onChange={handleChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        data-gramm="false"
      />
    </div>
  );
};

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
  const [company, setCompany] = useState({ nome: 'Luiz Car Oficina Automotiva', telefone: '(11) 99999-9999', email: 'contato@luizcar.com.br', cnpj: '00.000.000/0001-00', endereco: 'Rua Exemplo, 123 - Centro, São Paulo - SP', observacao_pdf: '' });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [observacaoText, setObservacaoText] = useState('');

  const vehicleLabel = (os) => `${os.marca || ''} ${os.modelo || ''}${os.placa ? ` (${os.placa})` : ''}`.trim();
  const selectedVehicleLabel = (veiculo) => `${veiculo.marca || ''} ${veiculo.modelo || ''}${veiculo.placa ? ` (${veiculo.placa})` : ''}`.trim();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [osResult, clientesResult, veiculosResult, mecanicosResult] = await Promise.all([
        api.query(`SELECT os.id, os.data_entrada, os.status, os.mao_de_obra, os.pecas_custo, os.total, os.descricao_problema, os.servicos_executados, os.observacao, os.cliente_id, os.veiculo_id, os.mecanico_id, c.nome as cliente_nome, c.telefone as cliente_telefone, v.marca, v.modelo, v.placa, u.nome as mecanico_nome FROM ordens_servico os LEFT JOIN clientes c ON os.cliente_id = c.id LEFT JOIN veiculos v ON os.veiculo_id = v.id LEFT JOIN usuarios u ON os.mecanico_id = u.id ORDER BY os.id DESC`),
        api.query('SELECT id, nome FROM clientes ORDER BY nome'),
        api.query('SELECT id, cliente_id, marca, modelo, placa FROM veiculos ORDER BY marca, modelo'),
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
          nome: cfg.razao_social || cfg.nome_fantasia || 'LUIZ CAR',
          telefone: cfg.telefone || '',
          email: cfg.email || '',
          cnpj: cfg.cnpj || '',
          endereco,
          observacao_pdf: cfg.observacao_pdf || ''
        });
      } catch (error) {
        setCompany({ nome: 'Luiz Car Oficina Automotiva', telefone: '(11) 99999-9999', email: 'contato@luizcar.com.br', cnpj: '00.000.000/0001-00', endereco: 'Rua Exemplo, 123 - Centro, São Paulo - SP', observacao_pdf: '' });
      }
    } catch (error) {
      console.error('Erro ao buscar ordens de serviço:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = (ordens || []).filter(os => {
    if (!os) return false;
    const veiculo = vehicleLabel(os);
    const matchSearch = (os.id != null ? String(os.id) : '').includes(searchTerm) ||
      (os.cliente_nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      veiculo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'todos' || os.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => { setForm({ ...emptyForm }); setEditingId(null); setErrorMsg(''); setShowModal(true); };

  const openEdit = (os) => {
    setForm({
      cliente_id: os.cliente_id || '', veiculo_id: os.veiculo_id || '', mecanico_id: os.mecanico_id || '',
      descricao_problema: os.descricao_problema || '', servicos_executados: os.servicos_executados || '',
      mao_de_obra: Number(os.mao_de_obra || 0), pecas_custo: Number(os.pecas_custo || 0),
      status: os.status || 'Orçamento',
      data_entrada: os.data_entrada || new Date().toISOString().split('T')[0]
    });
    setEditingId(os.id); setErrorMsg(''); setShowModal(true);
  };

  const openView = (os) => { setViewTarget(os); setObservacaoText(os.observacao || ''); setShowViewModal(true); };
  const confirmDelete = (os) => { setDeleteTarget(os); setShowDeleteModal(true); };

  const handleSave = async () => {
    if (!form.cliente_id) { setErrorMsg('Selecione um cliente.'); return; }
    if (!form.veiculo_id) { setErrorMsg('Selecione um veículo.'); return; }
    const total = Number(form.mao_de_obra) + Number(form.pecas_custo);
    const args = [
      form.cliente_id || null, form.veiculo_id || null, form.mecanico_id || null,
      form.data_entrada, form.status, form.descricao_problema, form.servicos_executados,
      Number(form.mao_de_obra), Number(form.pecas_custo), total
    ];
    try {
      if (editingId) {
        const dataSaida = form.status === 'Concluída' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
        await api.execute({
          sql: "UPDATE ordens_servico SET cliente_id = ?, veiculo_id = ?, mecanico_id = ?, data_entrada = ?, status = ?, descricao_problema = ?, servicos_executados = ?, mao_de_obra = ?, pecas_custo = ?, total = ?" + (dataSaida ? ", data_saida = ?" : "") + " WHERE id = ?",
          args: dataSaida ? [...args, dataSaida, editingId] : [...args, editingId]
        });
      } else {
        await api.execute({
          sql: 'INSERT INTO ordens_servico (cliente_id, veiculo_id, mecanico_id, data_entrada, status, descricao_problema, servicos_executados, mao_de_obra, pecas_custo, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args
        });
      }
      setShowModal(false); setErrorMsg(''); await fetchData();
    } catch (error) { setErrorMsg(error.message || 'Erro ao salvar. Verifique os dados e tente novamente.'); }
  };

  const handleDelete = async () => {
    try {
      await api.execute({ sql: 'DELETE FROM ordens_servico WHERE id = ?', args: [deleteTarget.id] });
      setShowDeleteModal(false); setDeleteTarget(null); await fetchData();
    } catch (error) { console.error('Erro ao excluir ordem de serviço:', error); }
  };

  const handleSaveObservacao = async () => {
    if (!viewTarget) return;
    try {
      await api.execute({
        sql: 'UPDATE ordens_servico SET observacao = ? WHERE id = ?',
        args: [observacaoText, viewTarget.id]
      });
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
    }
  };

  const handleWhatsApp = (os) => {
    let telefone = (os.cliente_telefone || '').replace(/\D/g, '');
    if (telefone && !telefone.startsWith('55')) telefone = `55${telefone}`;
    const text = encodeURIComponent(`Olá ${os.cliente_nome || ''}! Sobre a sua Ordem de Serviço #${os.id} referente ao ${vehicleLabel(os)}, o status atual é: *${os.status}*. O valor total estimado é R$ ${(Number(os.mao_de_obra) + Number(os.pecas_custo)).toFixed(2)}.`);
    window.open(`https://wa.me/${telefone}?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    if (!viewTarget) return;
    handleSaveObservacao();
    const os = viewTarget;
    const total = Number(os.total || (Number(os.mao_de_obra || 0) + Number(os.pecas_custo || 0)));
    const w = window.open('', '_blank');

    const servicos = (os.servicos_executados || '')
      .split('\n')
      .filter(s => s.trim())
      .map(s => {
        const parts = s.split('-').map(p => p.trim());
        return { descricao: s, quantidade: 1, valor: 0 };
      });

    const css = `
      @page { margin: 18mm 15mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        font-size: 11px;
        color: #222;
        background: #fff;
        line-height: 1.5;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 4px solid #e65100;
      }
      .top-bar .brand {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .top-bar .brand img { width: 72px; height: 72px; object-fit: contain; border-radius: 6px; }
      .top-bar .brand-info h1 {
        font-size: 20px;
        font-weight: 800;
        color: #1a1a1a;
        letter-spacing: 0.01em;
        line-height: 1.2;
      }
      .top-bar .brand-info p {
        font-size: 9.5px;
        color: #555;
        line-height: 1.5;
        margin-top: 3px;
      }
      .top-bar .doc-info {
        text-align: right;
      }
      .top-bar .doc-info .doc-label {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #888;
        font-weight: 600;
      }
      .top-bar .doc-info .doc-number {
        font-size: 30px;
        font-weight: 900;
        color: #e65100;
        letter-spacing: 0.02em;
        line-height: 1.1;
      }
      .top-bar .doc-info .doc-status {
        display: inline-block;
        margin-top: 5px;
        padding: 3px 14px;
        font-size: 10px;
        font-weight: 700;
        border: 2px solid #e65100;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #e65100;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-bottom: 24px;
      }
      .info-card {
        background: #f8f9fa;
        border-radius: 6px;
        padding: 12px 14px;
        border-left: 3px solid #e65100;
      }
      .info-card .label {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #888;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .info-card .value {
        font-size: 12px;
        color: #1a1a1a;
        font-weight: 600;
        line-height: 1.6;
      }
      .info-card .value span { font-weight: 400; color: #555; }

      .section {
        margin-bottom: 20px;
      }
      .section-title {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #e65100;
        border-bottom: 2px solid #eee;
        padding-bottom: 5px;
        margin-bottom: 8px;
      }
      .section-body {
        font-size: 11px;
        line-height: 1.7;
        color: #333;
        padding: 0 2px;
      }

      .costs-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 4px;
      }
      .costs-table tr:not(:last-child) td {
        padding: 7px 10px;
        border-bottom: 1px solid #eee;
      }
      .costs-table td:first-child { color: #444; }
      .costs-table td:last-child {
        text-align: right;
        font-weight: 700;
        color: #1a1a1a;
        width: 140px;
      }
      .costs-table .total td {
        padding: 10px 10px;
        font-size: 16px;
        font-weight: 800;
        color: #fff;
        background: #e65100;
        border: none;
      }
      .costs-table .total td:first-child { color: #fff; }

      .footer {
        margin-top: 32px;
        padding: 14px 0 0;
        border-top: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .footer-info { font-size: 9px; color: #777; line-height: 1.6; }
      .footer-info strong { color: #444; }
      .footer-note { font-size: 9px; color: #aaa; text-align: right; max-width: 240px; }

      .obs-text { font-size: 10px; color: #555; font-style: italic; }

      @media print {
        body { padding: 0; }
      }
    `;
    w.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Ordem de Serviço #${os.id}</title><style>${css}</style></head>
<body>

  <div class="top-bar">
    <div class="brand">
      <img src="${window.location.origin}/logo_luizcar.jpg" />
      <div class="brand-info">
        <h1>${company.nome}</h1>
        <p>${company.cnpj ? 'CNPJ: ' + company.cnpj + '<br>' : ''}${company.endereco ? company.endereco + '<br>' : ''}${company.telefone ? 'Tel: ' + company.telefone : ''}${company.email ? ' | ' + company.email : ''}</p>
      </div>
    </div>
    <div class="doc-info">
      <div class="doc-label">Ordem de Serviço</div>
      <div class="doc-number">#${String(os.id).padStart(4, '0')}</div>
      <div class="doc-status">${os.status}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <div class="label">Cliente</div>
      <div class="value">${os.cliente_nome || '---'}</div>
    </div>
    <div class="info-card">
      <div class="label">Data de Abertura</div>
      <div class="value">${new Date(os.data_entrada).toLocaleDateString('pt-BR')}</div>
    </div>
    <div class="info-card">
      <div class="label">Veículo</div>
      <div class="value">${vehicleLabel(os)}</div>
    </div>
    <div class="info-card">
      <div class="label">Técnico Responsável</div>
      <div class="value">${os.mecanico_nome || '---'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Diagnóstico / Descrição do Problema</div>
    <div class="section-body">${(os.descricao_problema || '').replace(/\n/g, '<br>') || 'Nenhum diagnóstico registrado.'}</div>
  </div>

  <div class="section">
    <div class="section-title">Serviços Executados</div>
    <div class="section-body">${(os.servicos_executados || '').replace(/\n/g, '<br>') || 'Sem serviços registrados.'}</div>
  </div>

  <div class="section">
    <div class="section-title">Resumo de Custos</div>
    <table class="costs-table">
      <tr><td>Mão de Obra / Serviços</td><td>R$ ${Number(os.mao_de_obra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
      <tr><td>Peças Utilizadas</td><td>${Number(os.pecas_custo || 0) > 0 ? 'R$ ' + Number(os.pecas_custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'Não houve troca de peças'}</td></tr>
      <tr class="total"><td>Total</td><td>R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Observações</div>
    <div class="section-body obs-text">${(observacaoText || '').replace(/\n/g, '<br>') || 'Nenhuma observação registrada.'}</div>
  </div>

  <div class="footer">
    <div class="footer-info">
      <strong>${company.nome}</strong><br>
      ${company.cnpj ? company.cnpj + ' &nbsp;|&nbsp; ' : ''}${company.telefone || ''}${company.email ? ' &nbsp;|&nbsp; ' + company.email : ''}
    </div>
    <div class="footer-note">${company.observacao_pdf || 'Documento gerado em ' + new Date().toLocaleString('pt-BR')}</div>
  </div>

</body></html>`);
    w.document.close();
    w.print();
  };

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
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} data-gramm="false" />
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
            ) : filtered.filter(Boolean).map((os) => {
              if (!os) return null;
              const totalVal = Number(os.total || os.mao_de_obra || 0) + (os.total ? 0 : Number(os.pecas_custo || 0));
              const cfg = statusConfig[os.status] || statusConfig['Orçamento'];
              return (
                <tr key={os?.id ?? Math.random()}>
                  <td style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>#{os?.id}</td>
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
        <Modal show={showModal} title={editingId ? `Editar Orçamento #${editingId}` : 'Criar Novo Orçamento'} onClose={() => { setShowModal(false); setErrorMsg(''); }} maxWidth="720px">
          {errorMsg && (
            <div style={{
              background: 'rgba(220,38,38,0.08)', color: 'var(--color-danger)',
              padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem',
              marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              {errorMsg}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 0.75rem' }}>
            <div style={{ gridColumn: '1 / 3', marginBottom: '0.75rem' }}>
              <label className="input-label">Cliente *</label>
              <select className="input-field" style={{ width: '100%' }} value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value, veiculo_id: '' })}>
                <option value="">Selecione...</option>
                {clientes.filter(Boolean).map(c => c && <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '3 / 5', marginBottom: '0.75rem' }}>
              <label className="input-label">Veículo *</label>
              <select className="input-field" style={{ width: '100%' }} value={form.veiculo_id} onChange={e => setForm({ ...form, veiculo_id: e.target.value })}>
                <option value="">Selecione...</option>
                {veiculos.filter(Boolean).filter(v => v.cliente_id == form.cliente_id).map(v => <option key={v.id} value={v.id}>{selectedVehicleLabel(v)}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / 2', marginBottom: '0.75rem' }}>
              <label className="input-label">Data Entrada *</label>
              <input type="date" className="input-field" style={{ width: '100%' }} value={form.data_entrada} onChange={e => setForm({ ...form, data_entrada: e.target.value })} data-gramm="false" />
            </div>
            <div style={{ gridColumn: '2 / 4', marginBottom: '0.75rem' }}>
              <label className="input-label">Mecânico Responsável</label>
              <select className="input-field" style={{ width: '100%' }} value={form.mecanico_id} onChange={e => setForm({ ...form, mecanico_id: e.target.value })}>
                <option value="">Selecione...</option>
                {mecanicos.filter(Boolean).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
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
              <CurrencyInput value={form.mao_de_obra} onChange={v => setForm(f => ({ ...f, mao_de_obra: v }))} />
            </div>
            <div style={{ gridColumn: '3 / 5', marginBottom: '0.75rem' }}>
              <label className="input-label">Peças (R$)</label>
              <CurrencyInput value={form.pecas_custo} onChange={v => setForm(f => ({ ...f, pecas_custo: v }))} />
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
            <button className="btn btn-secondary" onClick={() => { setShowModal(false); setErrorMsg(''); }}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>Confirmar e Salvar</button>
          </div>
        </Modal>

        <Modal show={showViewModal} title={`Detalhamento da Ordem de Serviço #${viewTarget?.id || ''}`} onClose={() => setShowViewModal(false)} maxWidth="700px">
          {viewTarget && (
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
                <p style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 2px 0', color: 'var(--color-primary)' }}>#{viewTarget.id}</p>
                <span className="badge" style={{ background: (statusConfig[viewTarget.status] || statusConfig['Orçamento']).bg, color: (statusConfig[viewTarget.status] || statusConfig['Orçamento']).text, display: 'inline-block' }}>{viewTarget.status}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
              <div style={{ background: 'rgba(29,78,216,0.04)', borderLeft: '3px solid #1d4ed8', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.05em' }}>Cliente</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: '2px', color: 'var(--color-text-main)' }}>{viewTarget.cliente_nome}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Data de Abertura: {new Date(viewTarget.data_entrada).toLocaleDateString('pt-BR')}</div>
              </div>
              <div style={{ background: 'rgba(13,148,136,0.04)', borderLeft: '3px solid #0d9488', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#0d9488', fontWeight: 700, letterSpacing: '0.05em' }}>Veículo</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: '2px', color: 'var(--color-text-main)' }}>{vehicleLabel(viewTarget)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Técnico: {viewTarget.mecanico_nome}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(217,119,6,0.04)', borderLeft: '3px solid #d97706', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#d97706', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>Diagnóstico / Descrição</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>{viewTarget.descricao_problema || 'Nenhum diagnóstico detalhado registrado.'}</p>
            </div>

            <div style={{ background: 'rgba(22,163,74,0.04)', borderLeft: '3px solid #16a34a', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#16a34a', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>Serviços Executados</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>{viewTarget.servicos_executados || 'Sem observações adicionais.'}</p>
            </div>

            <div style={{ background: 'rgba(29,78,216,0.04)', borderLeft: '3px solid #1d4ed8', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#1d4ed8', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>Resumo de Custos</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.25rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Mão de Obra / Serviços</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>R$ {Number(viewTarget.mao_de_obra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Peças</span>
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

            <div style={{ background: 'rgba(100,116,139,0.04)', borderLeft: '3px solid #64748b', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>Observações</h4>
              <textarea className="input-field" style={{ width: '100%', height: '60px', resize: 'none', fontFamily: 'inherit' }}
                value={observacaoText} onChange={e => setObservacaoText(e.target.value)} placeholder="Adicione uma observação sobre esta OS..." />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }} className="no-print">
              <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handlePrint}>
                <Printer size={14} /> Imprimir
              </button>
              <button className="btn btn-primary" onClick={() => { handleSaveObservacao(); setShowViewModal(false); }}>Fechar</button>
            </div>
          </div>
          )}
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
