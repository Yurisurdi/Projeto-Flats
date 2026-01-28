// ============================================
// CLIENTES MODULE
// ============================================

const ClientesModule = {
  currentFilter: 'todos',

  render(container) {
    container.innerHTML = `
      <div style="margin-bottom: var(--space-lg);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
          <div style="display: flex; gap: var(--space-sm);">
            <button class="btn btn-sm ${this.currentFilter === 'todos' ? 'btn-primary' : 'btn-secondary'}" data-filter="todos">
              Todos
            </button>
            <button class="btn btn-sm ${this.currentFilter === 'estrela' ? 'btn-primary' : 'btn-secondary'}" data-filter="estrela">
              ⭐ Estrelas
            </button>
            <button class="btn btn-sm ${this.currentFilter === 'bloqueado' ? 'btn-primary' : 'btn-secondary'}" data-filter="bloqueado">
              🚫 Bloqueados
            </button>
          </div>
          <button class="btn btn-primary" id="add-cliente-btn">
            ➕ Novo Cliente
          </button>
        </div>
        
        <input type="text" class="form-input" id="search-cliente" placeholder="🔍 Buscar cliente...">
      </div>

      <div id="clientes-list"></div>
    `;

    this.renderList();
    this.attachEventListeners();
  },

  renderList() {
    const container = document.getElementById('clientes-list');
    let clientes = storage.getClientes();

    // Apply filter
    if (this.currentFilter === 'estrela') {
      clientes = clientes.filter(c => c.estrela);
    } else if (this.currentFilter === 'bloqueado') {
      clientes = clientes.filter(c => c.bloqueado);
    }

    // Apply search
    const searchTerm = document.getElementById('search-cliente')?.value.toLowerCase();
    if (searchTerm) {
      clientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(searchTerm) ||
        c.whatsapp?.includes(searchTerm) ||
        c.sexualidade?.toLowerCase().includes(searchTerm)
      );
    }

    if (clientes.length === 0) {
      UI.showEmptyState(container, {
        icon: '👥',
        title: 'Nenhum cliente encontrado',
        description: 'Adicione um novo cliente para começar.',
        actionText: 'Adicionar Cliente',
        onAction: () => this.showForm()
      });
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>WhatsApp</th>
              <th>Sexualidade</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${clientes.map(cliente => this.renderClienteRow(cliente)).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.attachRowEventListeners();
  },

  renderClienteRow(cliente) {
    const badges = [];
    if (cliente.estrela) badges.push('<span class="badge badge-success">⭐ Estrela</span>');
    if (cliente.bloqueado) badges.push('<span class="badge badge-danger">🚫 Bloqueado</span>');

    return `
      <tr>
        <td><strong>${cliente.nome}</strong></td>
        <td>
          ${cliente.whatsapp ? `💬 ${cliente.whatsapp}` : 'N/A'}
        </td>
        <td>${cliente.sexualidade || 'N/A'}</td>
        <td>${badges.join(' ') || '-'}</td>
        <td>
          <button class="btn btn-sm btn-secondary" data-action="view" data-id="${cliente.id}">👁️</button>
          <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${cliente.id}">✏️</button>
          <button class="btn btn-sm btn-danger" data-action="delete" data-id="${cliente.id}">🗑️</button>
        </td>
      </tr>
    `;
  },

  attachEventListeners() {
    document.getElementById('add-cliente-btn').addEventListener('click', () => this.showForm());

    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentFilter = e.target.getAttribute('data-filter');
        this.renderList();

        // Update button styles
        document.querySelectorAll('[data-filter]').forEach(b => {
          b.className = 'btn btn-sm ' + (b.getAttribute('data-filter') === this.currentFilter ? 'btn-primary' : 'btn-secondary');
        });
      });
    });

    const searchInput = document.getElementById('search-cliente');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderList());
    }
  },

  attachRowEventListeners() {
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        this.showDetails(id);
      });
    });

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        this.showForm(id);
      });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (await UI.confirm('Tem certeza que deseja excluir este cliente?')) {
          storage.deleteCliente(id);
          UI.showToast('Cliente excluído com sucesso', 'success');
          this.renderList();
        }
      });
    });
  },

  async showForm(clienteId = null) {
    const cliente = clienteId ? storage.getClienteById(clienteId) : {};
    const isEdit = !!clienteId;

    const formHtml = `
      <form id="cliente-form">
        <div class="form-group">
          <label class="form-label form-label-required">Nome Completo</label>
          <input type="text" class="form-input" name="nome" value="${cliente.nome || ''}" required>
        </div>

        <div class="form-group">
          <label class="form-label form-label-required">Número do WhatsApp</label>
          <input type="tel" class="form-input" name="whatsapp" value="${cliente.whatsapp || ''}" placeholder="+44 7XXX XXXXXX" required>
          <div class="form-help">Número de WhatsApp do cliente (obrigatório)</div>
        </div>

        <div class="form-group">
          <label class="form-label">Sexualidade</label>
          <select class="form-select" name="sexualidade">
            <option value="">Selecione...</option>
            <option value="Cis" ${cliente.sexualidade === 'Cis' ? 'selected' : ''}>Cis</option>
            <option value="Trans" ${cliente.sexualidade === 'Trans' ? 'selected' : ''}>Trans</option>
            <option value="Gay" ${cliente.sexualidade === 'Gay' ? 'selected' : ''}>Gay</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Observações Internas</label>
          <textarea class="form-textarea" name="observacoes">${cliente.observacoes || ''}</textarea>
        </div>

        <div class="form-group">
          <div class="form-checkbox">
            <input type="checkbox" name="estrela" id="estrela" ${cliente.estrela ? 'checked' : ''}>
            <label for="estrela">⭐ Cliente Estrela (confiável)</label>
          </div>
        </div>

        <div class="form-group">
          <div class="form-checkbox">
            <input type="checkbox" name="bloqueado" id="bloqueado" ${cliente.bloqueado ? 'checked' : ''}>
            <label for="bloqueado">🚫 Cliente Bloqueado (problema)</label>
          </div>
        </div>
      </form>
    `;

    const result = await UI.showModal(
      isEdit ? 'Editar Cliente' : 'Novo Cliente',
      formHtml,
      {
        confirmText: 'Salvar',
        cancelText: 'Cancelar',
        maxWidth: '600px',
        onConfirm: (modal) => {
          const form = modal.querySelector('#cliente-form');
          if (!form.checkValidity()) {
            form.reportValidity();
            return false;
          }

          const formData = new FormData(form);
          const data = {
            nome: formData.get('nome'),
            telefone: formData.get('telefone'),
            whatsapp: formData.get('whatsapp'),
            email: formData.get('email'),
            sexualidade: formData.get('sexualidade'),
            observacoes: formData.get('observacoes'),
            estrela: formData.get('estrela') === 'on',
            bloqueado: formData.get('bloqueado') === 'on'
          };

          if (isEdit) {
            storage.updateCliente(clienteId, data);
            UI.showToast('Cliente atualizado com sucesso', 'success');
          } else {
            storage.addCliente(data);
            UI.showToast('Cliente adicionado com sucesso', 'success');
          }

          this.renderList();
          return true;
        }
      }
    );
  },

  async showDetails(clienteId) {
    const cliente = storage.getClienteById(clienteId);
    if (!cliente) return;

    const reservas = storage.getReservasByCliente(clienteId);

    const detailsHtml = `
      <div style="margin-bottom: var(--space-lg);">
        <h4>${cliente.nome}</h4>
        ${cliente.estrela ? '<span class="badge badge-success">⭐ Cliente Estrela</span>' : ''}
        ${cliente.bloqueado ? '<span class="badge badge-danger">🚫 Bloqueado</span>' : ''}
      </div>

      <div style="margin-bottom: var(--space-md);">
        <p><strong>WhatsApp:</strong> 💬 ${cliente.whatsapp || 'N/A'}</p>
        <p><strong>Sexualidade:</strong> ${cliente.sexualidade || 'N/A'}</p>
        ${cliente.observacoes ? `<p><strong>Observações:</strong> ${cliente.observacoes}</p>` : ''}
      </div>

      <h5>Histórico de Reservas (${reservas.length})</h5>
      ${reservas.length > 0 ? `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${reservas.map(r => `
                <tr>
                  <td>${UI.formatDate(r.checkIn)}</td>
                  <td>${UI.formatDate(r.checkOut)}</td>
                  <td><span class="badge badge-${this.getStatusBadge(r.status)}">${r.status}</span></td>
                  <td>${UI.formatCurrency(r.valorTotal || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p style="color: var(--color-text-tertiary);">Nenhuma reserva encontrada</p>'}
    `;

    await UI.showModal('Detalhes do Cliente', detailsHtml, {
      showFooter: false,
      maxWidth: '700px'
    });
  },

  getStatusBadge(status) {
    const badges = {
      'pendente': 'warning',
      'confirmada': 'success',
      'cancelada': 'danger',
      'finalizada': 'info'
    };
    return badges[status] || 'info';
  }
};

// Register module
window.ClientesModule = ClientesModule;
window.registerModuleWhenReady('clientes', ClientesModule);
