/* ===== PORTFÓLIO DANIELA MENEZES - JAVASCRIPT ===== */

/**
 * 🎨 Inicializar Tema Imediatamente (antes do DOM carregar)
 * Evita flash de tema incorreto
 */
(function() {
  const savedTheme = localStorage.getItem('theme') || 
                     (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
})();

/**
 * 🌐 Sistema de Gerenciamento de Idiomas
 * Permite alternar entre português e inglês
 */
class LanguageManager {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'pt-br';
    this.translations = {};
    this.initialize();
  }
  
  async initialize() {
    try {
      console.log('[LanguageManager] Carregando arquivo de traduções...');
      const response = await fetch('./translations.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      this.translations = await response.json();
      console.log('[LanguageManager] Traduções carregadas:', Object.keys(this.translations));
      
      // Aguardar DOM estar pronto
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.setupLanguageButtons();
          this.applyLanguage(this.currentLanguage);
        });
      } else {
        this.setupLanguageButtons();
        this.applyLanguage(this.currentLanguage);
      }
      
    } catch (error) {
      console.error('[LanguageManager] Erro ao carregar traduções:', error);
    }
  }
  
  setupLanguageButtons() {
    const langButtons = document.querySelectorAll('.lang-btn');
    console.log('[LanguageManager] Encontrados', langButtons.length, 'botões de idioma');
    
    langButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const lang = button.dataset.lang;
        console.log('[LanguageManager] Clique no botão:', lang);
        this.changeLanguage(lang);
      });
    });
  }
  
  changeLanguage(lang) {
    console.log('[LanguageManager] Alterando para:', lang, 'Disponível?', !!this.translations[lang]);
    
    if (!this.translations[lang]) {
      console.warn('[LanguageManager] Idioma não encontrado:', lang);
      return;
    }
    
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Atualizar botões ativos
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.lang === lang) {
        btn.classList.add('active');
      }
    });
    
    this.applyLanguage(lang);
  }
  
  applyLanguage(lang) {
    const t = this.translations[lang];
    if (!t) {
      console.warn('[LanguageManager] Traduções não encontradas para:', lang);
      return;
    }
    
    console.log('[LanguageManager] Aplicando traduções para:', lang);
    let count = 0;
    
    // Aplicar traduções aos elementos com data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      const value = this.getNestedValue(t, key);
      
      if (value) {
        count++;
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = value;
        } else {
          element.textContent = value;
        }
      }
    });
    
    console.log('[LanguageManager] ' + count + ' elementos traduzidos');
    
    // Atualizar data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.dataset.i18nPlaceholder;
      const value = this.getNestedValue(t, key);
      if (value) {
        element.placeholder = value;
        count++;
      }
    });
    
    // Atualizar atributos data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.dataset.i18nTitle;
      const value = this.getNestedValue(t, key);
      if (value) element.title = value;
    });
    
    // Reinicializar efeito de digitação com novo idioma
    this.updateTypingEffect(lang);
  }
  
  getNestedValue(obj, path) {
    const keys = path.split('.');
    let value = obj;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return null;
    }
    
    return value;
  }
  
  updateTypingEffect(lang) {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;
    
    const attrName = lang === 'en' ? 'data-typing-en' : 'data-typing';
    const textsAttr = typingElement.getAttribute(attrName);
    
    if (!textsAttr) return;
    
    try {
      const texts = JSON.parse(textsAttr);
      
      // Limpar elemento
      typingElement.textContent = '';
      
      // Cancelar animação anterior se existir
      if (window.typingInstance) {
        window.typingInstance.stop?.();
      }
      
      // Reiniciar com novos textos
      window.typingInstance = new TypingEffect(typingElement, texts);
      console.log('[LanguageManager] Efeito de digitação atualizado para:', lang);
    } catch (error) {
      console.error('[LanguageManager] Erro ao atualizar digitação:', error);
    }
  }
  
  translate(key) {
    const value = this.getNestedValue(this.translations[this.currentLanguage], key);
    return value || key;
  }
}

class TypingEffect {
  constructor(element, texts, config = {}) {
    this.element = element;
    this.texts = texts;
    this.currentIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.isPaused = false;
    
    // ⚙️ Configurações otimizadas
    this.config = {
      typeSpeed: 80,
      deleteSpeed: 40,
      pauseDuration: 2500,
      startDelay: 1200,
      ...config
    };
    
    this.initialize();
  }
  
  initialize() {
    if (this.isValidSetup()) {
      setTimeout(() => this.animate(), this.config.startDelay);
    }
  }
  
