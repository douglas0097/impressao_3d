import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiBox, FiEye, FiEyeOff, FiLock, FiMail, FiLayers, FiTrendingUp } from 'react-icons/fi';
import BrandIsotype from '../../components/BrandIsotype';
import Input from '../../components/Input';
import Button from '../../components/Button';
import './AuthLogin.css';

export default function AuthLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    navigate('/');
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="Sobre o 3D Manager">
        <div className="login-brand"><span className="login-brand-icon"><BrandIsotype size={28} /></span><div><span className="login-brand-name">3D Manager</span><span className="login-brand-caption">STUDIO & PRICING</span></div></div>
        <div className="login-story-content">
          <span className="login-eyebrow"><span /> DO MODELO AO RESULTADO</span>
          <h2>Sua criatividade.<br />Uma gestão à altura.</h2>
          <p>Transforme suas impressões em um negócio organizado. Custos claros, orçamentos precisos e mais controle em cada projeto.</p>
          <div className="login-art" aria-hidden="true">
            <div className="login-art-grid" />
            <div className="login-orbit login-orbit-one" /><div className="login-orbit login-orbit-two" />
            <div className="login-object"><BrandIsotype size={180} /></div>
            <span className="login-art-tag"><span /> Cada camada conta.</span>
            <span className="login-art-coordinate">X 120 · Y 120 · Z 080</span>
          </div>
          <div className="login-features">
            <span><FiTrendingUp size={16} /> Orçamentos precisos</span>
            <span><FiLayers size={16} /> Controle de filamentos</span>
            <span><FiBox size={16} /> Gestão de pedidos</span>
          </div>
        </div>
        <p className="login-story-footer">Mais controle para criar o que vem a seguir.</p>
      </section>

      <section className="login-access" aria-labelledby="login-title">
        <div className="login-mobile-brand"><BrandIsotype size={26} /><span>3D Manager</span></div>
        <div className="login-form-wrap">
          <span className="login-welcome-icon"><FiLock size={22} /></span>
          <p className="login-form-eyebrow">SEU ESPAÇO DE TRABALHO</p>
          <h1 id="login-title">Bem-vindo de volta</h1>
          <p className="login-description">Entre na sua conta para continuar gerenciando suas impressões.</p>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div>
              <label htmlFor="login-email" className="form-label">E-mail</label>
              <div className="login-input-wrap"><FiMail className="login-input-icon" size={18} aria-hidden="true" /><Input id="login-email" name="email" type="email" autoComplete="username" placeholder="voce@empresa.com" maxLength={254} /></div>
            </div>
            <div>
              <label htmlFor="login-password" className="form-label">Senha</label>
              <div className="login-input-wrap"><FiLock className="login-input-icon" size={18} aria-hidden="true" /><Input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" className="login-password" /><button type="button" className="login-password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword}>{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button></div>
            </div>
            <Button variant="primary" type="submit" fullWidth className="login-submit">Entrar na minha conta <FiArrowRight size={18} aria-hidden="true" /></Button>
          </form>
          <p className="login-help">Precisa de acesso ou esqueceu sua senha?<br /><span>Entre em contato com o administrador do sistema.</span></p>
        </div>
        <footer className="login-access-footer"><span>3D Manager</span><span>Gestão para impressão 3D</span></footer>
      </section>
    </main>
  );
}
