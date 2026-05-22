import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, Settings, LogOut, Wrench, Package,
  ChevronDown, ChevronRight, Bell, Moon, Sun, Menu, DollarSign,
  ChevronLeft, ShieldCheck, Building2
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
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

const SidebarItem = ({ icon: Icon, label, to, requireAdmin, subItems }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (requireAdmin && user?.role !== 'admin') {
    return null;
  }

  const hasSubItems = subItems && subItems.length > 0;
  const isActive = location.pathname === to || (hasSubItems && subItems.some(item => location.pathname === item.to));

  return (
    <div style={{ marginBottom: '0.125rem' }}>
      {hasSubItems ? (
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 1.25rem',
            cursor: 'pointer',
            color: isActive || isOpen ? '#ffffff' : '#94a3b8',
            background: isActive || isOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
            borderRadius: '6px',
            margin: '0 0.5rem',
            transition: 'all var(--transition-fast)',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          <Icon size={17} strokeWidth={1.8} />
          <span style={{ flex: 1 }}>{label}</span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      ) : (
        <Link
          to={to}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 1.25rem',
            textDecoration: 'none',
            color: isActive ? '#ffffff' : '#94a3b8',
            background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
            borderRadius: '6px',
            margin: '0 0.5rem',
            transition: 'all var(--transition-fast)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
          }}
        >
          <Icon size={17} strokeWidth={1.8} />
          <span style={{ flex: 1 }}>{label}</span>
        </Link>
      )}

      {hasSubItems && isOpen && (
        <div style={{ padding: '0.25rem 0 0.25rem 2.5rem' }}>
          {subItems.map((subItem, index) => {
            const isSubActive = location.pathname === subItem.to;
            return (
              <Link
                key={index}
                to={subItem.to}
                style={{
                  display: 'block',
                  padding: '0.4rem 1rem',
                  textDecoration: 'none',
                  color: isSubActive ? '#ffffff' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  borderRadius: '4px',
                  margin: '0 0.5rem 0 0',
                  background: isSubActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {subItem.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
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
    '': 'Dashboard',
    'clientes': 'Clientes',
    'veiculos': 'Veículos',
    'os': 'Ordens de Serviço',
    'estoque': 'Estoque',
    'financeiro': 'Financeiro',
    'usuarios': 'Funcionários',
    'config': 'Configurações',
    'login': 'Login',
    'recuperar-senha': 'Recuperar Senha',
  };

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
      <Building2 size={13} />
      <span style={{ fontWeight: 500 }}>Rede Lopes</span>
      {paths.length > 0 && paths.map((p, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>{labels[p] || p}</span>
        </React.Fragment>
      ))}
    </nav>
  );
};

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div className="app-container">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileSidebarOpen ? 'open' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Sidebar Enterprise */}
      <aside
        className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}
        style={{
          width: sidebarOpen ? 252 : 0,
          minWidth: sidebarOpen ? 252 : 0,
          opacity: sidebarOpen ? 1 : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo_rede_lopes.png"
              alt="Rede Lopes"
              style={{
                width: 36, height: 36, borderRadius: 8,
                objectFit: 'cover',
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              }}
            />
            <div>
              <h2 style={{ fontSize: '0.95rem', margin: 0, color: 'white', fontWeight: 700, letterSpacing: '-0.01em' }}>REDE LOPES</h2>
              <p style={{ margin: 0, fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.04em' }}>LUIZCAR ERP</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '0.75rem 0', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '0 1.25rem 0.75rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
            Desenvolvendo soluções inteligentes para empresas
          </div>
          <div className="sidebar-section-label">Principal</div>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />

          <div className="sidebar-section-label">Cadastros</div>
          <SidebarItem icon={Users} label="Clientes" to="/clientes" />
          <SidebarItem icon={Car} label="Veículos" to="/veiculos" />

          <div className="sidebar-section-label">Operacional</div>
          <SidebarItem icon={Wrench} label="Ordens de Serviço" to="/os" />
          <SidebarItem icon={Package} label="Estoque" to="/estoque" requireAdmin={true} />

          <div className="sidebar-section-label">Administrativo</div>
          <SidebarItem icon={DollarSign} label="Financeiro" to="/financeiro" requireAdmin={true} />
          <SidebarItem icon={Users} label="Funcionários" to="/usuarios" requireAdmin={true} />
          <SidebarItem icon={Settings} label="Configurações" to="/config" requireAdmin={true} />
        </div>

        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.6875rem',
          color: 'rgba(255,255,255,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <ShieldCheck size={12} />
            <span>{user?.role === 'admin' ? 'Administrador' : 'Funcionário'}</span>
          </div>
          <div>v3.4.0 · Enterprise</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setMobileSidebarOpen(prev => !prev);
                } else {
                  setSidebarOpen(prev => !prev);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '0.35rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-base)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>
            <Breadcrumb />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              {getGreeting()}, <strong style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{user?.name?.split(' ')[0]}</strong>
            </span>

            <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 0.25rem' }}></div>

            {theme === 'dark'
              ? <Sun size={16} className="theme-toggle" onClick={toggleTheme} color="#fbbf24" />
              : <Moon size={16} className="theme-toggle" onClick={toggleTheme} />
            }

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: '0.35rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <Bell size={17} />
                <span style={{
                  position: 'absolute',
                  top: 2, right: 2,
                  width: 7, height: 7,
                  background: 'var(--color-danger)',
                  borderRadius: '50%',
                  border: '2px solid var(--color-topbar)',
                }}></span>
              </button>

              {notificationsOpen && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 40,
                    }}
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 320,
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 50,
                    overflow: 'hidden',
                    animation: 'fadeIn 0.15s ease',
                  }}>
                    <div style={{
                      padding: '0.875rem 1rem',
                      borderBottom: '1px solid var(--color-border)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--color-text-main)',
                    }}>
                      Notificações
                    </div>
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      Nenhuma notificação nova
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 0.25rem' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '6px', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-base)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 600, fontSize: '0.75rem',
              }}>
                {user?.name?.charAt(0)}
              </div>
            </div>

            <button
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '0.35rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = 'var(--color-danger)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div style={{ padding: '1.5rem 2rem', flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/veiculos" element={<Veiculos />} />
            <Route path="/os" element={<OrdensServico />} />
            <Route path="/estoque" element={<PrivateRoute requireAdmin={true}><Estoque /></PrivateRoute>} />
            <Route path="/financeiro" element={<PrivateRoute requireAdmin={true}><Financeiro /></PrivateRoute>} />
            <Route path="/usuarios" element={<PrivateRoute requireAdmin={true}><Usuarios /></PrivateRoute>} />
            <Route path="/config" element={<PrivateRoute requireAdmin={true}><Configuracoes /></PrivateRoute>} />
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

function App() {
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
