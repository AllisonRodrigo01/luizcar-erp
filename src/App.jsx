import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, Settings, LogOut, Wrench, Package,
  ChevronDown, ChevronRight, Bell, Moon, Sun, Menu, DollarSign,
  ChevronLeft, ShieldCheck, Building2, Calendar, MessageSquare, AlertCircle, CheckCircle
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { migrateDatabase, api } from './lib/api';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Veiculos from './pages/Veiculos';
import OrdensServico from './pages/OrdensServico';
import Login from './pages/Login';
import RecuperarSenha from './pages/RecuperarSenha';
import ResetarSenha from './pages/ResetarSenha';
import Usuarios from './pages/Usuarios';
import Estoque from './pages/Estoque';
import Financeiro from './pages/Financeiro';
import Agenda from './pages/Agenda';
import Configuracoes from './pages/Configuracoes';

const SidebarItem = ({ icon: Icon, label, to, requireAdmin, subItems, onNavigate }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (requireAdmin && user?.role !== 'admin') return null;

  const hasSubItems = subItems && subItems.length > 0;
  const isActive = location.pathname === to || (hasSubItems && subItems.some(item => location.pathname === item.to));

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.6rem 1.25rem',
    cursor: hasSubItems ? 'pointer' : 'default',
    color: isActive || isOpen ? '#ffffff' : '#64748b',
    background: isActive ? 'var(--color-sidebar-active)' : 'transparent',
    borderRadius: '8px',
    margin: '0 0.625rem',
    transition: 'all 0.15s',
    fontSize: '0.8125rem',
    fontWeight: 500,
    textDecoration: 'none',
    borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
  };

  const content = (
    <>
      <Icon size={17} strokeWidth={1.8} />
      <span style={{ flex: 1 }}>{label}</span>
      {hasSubItems && (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
    </>
  );

  if (hasSubItems) {
    return (
      <div style={{ marginBottom: '0.125rem' }}>
        <div style={itemStyle} onClick={() => setIsOpen(!isOpen)}>{content}</div>
        {isOpen && (
          <div style={{ padding: '0.25rem 0 0.25rem 2.75rem' }}>
            {subItems.map((sub, i) => (
              <Link key={i} to={sub.to} onClick={onNavigate} style={{
                display: 'block', padding: '0.4rem 0.75rem', textDecoration: 'none',
                color: location.pathname === sub.to ? '#ffffff' : '#64748b',
                fontSize: '0.75rem', fontWeight: 500, borderRadius: '6px',
                margin: '0.125rem 0',
                background: location.pathname === sub.to ? 'var(--color-sidebar-active)' : 'transparent',
                transition: 'all 0.15s',
              }}>{sub.label}</Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <Link to={to} style={itemStyle} onClick={onNavigate}>{content}</Link>;
};

const PrivateRoute = ({ children, requireAdmin }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const Breadcrumb = () => {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);
  const labels = {
    '': 'Dashboard', clientes: 'Clientes', veiculos: 'Veículos',
    os: 'Ordens de Serviço', estoque: 'Estoque', financeiro: 'Financeiro',
    usuarios: 'Funcionários', config: 'Configurações', login: 'Login',
    'recuperar-senha': 'Recuperar Senha',
  };

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
      <Building2 size={13} />
      <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>LuizCar</span>
      {paths.map((p, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={11} />
          <span style={{ color: i === paths.length - 1 ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontWeight: i === paths.length - 1 ? 600 : 400 }}>
            {labels[p] || p}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);

  const fetchNotificacoes = async () => {
    try {
      const res = await api.query('SELECT n.*, c.nome as cliente_nome, c.telefone as cliente_telefone FROM notificacoes n LEFT JOIN clientes c ON n.cliente_id = c.id WHERE n.lida = 0 ORDER BY n.criado_em DESC LIMIT 20');
      setNotificacoes(res.rows || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchNotificacoes(); }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
    fetchNotificacoes();
  }, [location.pathname]);

  const handleSendNotificacao = async (n) => {
    let telefone = (n.cliente_telefone || '').replace(/\D/g, '');
    if (telefone && !telefone.startsWith('55')) telefone = `55${telefone}`;
    const text = encodeURIComponent(n.mensagem);
    if (telefone) window.open(`https://wa.me/${telefone}?text=${text}`, '_blank');
    try {
      await api.execute({ sql: 'UPDATE notificacoes SET lida = 1 WHERE id = ?', args: [n.id] });
      fetchNotificacoes();
    } catch (e) { console.error(e); }
  };

  const closeMobile = () => {
    if (window.innerWidth <= 768) setMobileSidebarOpen(false);
  };

  const menuItems = [
    { section: 'Principal', items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    ]},
    { section: 'Cadastros', items: [
      { icon: Users, label: 'Clientes', to: '/clientes' },
      { icon: Car, label: 'Veículos', to: '/veiculos' },
    ]},
    { section: 'Operacional', items: [
      { icon: Calendar, label: 'Agenda', to: '/agenda' },
      { icon: Wrench, label: 'Ordens de Serviço', to: '/os' },
      { icon: Package, label: 'Estoque', to: '/estoque', admin: true },
    ]},
    { section: 'Administrativo', items: [
      { icon: DollarSign, label: 'Financeiro', to: '/financeiro', admin: true },
      { icon: Users, label: 'Funcionários', to: '/usuarios', admin: true },
      { icon: Settings, label: 'Configurações', to: '/config', admin: true },
    ]},
  ];

  return (
    <div className="app-container">
      <div className={`sidebar-overlay ${mobileSidebarOpen ? 'open' : ''}`} onClick={() => setMobileSidebarOpen(false)} />

      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`} style={{
        width: sidebarOpen ? 260 : 0,
        minWidth: sidebarOpen ? 260 : 0,
        opacity: sidebarOpen ? 1 : 0,
        overflow: 'hidden',
      }}>
        <div className="sidebar-header">
          <img src="/logo_luizcar.jpg" alt="LuizCar" className="sidebar-logo" />
          <div className="sidebar-brand">
            <h2 className="sidebar-brand-title">LUIZ CAR</h2>
            <p className="sidebar-brand-sub">OFICINA AUTOMOTIVA</p>
          </div>
        </div>

        <div style={{ padding: '0.5rem 0', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '0.5rem 1.5rem 1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, fontWeight: 400, fontStyle: 'italic', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '0 0.75rem 0.5rem' }}>
            "Excelência em serviços automotivos"
          </div>

          {menuItems.map((section, idx) => (
            <React.Fragment key={idx}>
              <div className="sidebar-section-label">{section.section}</div>
              {section.items.map((item, i) => (
                <SidebarItem key={i} icon={item.icon} label={item.label} to={item.to} requireAdmin={item.admin} onNavigate={closeMobile} />
              ))}
            </React.Fragment>
          ))}
        </div>

        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.6875rem',
          color: 'rgba(255,255,255,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <ShieldCheck size={11} />
            <span style={{ color: user?.role === 'admin' ? 'var(--color-primary)' : 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              {user?.role === 'admin' ? 'Administrador' : 'Funcionário'}
            </span>
          </div>
          <div style={{ opacity: 0.5 }}>v3.4.0 · Enterprise</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => {
              if (window.innerWidth <= 768) setMobileSidebarOpen(prev => !prev);
              else setSidebarOpen(prev => !prev);
            }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', padding: '0.35rem',
              borderRadius: '6px', display: 'flex',
              transition: 'var(--transition)',
            }}>
              {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>
            <Breadcrumb />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="greeting-text" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              {getGreeting()}, <strong style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{user?.name?.split(' ')[0]}</strong>
            </span>

            <div style={{ width: 1, height: 22, background: 'var(--color-border)' }} />

            <button onClick={toggleTheme} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.35rem', borderRadius: '6px', display: 'flex',
              color: 'var(--color-text-muted)', transition: 'var(--transition)',
            }}>
              {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} />}
            </button>

            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotificationsOpen(!notificationsOpen)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', padding: '0.35rem',
                borderRadius: '6px', display: 'flex', position: 'relative',
                transition: 'var(--transition)',
              }}>
                <Bell size={17} />
                {notificacoes.length > 0 && <span style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 8, height: 8, background: 'var(--color-danger)',
                  borderRadius: '50%', border: '2px solid var(--color-topbar)',
                }} />}
              </button>

              {notificationsOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setNotificationsOpen(false)} />
                  <div className="glass-panel" style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 380, maxHeight: 440, overflowY: 'auto', zIndex: 50,
                    animation: 'slideDown 0.15s ease',
                    boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)',
                  }}>
                    <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: '0.8125rem' }}>
                      Notificações {notificacoes.length > 0 && `(${notificacoes.length})`}
                    </div>
                    {notificacoes.length === 0 ? (
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <p style={{ fontSize: '0.8125rem' }}>Nenhuma notificação pendente</p>
                      </div>
                    ) : notificacoes.map(n => (
                      <div key={n.id} onClick={() => handleSendNotificacao(n)} style={{
                        display: 'flex', gap: '0.75rem', padding: '0.875rem 1.25rem',
                        borderBottom: '1px solid var(--color-border)',
                        background: n.lida ? 'transparent' : 'rgba(37,99,235,0.03)',
                        cursor: 'pointer', transition: 'var(--transition)',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = n.lida ? 'transparent' : 'rgba(37,99,235,0.03)'; }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                            <MessageSquare size={13} color="var(--color-success)" />
                            <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>{n.mensagem_admin || n.mensagem}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ width: 1, height: 22, background: 'var(--color-border)' }} />

            <div className="topbar-user-avatar">
              {user?.name?.charAt(0)}
            </div>

            <button onClick={logout} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', padding: '0.35rem',
              borderRadius: '6px', display: 'flex', transition: 'var(--transition)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-danger-light)'; e.currentTarget.style.color = 'var(--color-danger)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div style={{ padding: '1.75rem 2rem', flex: 1 }}>
          <Routes>
            <Route path="/" element={<PageErrorBoundary><Dashboard /></PageErrorBoundary>} />
            <Route path="/clientes" element={<PageErrorBoundary><Clientes /></PageErrorBoundary>} />
            <Route path="/veiculos" element={<PageErrorBoundary><Veiculos /></PageErrorBoundary>} />
            <Route path="/agenda" element={<PageErrorBoundary><Agenda /></PageErrorBoundary>} />
            <Route path="/os" element={<PageErrorBoundary><OrdensServico /></PageErrorBoundary>} />
            <Route path="/estoque" element={<PageErrorBoundary><PrivateRoute requireAdmin={true}><Estoque /></PrivateRoute></PageErrorBoundary>} />
            <Route path="/financeiro" element={<PageErrorBoundary><PrivateRoute requireAdmin={true}><Financeiro /></PrivateRoute></PageErrorBoundary>} />
            <Route path="/usuarios" element={<PageErrorBoundary><PrivateRoute requireAdmin={true}><Usuarios /></PrivateRoute></PageErrorBoundary>} />
            <Route path="/config" element={<PageErrorBoundary><PrivateRoute requireAdmin={true}><Configuracoes /></PrivateRoute></PageErrorBoundary>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/recuperar-senha" element={!user ? <RecuperarSenha /> : <Navigate to="/" replace />} />
      <Route path="/recuperar-senha/:token" element={!user ? <ResetarSenha /> : <Navigate to="/" replace />} />
      <Route path="/*" element={<PrivateRoute><AppLayout /></PrivateRoute>} />
    </Routes>
  );
};

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null, retries: 0 };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('PageErrorBoundary caught:', error, info);
    console.error('Component stack:', info?.componentStack || 'N/A');
    this.setState({ info: info?.componentStack || 'N/A' });
    if (error.message?.includes('removeChild') && this.state.retries < 2) {
      setTimeout(() => this.setState(s => ({ hasError: false, error: null, retries: s.retries + 1 })), 200);
    }
  }
  handleRetry = () => {
    this.setState({ hasError: false, error: null, retries: 0 });
  };
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          minHeight: '60vh', color: 'var(--color-text-main)', padding: '2rem', textAlign: 'center'
        }}>
          <ShieldCheck size={40} color="var(--color-danger)" />
          <h3 style={{ margin: '1rem 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Erro ao carregar página</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', maxWidth: 360 }}>
            {this.state.error?.message?.includes('removeChild')
              ? 'Erro de sincronização do React. Clique em "Tentar novamente" para recarregar.'
              : `Ocorreu um erro inesperado: ${this.state.error?.message || 'Erro desconhecido'}`
            }
          </p>
          <details style={{ marginTop: '1rem', textAlign: 'left', fontSize: '0.7rem', color: 'var(--color-text-muted)', maxWidth: '100%', overflow: 'auto' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Stack trace</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(0,0,0,0.05)', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem', maxHeight: '300px', overflow: 'auto' }}>
              {this.state.info || 'N/A'}
            </pre>
          </details>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button onClick={this.handleRetry} className="btn btn-primary">Tentar novamente</button>
            <button onClick={() => window.location.reload()} className="btn btn-secondary">Recarregar página</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  useEffect(() => { migrateDatabase(); }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