  isValidSetup() {
    return this.element && this.texts && this.texts.length > 0;
  }
  
  animate() {
    const currentText = this.texts[this.currentIndex];
    
    if (this.isPaused) {
      setTimeout(() => {
        this.isPaused = false;
        this.animate();
      }, this.config.pauseDuration);
      return;
    }
    
    this.updateText(currentText);
    this.scheduleNextFrame();
  }
  
  updateText(text) {
    if (this.isDeleting) {
      this.element.textContent = text.substring(0, this.charIndex - 1);
      this.charIndex--;
    } else {
      this.element.textContent = text.substring(0, this.charIndex + 1);
      this.charIndex++;
    }
  }
  
  scheduleNextFrame() {
    const currentText = this.texts[this.currentIndex];
    
    if (!this.isDeleting && this.charIndex === currentText.length) {
      this.handleTypingComplete();
    } else if (this.isDeleting && this.charIndex === 0) {
      this.handleDeletingComplete();
    } else {
      this.scheduleNextAnimation();
    }
  }
  
  handleTypingComplete() {
    this.isPaused = true;
    this.timeoutId = setTimeout(() => {
      this.isDeleting = true;
      this.animate();
    }, this.config.pauseDuration);
  }
  
  handleDeletingComplete() {
    this.isDeleting = false;
    this.currentIndex = (this.currentIndex + 1) % this.texts.length;
    this.isPaused = true;
    setTimeout(() => this.animate(), 600);
  }
  
  scheduleNextAnimation() {
    const speed = this.isDeleting ? this.config.deleteSpeed : this.config.typeSpeed;
    const variance = Math.random() * 30; // Variação natural
    this.timeoutId = setTimeout(() => this.animate(), speed + variance);
  }
  
  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// Inicializar efeito de digitação
document.addEventListener('DOMContentLoaded', () => {
  const typingElement = document.querySelector('.typing-text');
  if (typingElement) {
    const typingData = typingElement.dataset.typing;
    if (typingData) {
      try {
        const texts = JSON.parse(typingData);
        if (texts.length > 0) {
          window.typingInstance = new TypingEffect(typingElement, texts);
        }
      } catch (error) {
        console.error('[TypingEffect] Erro ao parsear dados:', error);
      }
    }
  }
});

/**
 * 🎨 Função Global para Alternar Tema
 * Funciona independentemente da inicialização do app
 */
window.toggleTheme = function() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-bs-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Aplicar novo tema
  html.setAttribute('data-bs-theme', newTheme);
  
  // Atualizar ícone
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = newTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
  }
  
  // Salvar preferência
  localStorage.setItem('theme', newTheme);
  
  // Animação do botão
  const button = document.querySelector('.theme-toggle');
  if (button) {
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 150);
  }
};

/**
 * 🎨 Gerenciador de Tema (Claro/Escuro)
 * Controla alternância e persistência do tema
 */
class ThemeManager {
  constructor() {
    this.documentElement = document.documentElement;
    this.themeIcon = document.getElementById('theme-icon');
    this.toggleButton = document.querySelector('.theme-toggle');
    this.currentTheme = this.getSavedTheme();
    
    this.initialize();
  }
  
  initialize() {
    // Garantir que o ícone esteja correto
    this.updateThemeIcon(this.currentTheme);
    this.bindEventListeners();
  }
  
  getSavedTheme() {
    return localStorage.getItem('theme') || 
           (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }
  
  applyTheme(theme) {
    this.documentElement.setAttribute('data-bs-theme', theme);
    this.updateThemeIcon(theme);
    this.saveTheme(theme);
    this.currentTheme = theme;
  }
  
  updateThemeIcon(theme) {
    if (this.themeIcon) {
      this.themeIcon.className = theme === 'dark' 
        ? 'bi bi-sun-fill' 
        : 'bi bi-moon-fill';
    }
  }
  
  saveTheme(theme) {
    localStorage.setItem('theme', theme);
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    
    // Pequena animação visual
    if (this.toggleButton) {
      this.toggleButton.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.toggleButton.style.transform = 'scale(1)';
      }, 150);
    }
  }
  
  bindEventListeners() {
    // Não adicionar event listener aqui, pois já está no HTML com onclick
    
    // Escuta mudanças de preferência do sistema
    window.matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
              this.applyTheme(e.matches ? 'dark' : 'light');
            }
          });
  }
}

/**
 * 📧 Gerenciador de Formulário de Contato
 * Valida dados e integra com WhatsApp
 */
