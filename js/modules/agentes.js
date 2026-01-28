// ============================================
// AGENTES MODULE
// ============================================

const AgentesModule = {
  render(container) {
    container.innerHTML = `
      <div style="margin-bottom: var(--space-lg);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
          <input type="text" class="form-input" id="search-agente" placeholder="🔍 Buscar agente..." style="max-width: 400px;">
          <button class="btn btn-primary" id="add-agente-btn">
            ➕ Novo Agente
          </button>
        </div>
      </div>

      <div id="agentes-list"></div>
    `;

    this.renderList();
    this.attachEventListeners();
  },

  renderList() {
    const container = document.getElementById('agentes-list');
    let agentes = storage.getAgentes();

    // Apply search
    const searchTerm = document.getElementById('search-agente')?.value.toLowerCase();
    if (searchTerm) {
      agentes = agentes.filter(a =>
        a.nome.toLowerCase().includes(searchTerm) ||
        a.whatsapp?.includes(searchTerm) ||
        a.cidades?.some(c => c.toLowerCase().includes(searchTerm))
      );
    }

    if (agentes.length === 0) {
      UI.showEmptyState(container, {
        icon: '🧑‍💼',
        title: 'Nenhum agente encontrado',
        description: 'Adicione um novo agente para começar.',
        actionText: 'Adicionar Agente',
        onAction: () => this.showForm()
      });
      return;
    }

    container.innerHTML = `
      <div class="grid grid-3">
        ${agentes.map(agente => this.renderAgenteCard(agente)).join('')}
      </div>
    `;

    this.attachCardEventListeners();
  },

  renderAgenteCard(agente) {
    const cidades = agente.cidades || [];

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${agente.nome}</h3>
        </div>
        <div class="card-body">
          <p><strong>WhatsApp:</strong> 💬 ${agente.whatsapp || 'N/A'}</p>
          
          ${cidades.length > 0 ? `
            <div style="margin-top: var(--space-md);">
              <strong>Cidades:</strong>
              <div style="display: flex; flex-wrap: wrap; gap: var(--space-xs); margin-top: var(--space-xs);">
                ${cidades.map(cidade => `<span class="badge badge-primary">${cidade}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        <div class="card-footer">
          <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${agente.id}">✏️ Editar</button>
          <button class="btn btn-sm btn-danger" data-action="delete" data-id="${agente.id}">🗑️ Excluir</button>
        </div>
      </div>
    `;
  },

  attachEventListeners() {
    document.getElementById('add-agente-btn').addEventListener('click', () => this.showForm());

    const searchInput = document.getElementById('search-agente');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderList());
    }
  },

  attachCardEventListeners() {
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.showForm(id);
      });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (await UI.confirm('Tem certeza que deseja excluir este agente?')) {
          storage.deleteAgente(id);
          UI.showToast('Agente excluído com sucesso', 'success');
          this.renderList();
        }
      });
    });
  },

  async showForm(agenteId = null) {
    const agente = agenteId ? storage.getAgenteById(agenteId) : {};
    const isEdit = !!agenteId;

    const formHtml = `
      <form id="agente-form">
        <div class="form-group">
          <label class="form-label form-label-required">Nome do Agente</label>
          <input type="text" class="form-input" name="nome" value="${agente.nome || ''}" required>
        </div>

        <div class="form-group">
          <label class="form-label form-label-required">WhatsApp</label>
          <input type="tel" class="form-input" name="whatsapp" value="${agente.whatsapp || ''}" placeholder="+44 7XXX XXXXXX" required>
          <div class="form-help">Número de WhatsApp do agente (obrigatório)</div>
        </div>

        <div class="form-group">
          <label class="form-label">Cidades</label>
          <div class="form-help" style="margin-bottom: var(--space-sm);">Adicione as cidades onde este agente atua</div>
          <div id="cidades-container" style="display: flex; flex-wrap: wrap; gap: var(--space-xs); margin-bottom: var(--space-sm);">
            ${(agente.cidades || []).map((cidade, index) => `
              <span class="badge badge-primary" style="display: flex; align-items: center; gap: var(--space-xs);">
                ${cidade}
                <button type="button" class="remove-cidade" data-index="${index}" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; font-size: 1rem;">&times;</button>
              </span>
            `).join('')}
          </div>
          <div style="display: flex; gap: var(--space-sm);">
            <input type="text" class="form-input" id="nova-cidade" placeholder="Digite uma cidade">
            <button type="button" class="btn btn-secondary" id="add-cidade-btn">Adicionar</button>
          </div>
        </div>
      </form>
    `;

    const result = await UI.showModal(
      isEdit ? 'Editar Agente' : 'Novo Agente',
      formHtml,
      {
        confirmText: 'Salvar',
        cancelText: 'Cancelar',
        maxWidth: '600px',
        returnElement: true
      }
    );

    if (!result) return;

    const { modal, close } = result;
    const cidades = agente.cidades ? [...agente.cidades] : [];

    // Add cidade functionality
    const addCidadeBtn = modal.querySelector('#add-cidade-btn');
    const novaCidadeInput = modal.querySelector('#nova-cidade');
    const cidadesContainer = modal.querySelector('#cidades-container');

    const updateCidadesDisplay = () => {
      cidadesContainer.innerHTML = cidades.map((cidade, index) => `
        <span class="badge badge-primary" style="display: flex; align-items: center; gap: var(--space-xs);">
          ${cidade}
          <button type="button" class="remove-cidade" data-index="${index}" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; font-size: 1rem;">&times;</button>
        </span>
      `).join('');

      // Reattach remove listeners
      cidadesContainer.querySelectorAll('.remove-cidade').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.currentTarget.getAttribute('data-index'));
          cidades.splice(index, 1);
          updateCidadesDisplay();
        });
      });
    };

    addCidadeBtn.addEventListener('click', () => {
      const cidade = novaCidadeInput.value.trim();
      if (cidade && !cidades.includes(cidade)) {
        cidades.push(cidade);
        novaCidadeInput.value = '';
        updateCidadesDisplay();
      }
    });

    novaCidadeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCidadeBtn.click();
      }
    });

    // Initial remove listeners
    cidadesContainer.querySelectorAll('.remove-cidade').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        cidades.splice(index, 1);
        updateCidadesDisplay();
      });
    });

    // Close button (X)
    modal.querySelector('.modal-close').addEventListener('click', () => {
      close(false);
    });

    // Cancel button
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        close(false);
      });
    }

    // Confirm button
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      const form = modal.querySelector('#agente-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const data = {
        nome: formData.get('nome'),
        whatsapp: formData.get('whatsapp'),
        cidades: cidades
      };

      if (isEdit) {
        storage.updateAgente(agenteId, data);
        UI.showToast('Agente atualizado com sucesso', 'success');
      } else {
        storage.addAgente(data);
        UI.showToast('Agente adicionado com sucesso', 'success');
      }

      this.renderList();
      close(true);
    });
  }
};


// Register module
window.AgentesModule = AgentesModule;
window.registerModuleWhenReady('agentes', AgentesModule);

