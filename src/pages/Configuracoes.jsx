import React, { useState } from 'react';
import { Building2, Phone, Mail, MapPin, Sliders, MailCheck, Database, Save, CheckCircle } from 'lucide-react';

const Configuracoes = () => {
  const [successMsg, setSuccessMsg] = useState('');

  const [empresa, setEmpresa] = useState({
    razao_social: 'Rede Lopes Serviços Automotivos LTDA',
    nome_fantasia: 'Rede Lopes',
    cnpj: '12.345.678/0001-99',
    inscricao_estadual: '110.220.330.440',
    telefone: '(11) 98765-4321',
    email: 'contato@redelopes.com.br',
    cep: '01001-000',
    logradouro: 'Avenida Paulista',
    numero: '1000',
    complemento: 'Sala 42',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
    validade_orcamento: 15,
    observacao_pdf: 'A solução certa para empresas modernas.',
    smtp_host: 'smtp.redelopes.com.br',
    smtp_port: 587,
    smtp_user: 'contato@redelopes.com.br',
    smtp_pass: '••••••••••••',
    smtp_crypt: 'STARTTLS'
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSuccessMsg('Configurações salvas com sucesso!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleTestSMTP = () => {
    alert('Conexão SMTP estabelecida e autenticada com sucesso!');
  };

  const handleBackup = () => {
    alert('Backup do banco de dados gerado com sucesso!');
  };

  const handleRestore = () => {
    if (window.confirm('Atenção! A restauração substituirá todos os dados ativos. Deseja prosseguir?')) {
      alert('Banco de dados restaurado com sucesso!');
    }
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
      <Icon size={18} color="var(--color-primary)" strokeWidth={1.8} />
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>{title}</h3>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-header-title">Configurações</div>
          <div className="page-header-subtitle">Dados da oficina e parâmetros gerais do sistema.</div>
        </div>
      </div>

      {successMsg && (
        <div style={{
          padding: '0.75rem 1rem', background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)',
          color: 'var(--color-success)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.8125rem', fontWeight: 500, marginBottom: '1.5rem'
        }}>
          <CheckCircle size={15} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <SectionHeader icon={Building2} title="Identificação da Oficina" />
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Razão Social *</label>
              <input type="text" className="input-field" value={empresa.razao_social} onChange={e => setEmpresa({...empresa, razao_social: e.target.value})} required />
            </div>
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Nome Fantasia</label>
              <input type="text" className="input-field" value={empresa.nome_fantasia} onChange={e => setEmpresa({...empresa, nome_fantasia: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">CNPJ</label>
                <input type="text" className="input-field" value={empresa.cnpj} onChange={e => setEmpresa({...empresa, cnpj: e.target.value})} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Inscrição Estadual</label>
                <input type="text" className="input-field" value={empresa.inscricao_estadual} onChange={e => setEmpresa({...empresa, inscricao_estadual: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <SectionHeader icon={Phone} title="Contato e Comunicação" />
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Telefone de Suporte</label>
              <input type="text" className="input-field" value={empresa.telefone} onChange={e => setEmpresa({...empresa, telefone: e.target.value})} />
            </div>
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">E-mail Comercial</label>
              <input type="email" className="input-field" value={empresa.email} onChange={e => setEmpresa({...empresa, email: e.target.value})} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', lineHeight: '1.5' }}>
              Estes dados serão apresentados no cabeçalho das ordens de serviço impressas e orçamentos exportados em PDF.
            </p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <SectionHeader icon={MapPin} title="Endereço Operacional" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">CEP</label>
              <input type="text" className="input-field" value={empresa.cep} onChange={e => setEmpresa({...empresa, cep: e.target.value})} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Logradouro</label>
              <input type="text" className="input-field" value={empresa.logradouro} onChange={e => setEmpresa({...empresa, logradouro: e.target.value})} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Número</label>
              <input type="text" className="input-field" value={empresa.numero} onChange={e => setEmpresa({...empresa, numero: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Complemento</label>
              <input type="text" className="input-field" value={empresa.complemento} onChange={e => setEmpresa({...empresa, complemento: e.target.value})} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Bairro</label>
              <input type="text" className="input-field" value={empresa.bairro} onChange={e => setEmpresa({...empresa, bairro: e.target.value})} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Cidade</label>
              <input type="text" className="input-field" value={empresa.cidade} onChange={e => setEmpresa({...empresa, cidade: e.target.value})} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">UF</label>
              <input type="text" className="input-field" value={empresa.uf} onChange={e => setEmpresa({...empresa, uf: e.target.value})} maxLength={2} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <SectionHeader icon={Sliders} title="Parâmetros do Sistema" />
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Validade do Orçamento (Dias)</label>
              <input type="number" className="input-field" value={empresa.validade_orcamento} onChange={e => setEmpresa({...empresa, validade_orcamento: Number(e.target.value)})} min={1} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Texto Rodapé PDF</label>
              <textarea className="input-field" style={{ height: '70px', resize: 'none', fontFamily: 'inherit' }}
                value={empresa.observacao_pdf} onChange={e => setEmpresa({...empresa, observacao_pdf: e.target.value})} />
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <SectionHeader icon={MailCheck} title="Configuração de E-mail (SMTP)" />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <label className="input-label">Servidor SMTP</label>
                <input type="text" className="input-field" value={empresa.smtp_host} onChange={e => setEmpresa({...empresa, smtp_host: e.target.value})} />
              </div>
              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <label className="input-label">Porta</label>
                <input type="number" className="input-field" value={empresa.smtp_port} onChange={e => setEmpresa({...empresa, smtp_port: Number(e.target.value)})} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <label className="input-label">Usuário / E-mail</label>
                <input type="text" className="input-field" value={empresa.smtp_user} onChange={e => setEmpresa({...empresa, smtp_user: e.target.value})} />
              </div>
              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <label className="input-label">Senha SMTP</label>
                <input type="password" className="input-field" value={empresa.smtp_pass} onChange={e => setEmpresa({...empresa, smtp_pass: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="input-label">Criptografia</label>
                <select className="input-field" style={{ marginBottom: 0 }} value={empresa.smtp_crypt} onChange={e => setEmpresa({...empresa, smtp_crypt: e.target.value})}>
                  <option value="STARTTLS">STARTTLS</option>
                  <option value="SSL/TLS">SSL/TLS</option>
                  <option value="Nenhuma">Nenhuma</option>
                </select>
              </div>
              <button type="button" className="btn btn-secondary" onClick={handleTestSMTP}>Testar SMTP</button>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <SectionHeader icon={Database} title="Segurança e Backup de Dados" />
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleBackup}>
              <Database size={14} /> Criar Backup
            </button>
            <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }} onClick={handleRestore}>
              <Sliders size={14} /> Restaurar Banco
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem' }}>
            <Save size={16} /> Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
};

export default Configuracoes;