class ContactForm {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.whatsappNumber = "5511992513139";
    this.fields = ['nome', 'email', 'mensagem'];
    
    if (this.form) {
      this.initialize();
    }
  }
  
  initialize() {
    this.bindEventListeners();
    this.addFieldValidation();
  }
  
  bindEventListeners() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }
  
  addFieldValidation() {
    this.fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('blur', () => this.validateField(field));
        field.addEventListener('input', () => this.clearFieldError(field));
      }
    });
  }
  
  handleSubmit(e) {
    e.preventDefault();
    
    const formData = this.extractFormData();
    const validation = this.validateFormData(formData);
    
    if (!validation.isValid) {
      this.displayError(validation.message);
      return;
    }
    
    this.sendToWhatsApp(formData);
    this.showSuccessMessage();
  }
  
  extractFormData() {
    return this.fields.reduce((data, fieldId) => {
      const field = document.getElementById(fieldId);
      data[fieldId] = field ? field.value.trim() : '';
      return data;
    }, {});
  }
  
  validateFormData(data) {
    const { nome, email, mensagem } = data;
    
    if (!nome) return { isValid: false, message: '📝 Nome é obrigatório.' };
    if (!email) return { isValid: false, message: '📧 E-mail é obrigatório.' };
    if (!this.isValidEmail(email)) return { isValid: false, message: '📧 E-mail inválido.' };
    if (!mensagem) return { isValid: false, message: '💬 Mensagem é obrigatória.' };
    if (mensagem.length < 10) return { isValid: false, message: '💬 Mensagem muito curta (min. 10 caracteres).' };
    
    return { isValid: true };
  }
  
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  validateField(field) {
    const value = field.value.trim();
    const fieldId = field.id;
    
    if (!value) {
      this.setFieldError(field, 'Campo obrigatório');
      return false;
    }
    
    if (fieldId === 'email' && !this.isValidEmail(value)) {
      this.setFieldError(field, 'E-mail inválido');
      return false;
    }
    
    this.clearFieldError(field);
    return true;
  }
  
  setFieldError(field, message) {
    field.classList.add('is-invalid');
    // Implementar feedback visual se necessário
  }
  
  clearFieldError(field) {
    field.classList.remove('is-invalid');
  }
  
  displayError(message) {
    
    alert(message);
  }
  
  showSuccessMessage() {
    // ✅ Feedback de sucesso
    alert('✨ Redirecionando para o WhatsApp!');
  }
  
  sendToWhatsApp(data) {
    const { nome, email, mensagem } = data;
    const whatsappMessage = this.formatWhatsAppMessage(nome, email, mensagem);
    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
  
  formatWhatsAppMessage(nome, email, mensagem) {
    return `🌟 *Contato do Portfólio*

👤 *Nome:* ${nome}
📧 *E-mail:* ${email}

💬 *Mensagem:*
${mensagem}

---
_Enviado via portfólio web_`;
  }
}

// ===== SMOOTH SCROLL ===== 
class SmoothScroll {
  constructor() {
    this.bindEvents();
  }
  
  bindEvents() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
}

// ===== SCROLL REVEAL ===== 
class ScrollReveal {
  constructor() {
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    this.init();
  }
  
  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        this.observerOptions
      );
      
      this.observeElements();
    } else {
      // Fallback para navegadores antigos
      this.fallbackReveal();
    }
  }
  
  observeElements() {
    const elements = document.querySelectorAll('.project-card, .skill-card, .feature-item');
    elements.forEach(el => this.observer.observe(el));
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // Animar barras de progresso das habilidades
        if (entry.target.classList.contains('skill-card')) {
          this.animateProgressBar(entry.target);
        }
        
        this.observer.unobserve(entry.target);
      }
    });
  }
  
  animateProgressBar(skillCard) {
    const progressBar = skillCard.querySelector('.progress-bar');
    if (progressBar) {
      const progress = progressBar.getAttribute('data-progress');
      if (progress) {
        // Delay para criar efeito em cascata
        setTimeout(() => {
          progressBar.style.setProperty('--progress-width', `${progress}%`);
          progressBar.style.width = `${progress}%`;
        }, 300);
      }
    }
  }
  
  fallbackReveal() {
    const elements = document.querySelectorAll('.project-card, .skill-card, .feature-item');
    elements.forEach(el => el.classList.add('visible'));
  }
}

/**
 * 🚀 Inicialização da Aplicação
 * Orquestra todos os componentes do portfólio
 */
