import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, DollarSign, Car, Wrench, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

const KPICard = ({ title, value, subtitle, icon: Icon, color, bg, trend, trendUp }) => {
  const isSolid = bg?.startsWith('#');
  return (
  <div className="kpi-card" style={{ background: bg || 'var(--color-bg-surface)' }}>
    <div className="kpi-icon" style={{ background: `${color}30`, color: '#fff' }}>
      <Icon size={20} strokeWidth={1.8} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="kpi-label" style={{ color: isSolid ? 'rgba(255,255,255,0.7)' : undefined }}>{title}</div>
      <div className="kpi-value" style={{ color: isSolid ? '#fff' : undefined }}>{value}</div>
      {subtitle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
          {trend !== undefined && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.125rem',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: isSolid ? 'rgba(255,255,255,0.9)' : (trendUp ? 'var(--color-success)' : 'var(--color-danger)'),
            }}>
              {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {trend}
            </span>
          )}
          <span style={{ fontSize: '0.6875rem', color: isSolid ? 'rgba(255,255,255,0.65)' : 'var(--color-text-muted)' }}>{subtitle}</span>
        </div>
      )}
    </div>
  </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ clientes: 0, veiculos: 0, osPendentes: 0, faturamentoMes: 0, osConcluidasMes: 0 });
  const [chartData, setChartData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const [clientes, veiculos, osPendentes, faturamentoMes, osConcluidasMes, chartRows, areaRows] = await Promise.all([
          api.query("SELECT COUNT(*) as total FROM clientes"),
          api.query("SELECT COUNT(*) as total FROM veiculos"),
          api.query("SELECT COUNT(*) as total FROM ordens_servico WHERE status NOT IN ('Concluída','Cancelada')"),
          api.execute({
            sql: "SELECT COALESCE(SUM(total),0) as total FROM ordens_servico WHERE status='Concluída' AND strftime('%Y-%m', data_saida) = ?",
            args: [mesAtual]
          }),
          api.execute({
            sql: "SELECT COUNT(*) as total FROM ordens_servico WHERE status='Concluída' AND strftime('%Y-%m', data_saida) = ?",
            args: [mesAtual]
          }),
          api.query(`
            SELECT strftime('%Y-%m', data_saida) as mes, SUM(total) as receitas
            FROM ordens_servico
            WHERE status = 'Concluída' AND data_saida >= date('now', '-6 month')
            GROUP BY mes ORDER BY mes ASC
          `),
          api.query(`
            SELECT strftime('%Y-%m-%d', data_entrada) as dia, COUNT(*) as qtd
            FROM ordens_servico
            WHERE data_entrada >= date('now', '-14 day')
            GROUP BY dia ORDER BY dia ASC
          `)
        ]);

        const mesNomes = { '01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun','07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez' };
        const chart = (chartRows.rows || []).map(r => {
          const [y, m] = (r[0] || '').split('-');
          return { name: `${mesNomes[m] || m}/${(y||'').slice(2)}`, receitas: Number(r[1]) || 0 };
        });

        const area = (areaRows.rows || []).map(r => ({
          dia: new Date(r[0]).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          qtd: Number(r[1]) || 0,
        }));

        setStats({
          clientes: Number(clientes.rows[0]?.total ?? clientes.rows[0]?.[0] ?? 0) || 0,
          veiculos: Number(veiculos.rows[0]?.total ?? veiculos.rows[0]?.[0] ?? 0) || 0,
          osPendentes: Number(osPendentes.rows[0]?.total ?? osPendentes.rows[0]?.[0] ?? 0) || 0,
          faturamentoMes: Number(faturamentoMes.rows[0]?.total ?? faturamentoMes.rows[0]?.[0] ?? 0) || 0,
          osConcluidasMes: Number(osConcluidasMes.rows[0]?.total ?? osConcluidasMes.rows[0]?.[0] ?? 0) || 0,
        });
        setChartData(chart);
        setAreaData(area);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fmt = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-header-title">Visão Geral do Negócio</div>
          <div className="page-header-subtitle">Acompanhe os indicadores principais da oficina em tempo real.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <Activity size={13} />
          Atualizado em {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Alert */}
      {stats.osPendentes > 0 && (
        <div style={{
          background: 'rgba(217, 119, 6, 0.06)',
          border: '1px solid rgba(217, 119, 6, 0.2)',
          color: 'var(--color-warning)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8125rem',
        }}>
          <AlertTriangle size={15} />
          <span><strong>Atenção:</strong> {stats.osPendentes} ordem{stats.osPendentes !== 1 ? 's' : ''} de serviço aguardando conclusão. <Link to="/os" style={{ color: 'var(--color-warning)', fontWeight: 600, textDecoration: 'underline' }}>Visualizar</Link></span>
        </div>
      )}

      {/* KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <KPICard
          title="Clientes Cadastrados"
          value={loading ? '...' : stats.clientes.toLocaleString('pt-BR')}
          subtitle="Total no sistema"
          icon={Users}
          color="#16a34a"
          bg="#16a34a"
          trend="12%"
          trendUp={true}
        />
        <KPICard
          title="Veículos Cadastrados"
          value={loading ? '...' : stats.veiculos.toLocaleString('pt-BR')}
          subtitle="Total no sistema"
          icon={Car}
          color="#0ea5e9"
          bg="#0ea5e9"
          trend="8%"
          trendUp={true}
        />
        <KPICard
          title="OS em Aberto"
          value={loading ? '...' : stats.osPendentes.toLocaleString('pt-BR')}
          subtitle="Aguardando conclusão"
          icon={Wrench}
          color="#d97706"
          bg="#d97706"
        />
        {user?.role === 'admin' && (
          <>
            <KPICard
              title="Faturamento do Mês"
              value={loading ? '...' : fmt(stats.faturamentoMes)}
              subtitle="OS concluídas no período"
              icon={DollarSign}
              color="#059669"
              bg="#059669"
              trend="5%"
              trendUp={true}
            />
            <KPICard
              title="OS Concluídas"
              value={loading ? '...' : stats.osConcluidasMes.toLocaleString('pt-BR')}
              subtitle="Neste mês"
              icon={TrendingUp}
              color="#1d4ed8"
              bg="#1d4ed8"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      {user?.role === 'admin' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>Evolução de Receitas</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Últimos 6 meses</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-success)' }}></div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Receitas</span>
              </div>
            </div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                    contentStyle={{
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-lg)',
                      fontSize: '0.75rem',
                    }}
                    formatter={v => fmt(v)}
                  />
                  <Bar dataKey="receitas" fill="url(#barGrad)" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>Volume de Entradas</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Últimos 14 dias</p>
            </div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-lg)',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Area type="monotone" dataKey="qtd" stroke="var(--color-primary)" strokeWidth={2} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          Acesso Rápido
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Nova OS', to: '/os', icon: Wrench, color: '#d97706' },
            { label: 'Novo Cliente', to: '/clientes', icon: Users, color: '#16a34a' },
            { label: 'Novo Veículo', to: '/veiculos', icon: Car, color: '#0ea5e9' },
            { label: 'Financeiro', to: '/financeiro', icon: DollarSign, color: '#1d4ed8', admin: true },
          ].filter(item => !item.admin || user?.role === 'admin').map((item) => (
            <Link
              key={item.label}
              to={item.to}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: `${item.color}12`,
                border: `1px solid ${item.color}30`,
                borderRadius: 'var(--radius-md)',
                color: item.color,
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = item.color;
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = item.color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `${item.color}12`;
                e.currentTarget.style.color = item.color;
                e.currentTarget.style.borderColor = `${item.color}30`;
              }}
            >
              <item.icon size={14} strokeWidth={2} />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
