import React, { useEffect, useState } from 'react';
import { Calendar, Plus, X, Clock, MessageSquare, Filter, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';

const statusOptions = ['Agendado', 'Confirmado', 'Em Andamento', 'Concluído', 'Cancelado'];
const servicosComuns = [
  'Troca de Óleo', 'Revisão Geral', 'Alinhamento e Balanceamento',
  'Troca de Pastilhas de Freio', 'Troca de Pneus', 'Suspensão',
  'Injeção Eletrônica', 'Ar Condicionado', 'Funilaria e Pintura',
  'Troca de Correia Dentada', 'Troca de Bateria', 'Outro'
];

const emptyForm = {
  cliente_id: '', veiculo_id: '', data: '', hora: '', servico: '', descricao: ''
};

const Modal = ({ title, onClose, children, show, maxWidth = '550px' }) => (
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

const Agenda = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [filterDate, setFilterDate] = useState('hoje');

  const load = async () => {
    setLoading(true);
    try {
      const [agResult, cliResult, veiResult] = await Promise.all([
        api.query(`SELECT a.*, c.nome as cliente_nome, c.telefone as cliente_telefone, v.marca, v.modelo, v.placa FROM agendamentos a LEFT JOIN clientes c ON a.cliente_id = c.id LEFT JOIN veiculos v ON a.veiculo_id = v.id ORDER BY a.data DESC, a.hora DESC`),
        api.query('SELECT id, nome, telefone FROM clientes ORDER BY nome'),
        api.query('SELECT id, cliente_id, marca, modelo, placa FROM veiculos ORDER BY marca, modelo'),
      ]);
      setAgendamentos(agResult.rows || []);
      setClientes(cliResult.rows || []);
      setVeiculos(veiResult.rows || []);

      const osConcluidas = await api.query(`SELECT os.id, os.cliente_id, os.servicos_executados, os.data_saida, os.data_entrada, c.nome as cliente_nome, c.telefone as cliente_telefone FROM ordens_servico os LEFT JOIN clientes c ON os.cliente_id = c.id WHERE os.status = 'Concluída' ORDER BY os.data_saida DESC`);
      const servicosAlertas = [
        { nome: 'Troca de Óleo', meses: 5, msg: (nome) => `Olá ${nome}! Aqui é da LuizCar. Notei que já faz aproximadamente 5 meses desde a última troca de óleo do seu veículo. Para manter o motor sempre protegido, que tal agendarmos a próxima troca? Estamos prontos para atender você!` },
        { nome: 'Pastilhas de Freio', meses: 12, msg: (nome) => `Olá ${nome}! Passando para lembrar que já faz aproximadamente 1 ano desde a última verificação dos freios do seu veículo. Na LuizCar podemos fazer uma revisão completa para sua segurança. Vamos agendar?` },
        { nome: 'Revisão Geral', meses: 6, msg: (nome) => `Olá ${nome}! Tudo bem? Já está na hora de uma revisão geral no seu veículo. A LuizCar está pronta para cuidar de tudo com a qualidade que você merece. Agende seu horário!` },
      ];
      // Garantir coluna mensagem_admin
      try {
        const info = await api.query("PRAGMA table_info(notificacoes)");
        const hasAdmin = (info.rows || []).some(r => r.name === 'mensagem_admin');
        if (!hasAdmin) {
          await api.execute({ sql: "ALTER TABLE notificacoes ADD COLUMN mensagem_admin TEXT" });
        }
      } catch (e) { console.warn(e); }
      for (const os of osConcluidas.rows || []) {
        const servicos = (os.servicos_executados || '').toLowerCase();
        const dataSaida = new Date(os.data_saida || os.data_entrada);
        for (const alerta of servicosAlertas) {
          if (servicos.includes(alerta.nome.toLowerCase())) {
            const dataLimite = new Date(dataSaida);
            dataLimite.setMonth(dataLimite.getMonth() + alerta.meses);
            if (dataLimite <= new Date()) {
              const notifExist = await api.query(
                "SELECT id FROM notificacoes WHERE cliente_id = ? AND tipo = ? AND criado_em > date('now', '-7 days')",
                [os.cliente_id, `alerta_${alerta.nome}`]
              );
              if (notifExist.rows.length === 0) {
                const msgCliente = alerta.msg(os.cliente_nome || '');
                const msgAdmin = `${os.cliente_nome || 'Cliente'} - ${alerta.nome} há ${alerta.meses} meses - Mensagem enviada via WhatsApp`;
                await api.insert('notificacoes', {
                  cliente_id: os.cliente_id,
                  os_id: os.id,
                  tipo: `alerta_${alerta.nome}`,
                  mensagem: msgCliente,
                  mensagem_admin: msgAdmin
                });
                const telefone = (os.cliente_telefone || '').replace(/\D/g, '');
                const tel = telefone.startsWith('55') ? telefone : `55${telefone}`;
                if (tel.length > 2) {
                  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msgCliente)}`, '_blank');
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Erro ao carregar agenda:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const hoje = new Date().toISOString().split('T')[0];

  const filtered = agendamentos.filter(a => {
    if (filterDate === 'hoje') return a.data === hoje;
    if (filterDate === 'semana') {
      const d = new Date(a.data);
      const fim = new Date();
      fim.setDate(fim.getDate() + 7);
      return d >= new Date(hoje) && d <= fim;
    }
    if (filterDate === 'futuros') return a.data >= hoje;
    return true;
  }).sort((a, b) => a.data > b.data ? 1 : -1);

  const openNew = () => {
    setForm({ ...emptyForm, data: hoje, hora: new Date().toTimeString().slice(0, 5) });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.cliente_id || !form.data || !form.hora || !form.servico) {
      setError('Preencha cliente, data, hora e serviço.');
      return;
    }
    setError('');
    try {
      await api.insert('agendamentos', {
        cliente_id: form.cliente_id,
        veiculo_id: form.veiculo_id || null,
        data: form.data,
        hora: form.hora,
        servico: form.servico,
        descricao: form.descricao || null
      });
      setShowModal(false);
      await load();
    } catch (e) {
      setError(e.message || 'Erro ao salvar agendamento');
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.update('agendamentos', { status }, 'id = ?', [id]);
      await load();
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    }
  };

  const handleWhatsAppAgenda = (a) => {
    let telefone = (a.cliente_telefone || '').replace(/\D/g, '');
    if (telefone && !telefone.startsWith('55')) telefone = `55${telefone}`;
    const text = encodeURIComponent(
      `Olá ${a.cliente_nome || ''}! Passando para lembrar do seu agendamento na LuizCar no dia ${new Date(a.data).toLocaleDateString('pt-BR')} às ${a.hora} para ${a.servico}. Aguardamos você!`
    );
    window.open(`https://wa.me/${telefone}?text=${text}`, '_blank');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-header-title">Agenda</div>
          <div className="page-header-subtitle">Gerencie os agendamentos e compromissos da oficina.</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} color="var(--color-text-muted)" />
          {[
            { key: 'hoje', label: 'Hoje' },
            { key: 'semana', label: 'Esta Semana' },
            { key: 'futuros', label: 'Futuros' },
            { key: 'todos', label: 'Todos' }
          ].map(f => (
            <button key={f.key} onClick={() => setFilterDate(f.key)} className="btn" style={{
              padding: '0.4rem 0.75rem', fontSize: '0.75rem',
              background: filterDate === f.key ? 'var(--color-primary)' : 'transparent',
              color: filterDate === f.key ? 'white' : 'var(--color-text-muted)',
              border: filterDate === f.key ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><p>Carregando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Calendar size={40} className="empty-state-icon" />
            <p style={{ fontSize: '0.875rem' }}>Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          <div className="table-container"><table>
            <thead>
              <tr>
                <th>Cliente / Veículo</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Serviço</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: `hsl(${((a.cliente_id || 0) * 60) % 360}, 55%, 48%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 600, fontSize: '0.75rem'
                      }}>
                        {(a.cliente_nome || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>{a.cliente_nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {a.marca} {a.modelo} {a.placa ? `(${a.placa})` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                      <Calendar size={13} color="var(--color-text-muted)" />
                      {new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                      <Clock size={13} color="var(--color-text-muted)" />
                      {a.hora}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{a.servico}</td>
                  <td>
                    <select className="input-field" style={{ marginBottom: 0, padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                      value={a.status} onChange={e => handleStatus(a.id, e.target.value)}>
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ padding: '0.35rem' }} title="WhatsApp"
                      onClick={() => handleWhatsAppAgenda(a)}>
                      <MessageSquare size={14} color="var(--color-success)" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      <Modal title="Novo Agendamento" show={showModal} onClose={() => setShowModal(false)}>
        {error && (
          <div style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
            <label className="input-label">Cliente *</label>
            <select className="input-field" style={{ width: '100%' }} value={form.cliente_id}
              onChange={e => setForm({ ...form, cliente_id: e.target.value, veiculo_id: '' })}>
              <option value="">Selecione...</option>
              {clientes.filter(Boolean).map(c => c && <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
            <label className="input-label">Veículo</label>
            <select className="input-field" style={{ width: '100%' }} value={form.veiculo_id}
              onChange={e => setForm({ ...form, veiculo_id: e.target.value })}>
              <option value="">Selecione...</option>
              {veiculos.filter(Boolean).filter(v => v.cliente_id == form.cliente_id).map(v =>
                <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>
              )}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">Data *</label>
            <input type="date" className="input-field" style={{ width: '100%' }} value={form.data}
              onChange={e => setForm({ ...form, data: e.target.value })} data-gramm="false" />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">Hora *</label>
            <input type="time" className="input-field" style={{ width: '100%' }} value={form.hora}
              onChange={e => setForm({ ...form, hora: e.target.value })} data-gramm="false" />
          </div>
          <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
            <label className="input-label">Serviço *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
              {servicosComuns.map(s => (
                <button key={s} type="button" onClick={() => setForm({ ...form, servico: s })}
                  className="btn" style={{
                    padding: '0.25rem 0.6rem', fontSize: '0.7rem',
                    background: form.servico === s ? 'var(--color-primary)' : 'rgba(255,255,255,0.04)',
                    color: form.servico === s ? 'white' : 'var(--color-text-main)',
                    border: form.servico === s ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  }}>{s}</button>
              ))}
            </div>
            <input type="text" className="input-field" style={{ width: '100%' }} placeholder="Ou digite o serviço..."
              value={form.servico} onChange={e => setForm({ ...form, servico: e.target.value })} data-gramm="false" />
          </div>
          <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
            <label className="input-label">Descrição / Observações</label>
            <textarea className="input-field" style={{ width: '100%', height: '60px', resize: 'none', fontFamily: 'inherit' }}
              value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>Agendar</button>
        </div>
      </Modal>
    </div>
  );
};

export default Agenda;