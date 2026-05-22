import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Users, ShieldCheck, Wrench, Headphones } from 'lucide-react';

const roleConfig = {
  'Admin': { icon: ShieldCheck, color: 'var(--color-secondary)', bg: 'rgba(99,102,241,0.08)' },
  'Mecanico': { icon: Wrench, color: 'var(--color-info)', bg: 'rgba(2,132,199,0.08)' },
  'Atendimento': { icon: Headphones, color: 'var(--color-warning)', bg: 'rgba(217,119,6,0.08)' },
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([
    { id: 1, nome: 'Administrador', login: 'admin', nivel_acesso: 'Admin' },
    { id: 2, nome: 'João Mecânico', login: 'joao.mec', nivel_acesso: 'Mecanico' },
    { id: 3, nome: 'Maria Atendimento', login: 'maria.atend', nivel_acesso: 'Atendimento' },
  ]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-header-title">Gerenciar Funcionários</div>
          <div className="page-header-subtitle">Crie e gerencie os perfis de acesso dos colaboradores.</div>
        </div>
        <button className="btn btn-primary">
          <UserPlus size={16} /> Novo Funcionário
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Login</th>
              <th>Nível de Acesso</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => {
              const cfg = roleConfig[user.nivel_acesso] || roleConfig['Atendimento'];
              const Icon = cfg.icon;
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: `hsl(${(user.id * 70) % 360}, 55%, 48%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 600, fontSize: '0.75rem'
                      }}>
                        {user.nome.charAt(0)}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>{user.nome}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{user.login}</td>
                  <td>
                    <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={10} strokeWidth={2} /> {user.nivel_acesso}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ padding: '0.35rem', marginRight: '2px' }}>
                      <Edit2 size={14} color="var(--color-primary)" />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '0.35rem', color: 'var(--color-danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Usuarios;