class PortfolioApp {
  constructor() {
    this.components = new Map();
    this.isInitialized = false;
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // 🎯 Inicializar efeito de digitação
      this.initializeTypingEffect();
      
      // 🎨 Inicializar gerenciador de tema
      this.components.set('theme', new ThemeManager());
      
      // 📧 Inicializar formulário de contato
      this.components.set('contact', new ContactForm('form-contato'));
      
      // 🔄 Inicializar scroll suave
      this.components.set('scroll', new SmoothScroll());
      
      // ✨ Inicializar reveal de scroll
      this.components.set('reveal', new ScrollReveal());
      
      // 🎉 Marcar como carregado
      this.markAsLoaded();
      
      this.isInitialized = true;
      console.log('🚀 Portfólio inicializado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
    }
  }
  
  initializeTypingEffect() {
    const typingElement = document.querySelector('.typing-text');
    if (typingElement) {
      const texts = JSON.parse(typingElement.dataset.typing || '[]');
      if (texts.length > 0) {
        this.components.set('typing', new TypingEffect(typingElement, texts));
      }
    }
  }
  
  markAsLoaded() {
    document.body.classList.add('loaded');
    
    // 🎯 Remover loader se existir
    const loader = document.querySelector('.page-loader');
    if (loader) {
      setTimeout(() => loader.remove(), 500);
    }
  }
  
  getComponent(name) {
    return this.components.get(name);
  }
}

/**
 * 🎨 Efeitos Especiais da Navbar
 * Gerencia animações e comportamentos da barra de navegação
 */
class NavbarEffects {
  constructor() {
    this.navbar = document.querySelector('.navbar');
    this.navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    this.lastScrollY = 0;
    this.isScrolling = false;
    
    this.initialize();
  }
  
  initialize() {
    if (!this.navbar) return;
    
    this.setupScrollEffects();
    this.setupActiveSection();
    this.setupSmoothScrolling();
  }
  
  setupScrollEffects() {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  }
  
  handleScroll() {
    const currentScrollY = window.scrollY;
    const scrollDifference = Math.abs(currentScrollY - this.lastScrollY);
    
    // Efeito de blur baseado na velocidade do scroll
    if (scrollDifference > 5) {
      this.navbar.style.backdropFilter = 'blur(35px) saturate(220%)';
      this.navbar.style.webkitBackdropFilter = 'blur(35px) saturate(220%)';
      
      // Reset após um tempo
      clearTimeout(this.blurTimeout);
      this.blurTimeout = setTimeout(() => {
        this.navbar.style.backdropFilter = 'blur(30px) saturate(200%)';
        this.navbar.style.webkitBackdropFilter = 'blur(30px) saturate(200%)';
      }, 150);
    }
    
    // Adicionar classe quando rolar
    if (currentScrollY > 50) {
      this.navbar.classList.add('navbar-scrolled');
    } else {
      this.navbar.classList.remove('navbar-scrolled');
    }
    
    this.lastScrollY = currentScrollY;
  }
  
  setupActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    
    if (sections.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.updateActiveLink(entry.target.id);
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-100px 0px -50% 0px'
    });
    
    sections.forEach(section => observer.observe(section));
  }
  
  updateActiveLink(activeId) {
    this.navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${activeId}`) {
        link.classList.add('active');
      }
    });
  }
  
  setupSmoothScrolling() {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          
          if (target) {
            const offsetTop = target.offsetTop - this.navbar.offsetHeight - 20;
            
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
            
            // Fechar menu mobile se estiver aberto
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse.classList.contains('show')) {
              const toggleButton = document.querySelector('.navbar-toggler');
              if (toggleButton) toggleButton.click();
            }
          }
        }
      });
    });
  }
}

// 🎬 Inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Sistema de Tradução
  window.languageManager = new LanguageManager();
  
  window.portfolioApp = new PortfolioApp();
  window.portfolioApp.initialize();
  
  // Inicializar efeitos da navbar
  window.navbarEffects = new NavbarEffects();
  
  console.log('✅ Aplicação inicializada');
});

// 🔄 Reinicializar se necessário após carregamento completo
window.addEventListener('load', () => {
  if (!window.portfolioApp?.isInitialized) {
    window.portfolioApp = new PortfolioApp();
    window.portfolioApp.initialize();
  }
});

// Garantir que as seções estão visíveis
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('#habilidades, #projetos');
  sections.forEach(section => {
    section.style.display = 'block';
    section.style.visibility = 'visible';
    section.style.opacity = '1';
  });
});
