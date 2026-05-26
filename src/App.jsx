import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, Settings, LogOut, Wrench, Package,
  ChevronDown, ChevronRight, Bell, Moon, Sun, Menu, DollarSign,
  ChevronLeft, ShieldCheck, Building2
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { migrateDatabase } from './lib/api';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Veiculos from './pages/Veiculos';
import OrdensServico from './pages/OrdensServico';
import Login from './pages/Login';
import RecuperarSenha from './pages/RecuperarSenha';
import Usuarios from './pages/Usuarios';
import Estoque from './pages/Estoque';
import Financeiro from './pages/Financeiro';
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
      <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Rede Lopes</span>
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

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo_rede_lopes.png" alt="Rede Lopes" style={{
              width: 38, height: 38, borderRadius: 10,
              objectFit: 'cover', boxShadow: '0 2px 12px rgba(37,99,235,0.3)',
            }} />
            <div>
              <h2 style={{ fontSize: '0.95rem', margin: 0, color: 'white', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                REDE LOPES
              </h2>
              <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em' }}>
                LUIZCAR ERP
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: '0.5rem 0', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '0 1.5rem 1rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.4, fontWeight: 400 }}>
            Soluções inteligentes para empresas
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
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 8, height: 8, background: 'var(--color-danger)',
                  borderRadius: '50%', border: '2px solid var(--color-topbar)',
                }} />
              </button>

              {notificationsOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setNotificationsOpen(false)} />
                  <div className="glass-panel" style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 340, zIndex: 50, overflow: 'hidden', animation: 'slideDown 0.15s ease',
                    boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)',
                  }}>
                    <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: '0.8125rem' }}>
                      Notificações
                    </div>
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <p style={{ fontSize: '0.8125rem' }}>Nenhuma notificação nova</p>
                    </div>
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
      <Route path="/*" element={<PrivateRoute><AppLayout /></PrivateRoute>} />
    </Routes>
  );
};

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retries: 0 };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('PageErrorBoundary caught:', error, info);
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
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
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
