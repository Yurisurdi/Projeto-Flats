// ============================================
// FINANCIAL SUMMARY MODULE - Commission Dashboard
// ============================================

const PagamentosModule = {
  currentPeriod: 'month', // 'week', 'month', 'custom'
  customStartDate: null,
  customEndDate: null,
  exchangeRate: null,

  render(container) {
    container.innerHTML = `
      <div style="margin-bottom: var(--space-lg);">
        <h2>💰 Resumo Financeiro</h2>
        <p style="color: var(--color-text-secondary);">Acompanhe suas comissões de reservas</p>
        <div class="alert alert-info" style="margin-top: var(--space-md);">
          ℹ️ Apenas comissões com <strong>Sinal Pago</strong> são contabilizadas
        </div>
      </div>

      <!-- Period Filters -->
      <div class="period-filters" style="margin-bottom: var(--space-lg);">
        <button class="period-btn active" data-period="week">📅 Semanal</button>
        <button class="period-btn" data-period="month">📆 Mensal</button>
        <button class="period-btn" data-period="custom">🗓️ Customizado</button>
      </div>

      <!-- Custom Date Range (hidden by default) -->
      <div id="custom-date-range" style="display: none; margin-bottom: var(--space-lg);">
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Data Inicial</label>
            <input type="date" class="form-input" id="custom-start-date">
          </div>
          <div class="form-group">
            <label class="form-label">Data Final</label>
            <input type="date" class="form-input" id="custom-end-date">
          </div>
        </div>
        <button class="btn btn-primary btn-sm" id="apply-custom-dates">Aplicar</button>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid" id="stats-container">
        <!-- Will be populated dynamically -->
      </div>

      <!-- Chart and Details -->
      <div class="grid grid-2" style="margin-top: var(--space-xl); gap: var(--space-xl);">
        <!-- Chart -->
        <div class="card">
          <h3 style="margin-bottom: var(--space-lg);">📊 Distribuição de Comissões</h3>
          <div id="chart-container" style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
            <!-- Chart will be rendered here -->
          </div>
          <div id="chart-legend" style="margin-top: var(--space-lg);">
            <!-- Legend will be populated -->
          </div>
        </div>

        <!-- Reservations List -->
        <div class="card">
          <h3 style="margin-bottom: var(--space-lg);">📋 Reservas do Período</h3>
          <div id="reservations-list" style="max-height: 400px; overflow-y: auto;">
            <!-- Reservations will be listed here -->
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.loadExchangeRate();
    this.updateDashboard();
  },

  attachEventListeners() {
    // Period filter buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const period = e.target.getAttribute('data-period');
        this.currentPeriod = period;

        // Show/hide custom date range
        const customRange = document.getElementById('custom-date-range');
        if (period === 'custom') {
          customRange.style.display = 'block';
        } else {
          customRange.style.display = 'none';
          this.updateDashboard();
        }
      });
    });

    // Custom date range apply button
    const applyBtn = document.getElementById('apply-custom-dates');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.customStartDate = document.getElementById('custom-start-date').value;
        this.customEndDate = document.getElementById('custom-end-date').value;

        if (this.customStartDate && this.customEndDate) {
          this.updateDashboard();
        } else {
          UI.showToast('Por favor, selecione ambas as datas', 'error');
        }
      });
    }
  },

  async loadExchangeRate() {
    try {
      // Try to get from cache first
      const cached = sessionStorage.getItem('gbp_brl_rate');
      const cacheTime = sessionStorage.getItem('gbp_brl_rate_time');

      // Use cache if less than 1 hour old
      if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
        this.exchangeRate = parseFloat(cached);
        return;
      }

      // Fetch new rate
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/GBP');
      const data = await response.json();
      this.exchangeRate = data.rates.BRL;

      // Cache the rate
      sessionStorage.setItem('gbp_brl_rate', this.exchangeRate.toString());
      sessionStorage.setItem('gbp_brl_rate_time', Date.now().toString());

      // Update dashboard with new rate
      this.updateDashboard();
    } catch (error) {
      console.error('Erro ao buscar taxa de câmbio:', error);
      // Fallback to approximate rate
      this.exchangeRate = 7.2; // Approximate GBP to BRL
      UI.showToast('Usando taxa de câmbio aproximada', 'warning');
    }
  },

  getFilteredReservations() {
    const reservas = storage.getReservas();
    const now = new Date();

    return reservas.filter(r => {
      // IMPORTANT: Only count commissions that have been paid (sinalPago = true)
      if (!r.sinalPago) {
        return false;
      }

      const checkInDate = new Date(r.checkIn);

      if (this.currentPeriod === 'week') {
        // Current week (Monday to Sunday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return checkInDate >= startOfWeek && checkInDate <= endOfWeek;
      } else if (this.currentPeriod === 'month') {
        // Current month
        return checkInDate.getMonth() === now.getMonth() &&
          checkInDate.getFullYear() === now.getFullYear();
      } else if (this.currentPeriod === 'custom') {
        // Custom date range
        if (!this.customStartDate || !this.customEndDate) return false;

        const start = new Date(this.customStartDate);
        const end = new Date(this.customEndDate);
        end.setHours(23, 59, 59, 999);

        return checkInDate >= start && checkInDate <= end;
      }

      return false;
    });
  },

  updateDashboard() {
    const reservas = this.getFilteredReservations();

    // Calculate statistics
    const totalComissao = reservas.reduce((sum, r) => sum + (r.valorComissao || 0), 0);
    const totalReservas = reservas.length;
    const avgComissao = totalReservas > 0 ? totalComissao / totalReservas : 0;
    const totalComissaoBRL = this.exchangeRate ? totalComissao * this.exchangeRate : 0;

    // Render statistics cards
    this.renderStats(totalComissao, totalComissaoBRL, totalReservas, avgComissao);

    // Render chart
    this.renderChart(reservas);

    // Render reservations list
    this.renderReservationsList(reservas);
  },

  renderStats(totalGBP, totalBRL, count, avg) {
    const container = document.getElementById('stats-container');

    const periodLabel = {
      'week': 'Esta Semana',
      'month': 'Este Mês',
      'custom': 'Período Selecionado'
    }[this.currentPeriod];

    container.innerHTML = `
      <div class="stat-card stat-card-primary">
        <div class="stat-icon">💷</div>
        <div class="stat-content">
          <div class="stat-label">Total em Libras</div>
          <div class="stat-value">${UI.formatCurrency(totalGBP)}</div>
          <div class="stat-subtitle">${periodLabel}</div>
        </div>
      </div>

      <div class="stat-card stat-card-success">
        <div class="stat-icon">💵</div>
        <div class="stat-content">
          <div class="stat-label">Total em Reais</div>
          <div class="stat-value">R$ ${totalBRL.toFixed(2)}</div>
          <div class="stat-subtitle">Taxa: £1 = R$ ${this.exchangeRate ? this.exchangeRate.toFixed(2) : '~'}</div>
        </div>
      </div>

      <div class="stat-card stat-card-info">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-label">Reservas</div>
          <div class="stat-value">${count}</div>
          <div class="stat-subtitle">${periodLabel}</div>
        </div>
      </div>

      <div class="stat-card stat-card-warning">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-label">Média por Reserva</div>
          <div class="stat-value">${UI.formatCurrency(avg)}</div>
          <div class="stat-subtitle">Comissão média</div>
        </div>
      </div>
    `;
  },

  renderChart(reservas) {
    const chartContainer = document.getElementById('chart-container');
    const legendContainer = document.getElementById('chart-legend');

    if (reservas.length === 0) {
      chartContainer.innerHTML = `
        <div style="text-align: center; color: var(--color-text-tertiary);">
          <div style="font-size: 3rem; margin-bottom: var(--space-md);">📊</div>
          <p>Nenhuma reserva no período selecionado</p>
        </div>
      `;
      legendContainer.innerHTML = '';
      return;
    }

    // Group by apartment
    const apartamentos = storage.getApartamentos();
    const comissaoPorApartamento = {};

    reservas.forEach(r => {
      const apt = apartamentos.find(a => a.id === r.apartamentoId);
      const aptName = apt ? `${apt.landlord} - ${apt.cidade}` : 'Desconhecido';

      if (!comissaoPorApartamento[aptName]) {
        comissaoPorApartamento[aptName] = 0;
      }
      comissaoPorApartamento[aptName] += r.valorComissao || 0;
    });

    // Sort by value
    const sortedData = Object.entries(comissaoPorApartamento)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5

    const total = sortedData.reduce((sum, [_, value]) => sum + value, 0);
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];

    // Create donut chart
    let currentAngle = 0;
    const segments = sortedData.map(([name, value], index) => {
      const percentage = (value / total) * 100;
      const angle = (value / total) * 360;
      const segment = {
        name,
        value,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: colors[index]
      };
      currentAngle += angle;
      return segment;
    });

    // Build conic-gradient
    const gradientStops = segments.map(s =>
      `${s.color} ${s.startAngle}deg ${s.endAngle}deg`
    ).join(', ');

    chartContainer.innerHTML = `
      <div class="donut-chart" style="
        width: 250px;
        height: 250px;
        border-radius: 50%;
        background: conic-gradient(${gradientStops});
        position: relative;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 150px;
          height: 150px;
          background: var(--color-bg-primary);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        ">
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-text-primary);">
            ${UI.formatCurrency(total)}
          </div>
          <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 4px;">
            Total
          </div>
        </div>
      </div>
    `;

    // Render legend
    legendContainer.innerHTML = segments.map(s => `
      <div style="display: flex; align-items: center; margin-bottom: var(--space-sm); gap: var(--space-sm);">
        <div style="width: 16px; height: 16px; border-radius: 4px; background: ${s.color}; flex-shrink: 0;"></div>
        <div style="flex: 1; font-size: 0.875rem;">
          <div style="font-weight: 600;">${s.name}</div>
          <div style="color: var(--color-text-secondary); font-size: 0.75rem;">
            ${UI.formatCurrency(s.value)} (${s.percentage.toFixed(1)}%)
          </div>
        </div>
      </div>
    `).join('');
  },

  renderReservationsList(reservas) {
    const container = document.getElementById('reservations-list');

    if (reservas.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--space-xl); color: var(--color-text-tertiary);">
          <div style="font-size: 2rem; margin-bottom: var(--space-sm);">📋</div>
          <p>Nenhuma reserva no período</p>
        </div>
      `;
      return;
    }

    const clientes = storage.getClientes();
    const apartamentos = storage.getApartamentos();

    container.innerHTML = reservas.map(r => {
      const cliente = clientes.find(c => c.id === r.clienteId);
      const apt = apartamentos.find(a => a.id === r.apartamentoId);

      return `
        <div style="
          padding: var(--space-md);
          border-bottom: 1px solid var(--color-border);
          transition: background 0.2s;
        " onmouseover="this.style.background='var(--color-bg-secondary)'" 
           onmouseout="this.style.background='transparent'">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-xs);">
            <div style="font-weight: 600;">${cliente ? cliente.nome : 'N/A'}</div>
            <div style="font-weight: 700; color: var(--color-success);">${UI.formatCurrency(r.valorComissao || 0)}</div>
          </div>
          <div style="font-size: 0.875rem; color: var(--color-text-secondary);">
            ${apt ? `${apt.landlord} - ${apt.cidade}` : 'N/A'}
          </div>
          <div style="font-size: 0.75rem; color: var(--color-text-tertiary); margin-top: var(--space-xs);">
            ${r.quartosAlugados || 1} quarto(s) • Check-in: ${UI.formatDate(r.checkIn)}
          </div>
        </div>
      `;
    }).join('');
  }
};

// Register module
window.PagamentosModule = PagamentosModule;
window.registerModuleWhenReady('pagamentos', PagamentosModule);
