// ============================================
// CONFIGURAÇÕES MODULE
// ============================================

const ConfiguracoesModule = {
  render(container) {
    const currentUser = auth.getCurrentUser();
    const config = storage.getConfiguracoes();
    const currentTheme = document.documentElement.getAttribute('data-theme');

    container.innerHTML = `
      <div class="grid grid-2" style="gap: var(--space-xl);">
        <div>
          <!-- Profile Settings -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">👤 Perfil</h3>
            </div>
            <div class="card-body">
              <div style="text-align: center; margin-bottom: var(--space-lg);">
                <div class="profile-avatar-large" id="profile-avatar-display" style="
                  width: 120px;
                  height: 120px;
                  border-radius: 50%;
                  background: var(--gradient-primary);
                  color: white;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 3rem;
                  font-weight: 700;
                  margin-bottom: var(--space-md);
                  cursor: pointer;
                  transition: transform var(--transition-normal);
                  ${config.profileImage ? `background-image: url(${config.profileImage}); background-size: cover; background-position: center;` : ''}
                " onclick="document.getElementById('profile-image-input').click()">
                  ${config.profileImage ? '' : (config.displayName || currentUser.nome).charAt(0).toUpperCase()}
                </div>
                <input type="file" id="profile-image-input" accept="image/*" style="display: none;">
                <div style="font-size: 0.875rem; color: var(--color-text-secondary);">
                  Clique na foto para alterar
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Nome de Exibição</label>
                <input type="text" class="form-input" id="display-name-input" value="${config.displayName || currentUser.nome}" placeholder="Seu nome">
                <div class="form-help">Este nome aparecerá no canto superior direito</div>
              </div>

              <button class="btn btn-primary" id="save-profile-btn" style="width: 100%;">
                💾 Salvar Perfil
              </button>
            </div>
          </div>

          <!-- Appearance -->
          <div class="card" style="margin-top: var(--space-lg);">
            <div class="card-header">
              <h3 class="card-title">🎨 Aparência</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Tema</label>
                <div style="display: flex; gap: var(--space-md);">
                  <button class="btn ${currentTheme === 'light' ? 'btn-primary' : 'btn-secondary'}" id="theme-light">
                    ☀️ Claro
                  </button>
                  <button class="btn ${currentTheme === 'dark' ? 'btn-primary' : 'btn-secondary'}" id="theme-dark">
                    🌙 Escuro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <!-- Security Settings -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">🔒 Segurança</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Usuário Atual</label>
                <input type="text" class="form-input" value="${currentUser.username}" disabled>
              </div>

              <button class="btn btn-secondary" id="change-username-btn" style="width: 100%; margin-bottom: var(--space-md);">
                👤 Alterar Nome de Usuário
              </button>

              <button class="btn btn-secondary" id="change-password-btn" style="width: 100%;">
                🔑 Alterar Senha
              </button>
            </div>
          </div>

          <!-- Backup & Data -->
          <div class="card" style="margin-top: var(--space-lg);">
            <div class="card-header">
              <h3 class="card-title">💾 Backup & Dados</h3>
            </div>
            <div class="card-body">
              <p style="margin-bottom: var(--space-md); color: var(--color-text-secondary);">
                Faça backup dos seus dados regularmente para evitar perda de informações.
              </p>
              
              <button class="btn btn-primary" id="export-data-btn" style="width: 100%; margin-bottom: var(--space-sm);">
                📥 Exportar Dados (Backup)
              </button>
              
              <button class="btn btn-secondary" id="import-data-btn" style="width: 100%; margin-bottom: var(--space-sm);">
                📤 Importar Dados
              </button>
              
              <input type="file" id="import-file-input" accept=".json" style="display: none;">
              
              <hr style="margin: var(--space-lg) 0; border: none; border-top: 1px solid var(--color-border);">
              
              <div class="alert alert-danger">
                <strong>⚠️ Zona de Perigo</strong>
              </div>
              
              <button class="btn btn-danger" id="clear-data-btn" style="width: 100%;">
                🗑️ Limpar Todos os Dados
              </button>
              <div class="form-help" style="margin-top: var(--space-xs);">
                Esta ação não pode ser desfeita!
              </div>
            </div>
          </div>

          <!-- System Stats -->
          <div class="card" style="margin-top: var(--space-lg);">
            <div class="card-header">
              <h3 class="card-title">📊 Estatísticas do Sistema</h3>
            </div>
            <div class="card-body">
              ${this.renderStats()}
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  },

  renderStats() {
    const clientes = storage.getClientes();
    const agentes = storage.getAgentes();
    const apartamentos = storage.getApartamentos();
    const reservas = storage.getReservas();

    return `
      <div class="stats-list">
        <div class="stat-item">
          <span>Total de Clientes:</span>
          <strong>${clientes.length}</strong>
        </div>
        <div class="stat-item">
          <span>Total de Agentes:</span>
          <strong>${agentes.length}</strong>
        </div>
        <div class="stat-item">
          <span>Total de Apartamentos:</span>
          <strong>${apartamentos.length}</strong>
        </div>
        <div class="stat-item">
          <span>Total de Reservas:</span>
          <strong>${reservas.length}</strong>
        </div>
      </div>
    `;
  },

  attachEventListeners() {
    // Profile image upload
    document.getElementById('profile-image-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target.result;
          const display = document.getElementById('profile-avatar-display');
          display.style.backgroundImage = `url(${imageData})`;
          display.style.backgroundSize = 'cover';
          display.style.backgroundPosition = 'center';
          display.textContent = '';

          // Save temporarily (will be saved when user clicks save)
          this.tempProfileImage = imageData;
        };
        reader.readAsDataURL(file);
      }
    });

    // Save profile
    document.getElementById('save-profile-btn').addEventListener('click', () => {
      const displayName = document.getElementById('display-name-input').value.trim();

      if (!displayName) {
        UI.showToast('Por favor, insira um nome de exibição', 'error');
        return;
      }

      const updates = {
        displayName: displayName
      };

      if (this.tempProfileImage) {
        updates.profileImage = this.tempProfileImage;
      }

      storage.updateConfiguracoes(updates);

      // Update header
      this.updateHeaderProfile();

      UI.showToast('Perfil atualizado com sucesso!', 'success');
      this.tempProfileImage = null;
    });

    // Theme buttons
    document.getElementById('theme-light').addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      storage.updateConfiguracoes({ tema: 'light' });
      this.render(document.getElementById('main-content'));
    });

    document.getElementById('theme-dark').addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      storage.updateConfiguracoes({ tema: 'dark' });
      this.render(document.getElementById('main-content'));
    });

    // Change username
    document.getElementById('change-username-btn').addEventListener('click', () => {
      this.showChangeUsernameModal();
    });

    // Change password
    document.getElementById('change-password-btn').addEventListener('click', () => {
      this.showChangePasswordModal();
    });

    // Export data
    document.getElementById('export-data-btn').addEventListener('click', () => {
      this.exportData();
    });

    // Import data
    document.getElementById('import-data-btn').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', (e) => {
      this.importData(e.target.files[0]);
    });

    // Clear data
    document.getElementById('clear-data-btn').addEventListener('click', () => {
      this.clearAllData();
    });
  },

  async showChangeUsernameModal() {
    const currentUser = auth.getCurrentUser();

    const formHtml = `
      <form id="change-username-form">
        <div class="form-group">
          <label class="form-label form-label-required">Senha Atual</label>
          <input type="password" class="form-input" name="currentPassword" required autocomplete="current-password">
          <div class="form-help">Confirme sua senha para continuar</div>
        </div>

        <div class="form-group">
          <label class="form-label form-label-required">Novo Nome de Usuário</label>
          <input type="text" class="form-input" name="newUsername" value="${currentUser.username}" required autocomplete="username">
        </div>
      </form>
    `;

    const result = await UI.showModal(
      'Alterar Nome de Usuário',
      formHtml,
      {
        confirmText: 'Alterar',
        cancelText: 'Cancelar',
        returnElement: true
      }
    );

    if (!result) return;

    const { modal, close } = result;

    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      const form = modal.querySelector('#change-username-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const currentPassword = formData.get('currentPassword');
      const newUsername = formData.get('newUsername').trim();

      // Verify current password
      if (!auth.verifyPassword(currentUser.username, currentPassword)) {
        UI.showToast('Senha atual incorreta', 'error');
        return;
      }

      // Update username
      if (auth.updateUsername(currentUser.userId, newUsername)) {
        UI.showToast('Nome de usuário alterado com sucesso!', 'success');
        close();

        // Reload to update session
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        UI.showToast('Erro ao alterar nome de usuário', 'error');
      }
    });
  },

  async showChangePasswordModal() {
    const currentUser = auth.getCurrentUser();

    const formHtml = `
      <form id="change-password-form">
        <div class="form-group">
          <label class="form-label form-label-required">Senha Atual</label>
          <input type="password" class="form-input" name="currentPassword" required autocomplete="current-password">
        </div>

        <div class="form-group">
          <label class="form-label form-label-required">Nova Senha</label>
          <input type="password" class="form-input" name="newPassword" required autocomplete="new-password" minlength="6">
          <div class="form-help">Mínimo de 6 caracteres</div>
        </div>

        <div class="form-group">
          <label class="form-label form-label-required">Confirmar Nova Senha</label>
          <input type="password" class="form-input" name="confirmPassword" required autocomplete="new-password" minlength="6">
        </div>
      </form>
    `;

    const result = await UI.showModal(
      'Alterar Senha',
      formHtml,
      {
        confirmText: 'Alterar',
        cancelText: 'Cancelar',
        returnElement: true
      }
    );

    if (!result) return;

    const { modal, close } = result;

    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      const form = modal.querySelector('#change-password-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const currentPassword = formData.get('currentPassword');
      const newPassword = formData.get('newPassword');
      const confirmPassword = formData.get('confirmPassword');

      // Verify passwords match
      if (newPassword !== confirmPassword) {
        UI.showToast('As senhas não coincidem', 'error');
        return;
      }

      // Verify current password
      if (!auth.verifyPassword(currentUser.username, currentPassword)) {
        UI.showToast('Senha atual incorreta', 'error');
        return;
      }

      // Update password
      if (auth.updatePassword(currentUser.userId, newPassword)) {
        UI.showToast('Senha alterada com sucesso!', 'success');
        close();
      } else {
        UI.showToast('Erro ao alterar senha', 'error');
      }
    });
  },

  updateHeaderProfile() {
    const config = storage.getConfiguracoes();
    const currentUser = auth.getCurrentUser();
    const displayName = config.displayName || currentUser.nome;

    // Update header name
    const headerName = document.querySelector('.header-user-name');
    if (headerName) {
      headerName.textContent = displayName;
    }

    // Update header avatar
    const headerAvatar = document.querySelector('.header-user-avatar');
    if (headerAvatar) {
      if (config.profileImage) {
        headerAvatar.style.backgroundImage = `url(${config.profileImage})`;
        headerAvatar.style.backgroundSize = 'cover';
        headerAvatar.style.backgroundPosition = 'center';
        headerAvatar.textContent = '';
      } else {
        headerAvatar.textContent = displayName.charAt(0).toUpperCase();
      }
    }
  },

  exportData() {
    const sharedData = storage.getSharedData();
    const userData = storage.getUserData();
    const config = storage.getConfiguracoes();

    const exportData = {
      shared: sharedData,
      user: userData,
      config: config,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `flat-management-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    UI.showToast('Backup exportado com sucesso!', 'success');
  },

  async importData(file) {
    if (!file) return;

    const confirmed = await UI.showConfirm(
      'Importar Dados',
      'Isso substituirá todos os seus dados atuais. Deseja continuar?'
    );

    if (!confirmed) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);

        if (importData.shared) {
          storage.saveSharedData(importData.shared);
        }

        if (importData.user) {
          storage.saveUserData(importData.user);
        }

        if (importData.config) {
          storage.updateConfiguracoes(importData.config);
        }

        UI.showToast('Dados importados com sucesso!', 'success');

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Erro ao importar dados:', error);
        UI.showToast('Erro ao importar dados. Arquivo inválido.', 'error');
      }
    };
    reader.readAsText(file);
  },

  async clearAllData() {
    const confirmed = await UI.showConfirm(
      'Limpar Todos os Dados',
      'ATENÇÃO: Esta ação irá apagar TODOS os seus dados e não pode ser desfeita. Deseja continuar?'
    );

    if (!confirmed) return;

    // Clear user-specific data only
    storage.saveUserData({
      reservas: [],
      configuracoes: {
        comissaoPadrao: 50,
        tema: 'light'
      }
    });

    UI.showToast('Dados limpos com sucesso!', 'success');

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
};

// Register module
window.ConfiguracoesModule = ConfiguracoesModule;
window.registerModuleWhenReady('configuracoes', ConfiguracoesModule);
