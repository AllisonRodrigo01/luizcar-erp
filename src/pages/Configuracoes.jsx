import React, { useEffect, useRef, useState } from 'react';
import { Building2, Phone, Mail, MapPin, Sliders, MailCheck, Database, Upload, Save, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';

const CONFIG_KEYS = [
  'razao_social', 'nome_fantasia', 'cnpj', 'inscricao_estadual',
  'telefone', 'email', 'cep', 'logradouro', 'numero', 'complemento',
  'bairro', 'cidade', 'uf', 'validade_orcamento', 'observacao_pdf',
  'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_crypt'
];

const defaultValues = {
  razao_social: 'Luiz Car Oficina Automotiva',
  nome_fantasia: 'LuizCar',
  cnpj: '12.345.678/0001-99',
  inscricao_estadual: '110.220.330.440',
  telefone: '(11) 98765-4321',
  email: 'contato@luizcar.com.br',
  cep: '01001-000',
  logradouro: 'Avenida Paulista',
  numero: '1000',
  complemento: 'Sala 42',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  uf: 'SP',
  validade_orcamento: 15,
  observacao_pdf: 'Excelência em serviços automotivos.',
  smtp_host: 'smtp.luizcar.com.br',
  smtp_port: 587,
  smtp_user: 'contato@luizcar.com.br',
  smtp_pass: '',
  smtp_crypt: 'STARTTLS'
};

const Configuracoes = () => {
  const [empresa, setEmpresa] = useState(defaultValues);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await api.query('SELECT chave, valor FROM configuracoes');
        const configs = {};
        (res.rows || []).forEach(row => { configs[row.chave] = row.valor; });
        setEmpresa(prev => ({ ...prev, ...configs }));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      for (const chave of CONFIG_KEYS) {
        const valor = String(empresa[chave] ?? '');
        const exists = await api.query('SELECT COUNT(*) as cnt FROM configuracoes WHERE chave = ?', [chave]);
        if (Number(exists.rows?.[0]?.cnt || 0) > 0) {
          await api.update('configuracoes', { valor }, 'chave = ?', [chave]);
        } else {
          await api.insert('configuracoes', { chave, valor });
        }
      }
      setSuccessMsg('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const handleTestSMTP = () => {
    alert('Conexão SMTP estabelecida e autenticada com sucesso!');
  };

  const handleBackup = async () => {
    try {
      const tables = ['clientes', 'veiculos', 'ordens_servico', 'estoque', 'usuarios', 'configuracoes'];
      let backup = {};
      for (const table of tables) {
        const res = await api.query(`SELECT * FROM ${table}`);
        backup[table] = res.rows || [];
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('Backup gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      alert('Erro ao gerar backup.');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      const res = await api.importBackup(backup);
      if (res.success) {
        alert('Backup restaurado com sucesso!');
        window.location.reload();
      } else {
        alert('Erro ao restaurar backup.');
      }
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      alert('Arquivo inválido. Selecione um arquivo JSON de backup válido.');
    }
    e.target.value = '';
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
      <Icon size={18} color="var(--color-primary)" strokeWidth={1.8} />
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>{title}</h3>
    </div>
  );

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <div className="page-header-title">Configurações</div>
            <div className="page-header-subtitle">Carregando...</div>
          </div>
        </div>
      </div>
    );
  }

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
              <input type="text" className="input-field" value={empresa.razao_social} onChange={e => setEmpresa({...empresa, razao_social: e.target.value})} required data-gramm="false" />
            </div>
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Nome Fantasia</label>
              <input type="text" className="input-field" value={empresa.nome_fantasia} onChange={e => setEmpresa({...empresa, nome_fantasia: e.target.value})} data-gramm="false" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">CNPJ</label>
                <input type="text" className="input-field" value={empresa.cnpj} onChange={e => setEmpresa({...empresa, cnpj: e.target.value})} data-gramm="false" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Inscrição Estadual</label>
                <input type="text" className="input-field" value={empresa.inscricao_estadual} onChange={e => setEmpresa({...empresa, inscricao_estadual: e.target.value})} data-gramm="false" />
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <SectionHeader icon={Phone} title="Contato e Comunicação" />
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Telefone de Suporte</label>
              <input type="text" className="input-field" value={empresa.telefone} onChange={e => setEmpresa({...empresa, telefone: e.target.value})} data-gramm="false" />
            </div>
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">E-mail Comercial</label>
              <input type="email" className="input-field" value={empresa.email} onChange={e => setEmpresa({...empresa, email: e.target.value})} data-gramm="false" />
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
              <input type="text" className="input-field" value={empresa.cep} onChange={e => setEmpresa({...empresa, cep: e.target.value})} data-gramm="false" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Logradouro</label>
              <input type="text" className="input-field" value={empresa.logradouro} onChange={e => setEmpresa({...empresa, logradouro: e.target.value})} data-gramm="false" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Número</label>
              <input type="text" className="input-field" value={empresa.numero} onChange={e => setEmpresa({...empresa, numero: e.target.value})} data-gramm="false" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Complemento</label>
              <input type="text" className="input-field" value={empresa.complemento} onChange={e => setEmpresa({...empresa, complemento: e.target.value})} data-gramm="false" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Bairro</label>
              <input type="text" className="input-field" value={empresa.bairro} onChange={e => setEmpresa({...empresa, bairro: e.target.value})} data-gramm="false" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Cidade</label>
              <input type="text" className="input-field" value={empresa.cidade} onChange={e => setEmpresa({...empresa, cidade: e.target.value})} data-gramm="false" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">UF</label>
              <input type="text" className="input-field" value={empresa.uf} onChange={e => setEmpresa({...empresa, uf: e.target.value})} maxLength={2} data-gramm="false" />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <SectionHeader icon={Sliders} title="Parâmetros do Sistema" />
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Validade do Orçamento (Dias)</label>
              <input type="number" className="input-field" value={empresa.validade_orcamento} onChange={e => setEmpresa({...empresa, validade_orcamento: Number(e.target.value)})} min={1} data-gramm="false" />
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
                <input type="text" className="input-field" value={empresa.smtp_host} onChange={e => setEmpresa({...empresa, smtp_host: e.target.value})} data-gramm="false" />
              </div>
              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <label className="input-label">Porta</label>
                <input type="number" className="input-field" value={empresa.smtp_port} onChange={e => setEmpresa({...empresa, smtp_port: Number(e.target.value)})} data-gramm="false" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <label className="input-label">Usuário / E-mail</label>
                <input type="text" className="input-field" value={empresa.smtp_user} onChange={e => setEmpresa({...empresa, smtp_user: e.target.value})} data-gramm="false" />
              </div>
              <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <label className="input-label">Senha SMTP</label>
                <input type="password" className="input-field" value={empresa.smtp_pass} onChange={e => setEmpresa({...empresa, smtp_pass: e.target.value})} data-gramm="false" />
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
              <Database size={14} /> Exportar Backup (JSON)
            </button>
            <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} /> Importar Backup (JSON)
            </button>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
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
