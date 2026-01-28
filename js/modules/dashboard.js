// ============================================
// DASHBOARD MODULE - Enhanced Version
// ============================================

const DashboardModule = {
  render(container) {
    const reservas = storage.getReservas();
    const clientes = storage.getClientes();
    const apartamentos = storage.getApartamentos();
    const agentes = storage.getAgentes();

    // Calculate statistics
    const stats = this.calculateStats(reservas, clientes, apartamentos);
    const proximosCheckins = this.getProximosCheckins(reservas);
    const pagamentosPendentes = this.getPagamentosPendentes(reservas);
    const recentActivities = this.getRecentActivities(reservas, clientes);

    container.innerHTML = `
      <!-- Statistics Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon primary">📅</div>
          <div class="stat-content">
            <div class="stat-label">Reservas Ativas</div>
            <div class="stat-value">${stats.reservasAtivas}</div>
            <div class="stat-trend ${stats.reservasTrend >= 0 ? 'positive' : 'negative'}">
              ${stats.reservasTrend >= 0 ? '↑' : '↓'} ${Math.abs(stats.reservasTrend)}% este mês
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon success">💰</div>
          <div class="stat-content">
            <div class="stat-label">Receita do Mês</div>
            <div class="stat-value">${UI.formatCurrency(stats.receitaMes)}</div>
            <div class="stat-trend positive">
              ${stats.pagamentosRecebidos} pagamentos recebidos
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon warning">⏳</div>
          <div class="stat-content">
            <div class="stat-label">Pagamentos Pendentes</div>
            <div class="stat-value">${UI.formatCurrency(stats.pagamentosPendentes)}</div>
            <div class="stat-trend negative">
              ${pagamentosPendentes.length} reserva(s) pendente(s)
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon danger">🏢</div>
          <div class="stat-content">
            <div class="stat-label">Taxa de Ocupação</div>
            <div class="stat-value">${stats.ocupacao}%</div>
            <div class="stat-trend">
              ${stats.apartamentosOcupados}/${apartamentos.length} apartamentos
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon primary">👥</div>
          <div class="stat-content">
            <div class="stat-label">Total de Clientes</div>
            <div class="stat-value">${clientes.length}</div>
            <div class="stat-trend">
              ${agentes.length} agente(s) parceiro(s)
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon success">✓</div>
          <div class="stat-content">
            <div class="stat-label">Próximos Check-ins</div>
            <div class="stat-value">${proximosCheckins.length}</div>
            <div class="stat-trend">
              Próximos 7 dias
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="btn btn-primary" id="nova-reserva-btn">
          ➕ Nova Reserva
        </button>
        <button class="btn btn-primary" id="novo-cliente-btn">
          👤 Novo Cliente
        </button>
        <button class="btn btn-primary" id="novo-apartamento-btn">
          🏠 Novo Apartamento
        </button>
        <button class="btn btn-secondary" id="gerar-dados-btn">
          🎲 Gerar Dados de Exemplo
        </button>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-2">
        <!-- Próximos Check-ins -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Próximos Check-ins</h3>
            <span class="badge badge-info">${proximosCheckins.length}</span>
          </div>
          <div class="card-body" id="proximos-checkins-list"></div>
        </div>

        <!-- Pagamentos Pendentes -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Pagamentos Pendentes</h3>
            <span class="badge badge-warning">${pagamentosPendentes.length}</span>
          </div>
          <div class="card-body" id="pagamentos-pendentes-list"></div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card" style="margin-top: var(--space-lg);">
        <div class="card-header">
          <h3 class="card-title">Atividades Recentes</h3>
        </div>
        <div class="card-body" id="recent-activities-list"></div>
      </div>

      <!-- Occupancy Overview -->
      ${apartamentos.length > 0 ? `
      <div class="card" style="margin-top: var(--space-lg);">
        <div class="card-header">
          <h3 class="card-title">Visão Geral de Ocupação</h3>
        </div>
        <div class="card-body">
          <div class="occupancy-bar">
            <div class="occupancy-fill" style="width: ${stats.ocupacao}%"></div>
          </div>
          <div class="occupancy-legend">
            <div class="occupancy-item">
              <span class="occupancy-dot occupied"></span>
              <span>Ocupados: ${stats.apartamentosOcupados}</span>
            </div>
            <div class="occupancy-item">
              <span class="occupancy-dot available"></span>
              <span>Disponíveis: ${apartamentos.length - stats.apartamentosOcupados}</span>
            </div>
          </div>
        </div>
      </div>
      ` : ''}
    `;

    // Render lists
    this.renderProximosCheckins(proximosCheckins);
    this.renderPagamentosPendentes(pagamentosPendentes);
    this.renderRecentActivities(recentActivities);

    // Event listeners
    this.attachEventListeners();
  },

  calculateStats(reservas, clientes, apartamentos) {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    // Reservas ativas
    const reservasAtivas = reservas.filter(r => r.status === 'confirmada').length;

    // Receita do mês (pagamentos recebidos)
    const reservasMes = reservas.filter(r => {
      const criacao = new Date(r.criadoEm || hoje);
      return criacao >= inicioMes;
    });

    let receitaMes = 0;
    let pagamentosRecebidos = 0;

    reservasMes.forEach(r => {
      if (r.sinalPago) {
        receitaMes += r.valorSinal || 0;
        pagamentosRecebidos++;
      }
      if (r.restantePago) {
        receitaMes += r.valorRestante || 0;
        pagamentosRecebidos++;
      }
    });

    // Pagamentos pendentes
    let pagamentosPendentes = 0;
    reservas.forEach(r => {
      if (!r.sinalPago) pagamentosPendentes += r.valorSinal || 0;
      if (!r.restantePago) pagamentosPendentes += r.valorRestante || 0;
    });

    // Taxa de ocupação
    const apartamentosOcupados = reservas.filter(r => {
      const checkIn = new Date(r.checkIn);
      const checkOut = new Date(r.checkOut);
      return hoje >= checkIn && hoje <= checkOut && r.status === 'confirmada';
    }).length;

    const ocupacao = apartamentos.length > 0
      ? Math.round((apartamentosOcupados / apartamentos.length) * 100)
      : 0;

    return {
      reservasAtivas,
      reservasTrend: 15, // Simulated trend
      receitaMes,
      pagamentosRecebidos,
      pagamentosPendentes,
      ocupacao,
      apartamentosOcupados
    };
  },

  getProximosCheckins(reservas) {
    const hoje = new Date();
    const seteDias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

    return reservas.filter(r => {
      const checkin = new Date(r.checkIn);
      return checkin >= hoje && checkin <= seteDias && r.status === 'confirmada';
    }).sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));
  },

  getPagamentosPendentes(reservas) {
    return reservas.filter(r => !r.sinalPago || !r.restantePago);
  },

  getRecentActivities(reservas, clientes) {
    const activities = [];

    // Get recent reservations
    reservas.slice(-5).reverse().forEach(reserva => {
      const cliente = storage.getClienteById(reserva.clienteId);
      activities.push({
        type: 'reserva',
        icon: '📅',
        message: `Nova reserva criada para ${cliente?.nome || 'Cliente'}`,
        timestamp: reserva.criadoEm || new Date().toISOString(),
        color: 'primary'
      });
    });

    // Get recent clients
    clientes.slice(-3).reverse().forEach(cliente => {
      activities.push({
        type: 'cliente',
        icon: '👤',
        message: `Novo cliente cadastrado: ${cliente.nome}`,
        timestamp: cliente.criadoEm || new Date().toISOString(),
        color: 'success'
      });
    });

    // Sort by timestamp and get last 5
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  },

  renderProximosCheckins(checkins) {
    const container = document.getElementById('proximos-checkins-list');

    if (checkins.length === 0) {
      container.innerHTML = `
                <div class="empty-state-mini">
                    <p style="color: var(--color-text-tertiary); text-align: center;">
                        📭 Nenhum check-in nos próximos 7 dias
                    </p>
                </div>
            `;
      return;
    }

    container.innerHTML = checkins.map(reserva => {
      const cliente = storage.getClienteById(reserva.clienteId);
      const apartamento = storage.getApartamentoById(reserva.apartamentoId);
      const diasRestantes = this.getDaysUntil(reserva.checkIn);

      return `
                <div class="checkin-item">
                    <div class="checkin-header">
                        <div>
                            <strong>${cliente?.nome || 'Cliente não encontrado'}</strong>
                            <div class="checkin-location">
                                📍 ${apartamento?.endereco || 'N/A'}
                            </div>
                        </div>
                        <span class="badge badge-info">${UI.formatDate(reserva.checkIn)}</span>
                    </div>
                    <div class="checkin-footer">
                        <span class="checkin-countdown">
                            ⏰ ${diasRestantes === 0 ? 'Hoje' : diasRestantes === 1 ? 'Amanhã' : `Em ${diasRestantes} dias`}
                        </span>
                        <button class="btn-link" onclick="app.loadModule('reservas')">Ver detalhes →</button>
                    </div>
                </div>
            `;
    }).join('');
  },

  renderPagamentosPendentes(pendentes) {
    const container = document.getElementById('pagamentos-pendentes-list');

    if (pendentes.length === 0) {
      container.innerHTML = `
                <div class="empty-state-mini">
                    <p style="color: var(--color-text-tertiary); text-align: center;">
                        🎉 Todos os pagamentos em dia!
                    </p>
                </div>
            `;
      return;
    }

    container.innerHTML = pendentes.map(reserva => {
      const cliente = storage.getClienteById(reserva.clienteId);
      const pendencias = [];
      let valorPendente = 0;

      if (!reserva.sinalPago) {
        pendencias.push('Sinal');
        valorPendente += reserva.valorSinal || 0;
      }
      if (!reserva.restantePago) {
        pendencias.push('Restante');
        valorPendente += reserva.valorRestante || 0;
      }

      return `
                <div class="payment-item">
                    <div class="payment-header">
                        <div>
                            <strong>${cliente?.nome || 'Cliente não encontrado'}</strong>
                            <div class="payment-amount">
                                ${UI.formatCurrency(valorPendente)} pendente
                            </div>
                        </div>
                        <span class="badge badge-warning">${pendencias.join(', ')}</span>
                    </div>
                    <div class="payment-footer">
                        <span style="font-size: var(--font-size-sm); color: var(--color-text-tertiary);">
                            Check-in: ${UI.formatDate(reserva.checkIn)}
                        </span>
                        <button class="btn-link" onclick="app.loadModule('pagamentos')">Gerenciar →</button>
                    </div>
                </div>
            `;
    }).join('');
  },

  renderRecentActivities(activities) {
    const container = document.getElementById('recent-activities-list');

    if (activities.length === 0) {
      container.innerHTML = `
                <div class="empty-state-mini">
                    <p style="color: var(--color-text-tertiary); text-align: center;">
                        📭 Nenhuma atividade recente
                    </p>
                </div>
            `;
      return;
    }

    container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.color}">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-message">${activity.message}</div>
                    <div class="activity-time">${this.getTimeAgo(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
  },

  attachEventListeners() {
    const novaReservaBtn = document.getElementById('nova-reserva-btn');
    if (novaReservaBtn) {
      novaReservaBtn.addEventListener('click', () => {
        app.loadModule('reservas');
        setTimeout(() => window.ReservasModule?.showForm(), 300);
      });
    }

    const novoClienteBtn = document.getElementById('novo-cliente-btn');
    if (novoClienteBtn) {
      novoClienteBtn.addEventListener('click', () => {
        app.loadModule('clientes');
        setTimeout(() => window.ClientesModule?.showForm(), 300);
      });
    }

    const novoApartamentoBtn = document.getElementById('novo-apartamento-btn');
    if (novoApartamentoBtn) {
      novoApartamentoBtn.addEventListener('click', () => {
        app.loadModule('apartamentos');
        setTimeout(() => window.ApartamentosModule?.showForm(), 300);
      });
    }

    const gerarDadosBtn = document.getElementById('gerar-dados-btn');
    if (gerarDadosBtn) {
      gerarDadosBtn.addEventListener('click', () => {
        if (window.SampleDataGenerator) {
          SampleDataGenerator.generateSampleData();
        } else {
          UI.showToast('Módulo de dados de exemplo não encontrado', 'error');
        }
      });
    }
  },

  getDaysUntil(dateString) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const target = new Date(dateString);
    target.setHours(0, 0, 0, 0);
    const diff = target - hoje;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    return UI.formatDate(timestamp);
  }
};

// Register module using the queue system
window.DashboardModule = DashboardModule;
window.registerModuleWhenReady('dashboard', DashboardModule);

