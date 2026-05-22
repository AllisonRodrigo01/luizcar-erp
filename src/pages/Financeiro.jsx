import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Award, Users, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

const Financeiro = () => {
  const [activeTab, setActiveTab] = useState('faturamento');
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [selectedMecanicoId, setSelectedMecanicoId] = useState(null);
  const [faturamentoOS, setFaturamentoOS] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [loading, setLoading] = useState(false);

  const monthOptions = [
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' }, { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' }, { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];
  const monthAbbreviations = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 4 }, (_, index) => String(currentYear - index));
  const toNumber = (value) => Number(value || 0);

  useEffect(() => {
    const fetchFinanceiroData = async () => {
      setLoading(true);
      try {
        const osConditions = ["os.status = 'Concluída'"];
        const osArgs = [];
        if (filterMonth !== 'todos') { osConditions.push("strftime('%m', os.data_saida) = ?"); osArgs.push(filterMonth); }
        if (filterYear !== 'todos') { osConditions.push("strftime('%Y', os.data_saida) = ?"); osArgs.push(filterYear); }

        const osQuery = `SELECT os.id, c.nome as cliente, v.marca || ' ' || v.modelo || ' (' || v.placa || ')' as veiculo, os.data_saida as data_conclusao, os.total, os.mao_de_obra, os.mecanico_id, os.comissao_percentual, u.nome as mecanico FROM ordens_servico os LEFT JOIN clientes c ON os.cliente_id = c.id LEFT JOIN veiculos v ON os.veiculo_id = v.id LEFT JOIN usuarios u ON os.mecanico_id = u.id WHERE ${osConditions.join(' AND ')} ORDER BY os.data_saida DESC`;
        const chartQuery = `SELECT strftime('%Y-%m', data_saida) as mes, SUM(total) as valor FROM ordens_servico WHERE status = 'Concluída' AND data_saida >= date('now', '-6 month') GROUP BY mes ORDER BY mes ASC`;
        const employeesQuery = 'SELECT id, nome FROM usuarios ORDER BY nome';

        const [osResult, chartResult, employeesResult] = await Promise.all([
          api.execute({ sql: osQuery, args: osArgs }),
          api.query(chartQuery),
          api.query(employeesQuery),
        ]);

        const osRows = osResult.rows.map(row => ({
          id: row.id, cliente: row.cliente || 'Cliente não informado', veiculo: row.veiculo || 'Veículo não informado',
          data_conclusao: row.data_conclusao, total: toNumber(row.total), mao_de_obra: toNumber(row.mao_de_obra),
          mecanico_id: row.mecanico_id, comissao_percentual: toNumber(row.comissao_percentual), mecanico: row.mecanico || 'Mecânico não informado',
        }));

        const formattedChartData = chartResult.rows.map(row => {
          const [year, month] = row.mes.split('-');
          return { label: `${monthAbbreviations[Number(month) - 1]}/${year.slice(-2)}`, valor: toNumber(row.valor) };
        });

        const employeeRows = employeesResult.rows.map(row => ({ id: row.id, nome: row.nome }));
        setFaturamentoOS(osRows); setChartData(formattedChartData); setMecanicos(employeeRows);
        if (!selectedMecanicoId && employeeRows.length > 0) setSelectedMecanicoId(employeeRows[0].id);
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
        setFaturamentoOS([]); setChartData([]); setMecanicos([]);
      } finally { setLoading(false); }
    };
    fetchFinanceiroData();
  }, [filterMonth, filterYear]);

  const InteractiveChart = () => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const maxVal = Math.max(...chartData.map(d => d.valor)) * 1.15;
    const width = 600, height = 220, paddingX = 50, paddingY = 30;
    const chartW = width - 2 * paddingX, chartH = height - 2 * paddingY;
    const points = chartData.map((d, i) => ({
      cx: paddingX + i * (chartW / (chartData.length - 1)),
      cy: height - paddingY - (d.valor / maxVal) * chartH, ...d
    }));
    let path = `M ${points[0].cx} ${points[0].cy}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i], p1 = points[i + 1];
      const cp1_x = p0.cx + (p1.cx - p0.cx) / 2, cp1_y = p0.cy;
      const cp2_x = p0.cx + (p1.cx - p0.cx) / 2, cp2_y = p1.cy;
      path += ` C ${cp1_x} ${cp1_y}, ${cp2_x} ${cp2_y}, ${p1.cx} ${p1.cy}`;
    }
    const areaPath = `${path} L ${points[points.length - 1].cx} ${height - paddingY} L ${points[0].cx} ${height - paddingY} Z`;

    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '260px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
            const y = paddingY + r * chartH, val = maxVal * (1 - r);
            return (
              <g key={idx}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="var(--color-border)" strokeDasharray="4 4" opacity="0.6" />
                <text x={10} y={y + 4} fill="var(--color-text-muted)" fontSize="9px" fontWeight="500">R$ {Math.round(val)}</text>
              </g>
            );
          })}
          <path d={areaPath} fill="url(#chartGrad)" />
          <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.cx} cy={p.cy} r="18" fill="transparent" style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)} />
              <circle cx={p.cx} cy={p.cy} r={hoveredIndex === idx ? '6' : '4'}
                fill={hoveredIndex === idx ? 'var(--color-bg-surface)' : 'var(--color-primary)'}
                stroke="var(--color-primary)" strokeWidth="2.5" style={{ transition: 'all 0.15s ease' }} />
              <text x={p.cx} y={height - 8} textAnchor="middle" fill="var(--color-text-muted)" fontSize="9px" fontWeight="600">{p.label}</text>
            </g>
          ))}
        </svg>
        {hoveredIndex !== null && (
          <div style={{
            position: 'absolute',
            left: `${(points[hoveredIndex].cx / width) * 100}%`,
            top: `${(points[hoveredIndex].cy / height) * 100 - 25}%`,
            transform: 'translate(-50%, -100%)',
            background: 'var(--color-sidebar)', color: 'white',
            padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)', fontSize: '0.75rem', fontWeight: '600',
            whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.1)', animation: 'fadeIn 0.15s ease'
          }}>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{chartData[hoveredIndex].label}</div>
            <div>R$ {chartData[hoveredIndex].valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        )}
      </div>
    );
  };

  const currentMonthOS = faturamentoOS;
  const faturamentoDoMes = currentMonthOS.reduce((acc, item) => acc + item.total, 0);
  const faturamentoAcumulado = faturamentoOS.reduce((acc, item) => acc + item.total, 0);
  const totalOSConcluidas = currentMonthOS.length;

  const filteredComissoesOS = faturamentoOS;
  const consolidadoMecanicos = mecanicos.map(m => {
    const osMecanico = filteredComissoesOS.filter(os => os.mecanico_id === m.id);
    return {
      ...m, qtdOS: osMecanico.length,
      faturamentoMao: osMecanico.reduce((acc, item) => acc + item.mao_de_obra, 0),
      comissaoTotal: osMecanico.reduce((acc, item) => acc + (item.mao_de_obra * item.comissao_percentual / 100), 0),
      detalhes: osMecanico
    };
  });

  const totalComissoesAPagar = consolidadoMecanicos.reduce((acc, item) => acc + item.comissaoTotal, 0);
  const totalOSAtribuidas = filteredComissoesOS.length;
  const selectedMecanico = consolidadoMecanicos.find(m => m.id === selectedMecanicoId) || consolidadoMecanicos[0];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-header-title">Gestão Financeira</div>
          <div className="page-header-subtitle">Faturamento geral da oficina e comissionamento de funcionários.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveTab('faturamento')}
          style={{
            background: 'none', border: 'none', padding: '0.75rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600,
            cursor: 'pointer', borderBottom: activeTab === 'faturamento' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'faturamento' ? 'var(--color-primary)' : 'var(--color-text-muted)', transition: 'all var(--transition-fast)'
          }}
        >
          📊 Faturamento & Desempenho
        </button>
        <button onClick={() => setActiveTab('comissoes')}
          style={{
            background: 'none', border: 'none', padding: '0.75rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600,
            cursor: 'pointer', borderBottom: activeTab === 'comissoes' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'comissoes' ? 'var(--color-primary)' : 'var(--color-text-muted)', transition: 'all var(--transition-fast)'
          }}
        >
          💰 Central de Comissões
        </button>
      </div>

      {loading && (
        <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando...</div>
      )}

      {activeTab === 'faturamento' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(5,150,105,0.08)', color: 'var(--color-success)' }}>
                <DollarSign size={20} strokeWidth={1.8} />
              </div>
              <div>
                <div className="kpi-label">Faturamento do Mês</div>
                <div className="kpi-value">R$ {faturamentoDoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--color-secondary)' }}>
                <TrendingUp size={20} strokeWidth={1.8} />
              </div>
              <div>
                <div className="kpi-label">Faturamento Acumulado</div>
                <div className="kpi-value">R$ {faturamentoAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(2,132,199,0.08)', color: 'var(--color-info)' }}>
                <Award size={20} strokeWidth={1.8} />
              </div>
              <div>
                <div className="kpi-label">OS Concluídas no Mês</div>
                <div className="kpi-value">{totalOSConcluidas}</div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Evolução de Receita Recente</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Últimos 6 meses</p>
              </div>
            </div>
            {chartData.length > 0 ? <InteractiveChart /> : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum dado disponível.</div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Demonstrativo de OS Faturadas</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <select className="input-field" style={{ marginBottom: 0, padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                  <option value="todos">Todos</option>
                  {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select className="input-field" style={{ marginBottom: 0, padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                  <option value="todos">Todos</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th>OS ID</th>
                    <th>Cliente</th>
                    <th>Veículo</th>
                    <th>Data Conclusão</th>
                    <th style={{ textAlign: 'right' }}>Mão de Obra</th>
                    <th style={{ textAlign: 'right' }}>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMonthOS.map(os => (
                    <tr key={os.id}>
                      <td style={{ fontWeight: 700 }}>#{os.id}</td>
                      <td style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{os.cliente}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{os.veiculo}</td>
                      <td>{new Date(os.data_conclusao).toLocaleDateString('pt-BR')}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>R$ {os.mao_de_obra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-success)' }}>R$ {os.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {!loading && currentMonthOS.length === 0 && (
                    <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum faturamento registrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comissoes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Mês:</span>
              <select className="input-field" style={{ marginBottom: 0, padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                <option value="todos">Todos</option>
                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Ano:</span>
              <select className="input-field" style={{ marginBottom: 0, padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                <option value="todos">Todos</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(139,92,246,0.08)', color: 'var(--color-secondary)' }}>
                <Award size={20} strokeWidth={1.8} />
              </div>
              <div>
                <div className="kpi-label">Comissões Acumuladas</div>
                <div className="kpi-value">R$ {totalComissoesAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(2,132,199,0.08)', color: 'var(--color-info)' }}>
                <Users size={20} strokeWidth={1.8} />
              </div>
              <div>
                <div className="kpi-label">OS com Técnico</div>
                <div className="kpi-value">{totalOSAtribuidas}</div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1.25rem' }}>Consolidado por Funcionário</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th style={{ textAlign: 'center' }}>Qtd. OS</th>
                    <th style={{ textAlign: 'right' }}>Faturamento M.O.</th>
                    <th style={{ textAlign: 'right' }}>Comissão Acumulada</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidadoMecanicos.map(c => (
                    <tr key={c.id} style={{
                      background: selectedMecanicoId === c.id ? 'var(--color-primary-light)' : 'transparent',
                      transition: 'all 0.15s ease'
                    }}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{c.nome}</td>
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{c.qtdOS}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>R$ {c.faturamentoMao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>R$ {c.comissaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn" style={{
                          padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          border: selectedMecanicoId === c.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: selectedMecanicoId === c.id ? 'var(--color-primary)' : 'transparent',
                          color: selectedMecanicoId === c.id ? 'white' : 'var(--color-text-main)',
                          borderRadius: 'var(--radius-md)'
                        }} onClick={() => setSelectedMecanicoId(c.id)}>
                          Detalhar <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {consolidadoMecanicos.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum funcionário encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedMecanico && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--color-primary)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                Detalhamento: <span style={{ color: 'var(--color-primary)' }}>{selectedMecanico.nome}</span>
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '700px' }}>
                  <thead>
                    <tr>
                      <th>OS ID</th>
                      <th>Cliente / Veículo</th>
                      <th>Data</th>
                      <th style={{ textAlign: 'right' }}>Total OS</th>
                      <th style={{ textAlign: 'right' }}>Mão de Obra</th>
                      <th style={{ textAlign: 'center' }}>Comissão (%)</th>
                      <th style={{ textAlign: 'right' }}>Valor Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMecanico.detalhes.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 700 }}>#{d.id}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{d.cliente}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{d.veiculo}</div>
                        </td>
                        <td>{new Date(d.data_conclusao).toLocaleDateString('pt-BR')}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>R$ {d.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 500 }}>R$ {d.mao_de_obra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-info)' }}>{d.comissao_percentual}%</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-success)' }}>R$ {(d.mao_de_obra * d.comissao_percentual / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {selectedMecanico.detalhes.length === 0 && (
                      <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum serviço faturado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Financeiro;
