// ============================================
// RESERVAS MODULE
// ============================================

const ReservasModule = {
  currentFilter: 'todas',

  render(container) {
    container.innerHTML = `
      <div style="margin-bottom: var(--space-lg);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
          <div style="display: flex; gap: var(--space-sm);">
            <button class="btn btn-sm ${this.currentFilter === 'todas' ? 'btn-primary' : 'btn-secondary'}" data-filter="todas">Todas</button>
            <button class="btn btn-sm ${this.currentFilter === 'pendente' ? 'btn-primary' : 'btn-secondary'}" data-filter="pendente">Pendentes</button>
            <button class="btn btn-sm ${this.currentFilter === 'confirmada' ? 'btn-primary' : 'btn-secondary'}" data-filter="confirmada">Confirmadas</button>
            <button class="btn btn-sm ${this.currentFilter === 'cancelada' ? 'btn-primary' : 'btn-secondary'}" data-filter="cancelada">Canceladas</button>
            <button class="btn btn-sm ${this.currentFilter === 'finalizada' ? 'btn-primary' : 'btn-secondary'}" data-filter="finalizada">Finalizadas</button>
          </div>
          <button class="btn btn-primary" id="add-reserva-btn">➕ Nova Reserva</button>
        </div>
        <input type="text" class="form-input" id="search-reserva" placeholder="🔍 Buscar reserva...">
      </div>

      <div id="reservas-list"></div>
    `;

    this.renderList();
    this.attachEventListeners();
  },

  renderList() {
    const container = document.getElementById('reservas-list');
    let reservas = storage.getReservas();

    // Apply filter
    if (this.currentFilter !== 'todas') {
      reservas = reservas.filter(r => r.status === this.currentFilter);
    }

    // Apply search
    const searchTerm = document.getElementById('search-reserva')?.value.toLowerCase();
    if (searchTerm) {
      reservas = reservas.filter(r => {
        const cliente = storage.getClienteById(r.clienteId);
        const apartamento = storage.getApartamentoById(r.apartamentoId);
        return cliente?.nome.toLowerCase().includes(searchTerm) ||
          apartamento?.cidade?.toLowerCase().includes(searchTerm);
      });
    }

    if (reservas.length === 0) {
      UI.showEmptyState(container, {
        icon: '📅',
        title: 'Nenhuma reserva encontrada',
        description: 'Crie uma nova reserva para começar.',
        actionText: 'Nova Reserva',
        onAction: () => this.showForm()
      });
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Apartamento</th>
              <th>Check-in / Check-out</th>
              <th>Valor Total</th>
              <th>Pagamento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${reservas.map(r => this.renderReservaRow(r)).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.attachRowEventListeners();
  },

  renderReservaRow(reserva) {
    const cliente = storage.getClienteById(reserva.clienteId);
    const apartamento = storage.getApartamentoById(reserva.apartamentoId);

    const pagamentoStatus = [];
    if (reserva.sinalPago) pagamentoStatus.push('✓ Sinal');
    else pagamentoStatus.push('✗ Sinal');

    if (reserva.restantePago) pagamentoStatus.push('✓ Restante');
    else pagamentoStatus.push('✗ Restante');

    return `
      <tr>
        <td>
          <strong>${cliente?.nome || 'N/A'}</strong><br>
          <small style="color: var(--color-text-tertiary);">📞 ${cliente?.telefone || 'N/A'}</small>
        </td>
        <td>${apartamento?.cidade || 'N/A'} - ${apartamento?.endereco || 'N/A'}</td>
        <td>
          ${UI.formatDate(reserva.checkIn)}<br>
          <small style="color: var(--color-text-tertiary);">${UI.formatDate(reserva.checkOut)}</small>
        </td>
        <td><strong>${UI.formatCurrency(reserva.valorTotal || 0)}</strong></td>
        <td>
          <small>${pagamentoStatus.join('<br>')}</small>
        </td>
        <td><span class="badge badge-${this.getStatusBadge(reserva.status)}">${reserva.status}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" data-action="view" data-id="${reserva.id}">👁️</button>
          <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${reserva.id}">✏️</button>
          <button class="btn btn-sm btn-danger" data-action="delete" data-id="${reserva.id}">🗑️</button>
        </td>
      </tr>
    `;
  },

  attachEventListeners() {
    document.getElementById('add-reserva-btn').addEventListener('click', () => this.showForm());

    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentFilter = e.target.getAttribute('data-filter');
        this.renderList();

        document.querySelectorAll('[data-filter]').forEach(b => {
          b.className = 'btn btn-sm ' + (b.getAttribute('data-filter') === this.currentFilter ? 'btn-primary' : 'btn-secondary');
        });
      });
    });

    const searchInput = document.getElementById('search-reserva');
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
        if (await UI.confirm('Tem certeza que deseja excluir esta reserva?')) {
          storage.deleteReserva(id);
          UI.showToast('Reserva excluída com sucesso', 'success');
          this.renderList();
        }
      });
    });
  },

  async showForm(reservaId = null) {
    const reserva = reservaId ? storage.getReservaById(reservaId) : {};
    const isEdit = !!reservaId;

    const clientes = storage.getClientes();
    const apartamentos = storage.getApartamentos();
    const agentes = storage.getAgentes();
    const config = storage.getConfiguracoes();

    const formHtml = `
      <form id="reserva-form">
        <div class="form-group">
          <label class="form-label form-label-required">Cliente</label>
          <select class="form-select" name="clienteId" id="cliente-select" required>
            <option value="">Selecione um cliente...</option>
            ${clientes.map(c => `
              <option value="${c.id}" ${reserva.clienteId === c.id ? 'selected' : ''} 
                      data-bloqueado="${c.bloqueado ? 'true' : 'false'}">
                ${c.nome} ${c.bloqueado ? '🚫' : ''} ${c.estrela ? '⭐' : ''}
              </option>
            `).join('')}
          </select>
          <div id="cliente-warning"></div>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label form-label-required">Apartamento</label>
            <select class="form-select" name="apartamentoId" required>
              <option value="">Selecione um apartamento...</option>
              ${apartamentos.map(a => `
                <option value="${a.id}" ${reserva.apartamentoId === a.id ? 'selected' : ''}>
                  ${a.landlord} - ${a.cidade} (${UI.formatCurrency(a.valorSemanal || 0)})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Agente</label>
            <select class="form-select" name="agenteId">
              <option value="">Selecione um agente...</option>
              ${agentes.map(a => `
                <option value="${a.id}" ${reserva.agenteId === a.id ? 'selected' : ''}>
                  ${a.nome}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label form-label-required">Data de Check-in</label>
            <input type="date" class="form-input" name="checkIn" value="${reserva.checkIn || ''}" required>
          </div>

          <div class="form-group">
            <label class="form-label form-label-required">Data de Check-out</label>
            <input type="date" class="form-input" name="checkOut" value="${reserva.checkOut || ''}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label form-label-required">Quartos Alugados</label>
          <select class="form-select" name="quartosAlugados" id="quartos-alugados-select" required>
            <option value="">Selecione...</option>
            <option value="1" ${(reserva.quartosAlugados || 1) == 1 ? 'selected' : ''}>1 quarto</option>
            <option value="2" ${reserva.quartosAlugados == 2 ? 'selected' : ''}>2 quartos</option>
            <option value="3" ${reserva.quartosAlugados == 3 ? 'selected' : ''}>3 quartos</option>
          </select>
          <div class="form-help">Quantos quartos foram alugados nesta reserva</div>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label form-label-required">Valor Total (com comissão)</label>
            <input type="number" class="form-input" name="valorTotal" id="valor-total-input" value="${reserva.valorTotal || ''}" step="0.01" required>
          </div>

          <div class="form-group">
            <label class="form-label form-label-required">Valor da Comissão</label>
            <input type="number" class="form-input" name="valorComissao" id="valor-comissao-input" value="${reserva.valorComissao || 50}" step="0.01" required>
            <div class="form-help">Comissão padrão: 50£ por quarto</div>
          </div>
        </div>

        <hr style="margin: var(--space-lg) 0; border: none; border-top: 1px solid var(--color-border);">
        
        <h5 style="margin-bottom: var(--space-md);">Controle Financeiro</h5>

        <div class="card" style="margin-bottom: var(--space-md);">
          <div class="card-header">
            <h6 style="margin: 0;">Valor da Reserva (Sinal)</h6>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Valor do Sinal</label>
              <input type="number" class="form-input" name="valorSinal" value="${reserva.valorSinal || ''}" step="0.01">
            </div>
            <div class="form-checkbox">
              <input type="checkbox" name="sinalPago" id="sinalPago" ${reserva.sinalPago ? 'checked' : ''}>
              <label for="sinalPago">✓ Sinal Pago</label>
            </div>
            <div class="form-group">
              <label class="form-label">Método de Pagamento</label>
              <select class="form-select" name="metodoPagamentoSinal">
                <option value="dinheiro" ${reserva.metodoPagamentoSinal === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
                <option value="transferencia" ${(reserva.metodoPagamentoSinal === 'transferencia' || !reserva.metodoPagamentoSinal) ? 'selected' : ''}>Transferência</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom: var(--space-md);">
          <div class="card-header">
            <h6 style="margin: 0;">Valor Restante (Check-in)</h6>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Valor Restante</label>
              <input type="number" class="form-input" name="valorRestante" value="${reserva.valorRestante || ''}" step="0.01">
            </div>
            <div class="form-checkbox">
              <input type="checkbox" name="restantePago" id="restantePago" ${reserva.restantePago ? 'checked' : ''}>
              <label for="restantePago">✓ Restante Pago</label>
            </div>
            <div class="form-group">
              <label class="form-label">Método de Pagamento</label>
              <select class="form-select" name="metodoPagamentoRestante">
                <option value="dinheiro" ${reserva.metodoPagamentoRestante === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
                <option value="transferencia" ${reserva.metodoPagamentoRestante === 'transferencia' ? 'selected' : ''}>Transferência</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Observação</label>
              <textarea class="form-textarea" name="observacaoPagamento">${reserva.observacaoPagamento || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Status da Reserva</label>
          <select class="form-select" name="status">
            <option value="pendente" ${(reserva.status || 'pendente') === 'pendente' ? 'selected' : ''}>Pendente</option>
            <option value="confirmada" ${reserva.status === 'confirmada' ? 'selected' : ''}>Confirmada</option>
            <option value="cancelada" ${reserva.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
            <option value="finalizada" ${reserva.status === 'finalizada' ? 'selected' : ''}>Finalizada</option>
          </select>
        </div>
      </form>
    `;

    const result = await UI.showModal(
      isEdit ? 'Editar Reserva' : 'Nova Reserva',
      formHtml,
      {
        confirmText: 'Salvar',
        cancelText: 'Cancelar',
        maxWidth: '700px',
        returnElement: true
      }
    );

    if (!result) return;

    const { modal, close } = result;

    // Cliente bloqueado warning
    const clienteSelect = modal.querySelector('#cliente-select');
    const clienteWarning = modal.querySelector('#cliente-warning');

    clienteSelect.addEventListener('change', () => {
      const selectedOption = clienteSelect.options[clienteSelect.selectedIndex];
      const bloqueado = selectedOption.getAttribute('data-bloqueado') === 'true';

      if (bloqueado) {
        clienteWarning.innerHTML = '<div class="alert alert-danger" style="margin-top: var(--space-sm);">⚠️ ATENÇÃO: Este cliente está bloqueado!</div>';
      } else {
        clienteWarning.innerHTML = '';
      }
    });

    // Trigger initial check
    clienteSelect.dispatchEvent(new Event('change'));

    // Automatic commission calculation based on rented rooms
    const quartosAlugadosSelect = modal.querySelector('#quartos-alugados-select');
    const valorComissaoInput = modal.querySelector('#valor-comissao-input');
    const COMISSAO_POR_QUARTO = 50; // 50£ per room

    quartosAlugadosSelect.addEventListener('change', () => {
      const quartosAlugados = parseInt(quartosAlugadosSelect.value) || 1;
      const comissaoCalculada = quartosAlugados * COMISSAO_POR_QUARTO;
      valorComissaoInput.value = comissaoCalculada;
    });

    // Trigger initial calculation if editing
    if (isEdit && reserva.quartosAlugados) {
      quartosAlugadosSelect.dispatchEvent(new Event('change'));
    }

    // Close button (X)
    modal.querySelector('.modal-close').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      close(false);
    });

    // Cancel button
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close(false);
      });
    }

    // Confirm button
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      const form = modal.querySelector('#reserva-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const data = {
        clienteId: formData.get('clienteId'),
        apartamentoId: formData.get('apartamentoId'),
        agenteId: formData.get('agenteId') || null,
        checkIn: formData.get('checkIn'),
        checkOut: formData.get('checkOut'),
        quartosAlugados: parseInt(formData.get('quartosAlugados')) || 1,
        valorTotal: parseFloat(formData.get('valorTotal')),
        valorComissao: parseFloat(formData.get('valorComissao')) || 50,
        valorSinal: parseFloat(formData.get('valorSinal')) || 0,
        sinalPago: formData.get('sinalPago') === 'on',
        metodoPagamentoSinal: formData.get('metodoPagamentoSinal'),
        valorRestante: parseFloat(formData.get('valorRestante')) || 0,
        restantePago: formData.get('restantePago') === 'on',
        metodoPagamentoRestante: formData.get('metodoPagamentoRestante'),
        observacaoPagamento: formData.get('observacaoPagamento'),
        status: formData.get('status')
      };

      if (isEdit) {
        storage.updateReserva(reservaId, data);
        UI.showToast('Reserva atualizada com sucesso', 'success');
      } else {
        storage.addReserva(data);
        UI.showToast('Reserva criada com sucesso', 'success');
      }

      this.renderList();
      close(true);
    });
  },

  async showDetails(reservaId) {
    const reserva = storage.getReservaById(reservaId);
    if (!reserva) return;

    const cliente = storage.getClienteById(reserva.clienteId);
    const apartamento = storage.getApartamentoById(reserva.apartamentoId);
    const agente = reserva.agenteId ? storage.getAgenteById(reserva.agenteId) : null;

    const detailsHtml = `
      <div class="grid grid-2" style="margin-bottom: var(--space-lg);">
        <div>
          <h5>Cliente</h5>
          <p><strong>${cliente?.nome || 'N/A'}</strong></p>
          <p>📞 ${cliente?.telefone || 'N/A'}</p>
          ${cliente?.whatsapp ? `<p>💬 WhatsApp: ${cliente.whatsapp}</p>` : ''}
          ${cliente?.sexualidade ? `<p>👤 Sexualidade: ${cliente.sexualidade}</p>` : ''}
        </div>
        <div>
          <h5>Apartamento</h5>
          <p><strong>${apartamento?.landlord || 'N/A'}</strong></p>
          <p>📍 ${apartamento?.cidade || 'N/A'} - ${apartamento?.endereco || 'N/A'}</p>
        </div>
      </div>

      ${agente ? `
        <div style="margin-bottom: var(--space-lg);">
          <h5>Agente</h5>
          <p>${agente.nome} - ${agente.contato || 'N/A'}</p>
        </div>
      ` : ''}

      <div class="grid grid-2" style="margin-bottom: var(--space-lg);">
        <div>
          <p><strong>Check-in:</strong> ${UI.formatDate(reserva.checkIn)}</p>
          <p><strong>Check-out:</strong> ${UI.formatDate(reserva.checkOut)}</p>
        </div>
        <div>
          <p><strong>Valor Total:</strong> ${UI.formatCurrency(reserva.valorTotal || 0)}</p>
          <p><strong>Status:</strong> <span class="badge badge-${this.getStatusBadge(reserva.status)}">${reserva.status}</span></p>
        </div>
      </div>

      <h5>Pagamentos</h5>
      <div class="grid grid-2">
        <div class="card">
          <div class="card-header">
            <h6 style="margin: 0;">Sinal</h6>
          </div>
          <div class="card-body">
            <p><strong>Valor:</strong> ${UI.formatCurrency(reserva.valorSinal || 0)}</p>
            <p><strong>Status:</strong> ${reserva.sinalPago ? '<span class="badge badge-success">✓ Pago</span>' : '<span class="badge badge-warning">Pendente</span>'}</p>
            <p><strong>Método:</strong> ${reserva.metodoPagamentoSinal || 'Não especificado'}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h6 style="margin: 0;">Restante</h6>
          </div>
          <div class="card-body">
            <p><strong>Valor:</strong> ${UI.formatCurrency(reserva.valorRestante || 0)}</p>
            <p><strong>Status:</strong> ${reserva.restantePago ? '<span class="badge badge-success">✓ Pago</span>' : '<span class="badge badge-warning">Pendente</span>'}</p>
            <p><strong>Método:</strong> ${reserva.metodoPagamentoRestante || 'N/A'}</p>
            ${reserva.observacaoPagamento ? `<p><strong>Obs:</strong> ${reserva.observacaoPagamento}</p>` : ''}
          </div>
        </div>
      </div>
    `;

    await UI.showModal('Detalhes da Reserva', detailsHtml, {
      showFooter: false,
      maxWidth: '800px'
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
window.ReservasModule = ReservasModule;
window.registerModuleWhenReady('reservas', ReservasModule);


