// ============================================
// STORAGE MANAGER - Hybrid LocalStorage
// ============================================
// Shared data: Clientes, Agentes, Apartamentos
// User-specific: Reservas, Configurações

class StorageManager {
  constructor() {
    this.sharedKey = 'flatManagement_shared'; // Shared between all users
    this.userKeyPrefix = 'flatManagement_user_'; // User-specific data
    this.initializeStorage();
  }

  // Get current user ID
  getCurrentUserId() {
    const session = window.auth?.getSession();
    return session ? session.userId : null;
  }

  // Initialize storage with default structure
  initializeStorage() {
    // Initialize shared data if doesn't exist
    if (!localStorage.getItem(this.sharedKey)) {
      const sharedData = {
        clientes: [],
        agentes: [],
        apartamentos: []
      };
      localStorage.setItem(this.sharedKey, JSON.stringify(sharedData));
    }

    // Initialize user-specific data if logged in
    const userId = this.getCurrentUserId();
    if (userId) {
      const userKey = this.userKeyPrefix + userId;
      if (!localStorage.getItem(userKey)) {
        const userData = {
          reservas: [],
          configuracoes: {
            comissaoPadrao: 50,
            tema: 'light'
          }
        };
        localStorage.setItem(userKey, JSON.stringify(userData));
      }
    }
  }

  // Get shared data
  getSharedData() {
    const data = localStorage.getItem(this.sharedKey);
    return data ? JSON.parse(data) : { clientes: [], agentes: [], apartamentos: [] };
  }

  // Save shared data
  saveSharedData(data) {
    localStorage.setItem(this.sharedKey, JSON.stringify(data));
  }

  // Get user-specific data
  getUserData() {
    const userId = this.getCurrentUserId();
    if (!userId) return { reservas: [], configuracoes: {} };

    const userKey = this.userKeyPrefix + userId;
    const data = localStorage.getItem(userKey);
    return data ? JSON.parse(data) : { reservas: [], configuracoes: {} };
  }

  // Save user-specific data
  saveUserData(data) {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const userKey = this.userKeyPrefix + userId;
    localStorage.setItem(userKey, JSON.stringify(data));
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }


  // ============================================
  // CLIENTES (SHARED DATA)
  // ============================================

  getClientes() {
    return this.getSharedData().clientes || [];
  }

  getClienteById(id) {
    return this.getClientes().find(c => c.id === id);
  }

  addCliente(cliente) {
    const data = this.getSharedData();
    cliente.id = this.generateId();
    cliente.dataCadastro = new Date().toISOString();
    data.clientes.push(cliente);
    this.saveSharedData(data);
    return cliente.id;
  }

  updateCliente(id, updates) {
    const data = this.getSharedData();
    const index = data.clientes.findIndex(c => c.id === id);
    if (index !== -1) {
      data.clientes[index] = { ...data.clientes[index], ...updates };
      this.saveSharedData(data);
      return true;
    }
    return false;
  }

  deleteCliente(id) {
    const data = this.getSharedData();
    data.clientes = data.clientes.filter(c => c.id !== id);
    this.saveSharedData(data);
  }

  // ============================================
  // AGENTES (SHARED DATA)
  // ============================================

  getAgentes() {
    return this.getSharedData().agentes || [];
  }

  getAgenteById(id) {
    return this.getAgentes().find(a => a.id === id);
  }

  addAgente(agente) {
    const data = this.getSharedData();
    agente.id = this.generateId();
    agente.dataCadastro = new Date().toISOString();
    data.agentes.push(agente);
    this.saveSharedData(data);
    return agente.id;
  }

  updateAgente(id, updates) {
    const data = this.getSharedData();
    const index = data.agentes.findIndex(a => a.id === id);
    if (index !== -1) {
      data.agentes[index] = { ...data.agentes[index], ...updates };
      this.saveSharedData(data);
      return true;
    }
    return false;
  }

  deleteAgente(id) {
    const data = this.getSharedData();
    data.agentes = data.agentes.filter(a => a.id !== id);
    this.saveSharedData(data);
  }

  // ============================================
  // APARTAMENTOS (SHARED DATA)
  // ============================================

  getApartamentos() {
    return this.getSharedData().apartamentos || [];
  }

  getApartamentoById(id) {
    return this.getApartamentos().find(a => a.id === id);
  }

  addApartamento(apartamento) {
    const data = this.getSharedData();
    apartamento.id = this.generateId();
    apartamento.dataCadastro = new Date().toISOString();
    data.apartamentos.push(apartamento);
    this.saveSharedData(data);
    return apartamento.id;
  }

  updateApartamento(id, updates) {
    const data = this.getSharedData();
    const index = data.apartamentos.findIndex(a => a.id === id);
    if (index !== -1) {
      data.apartamentos[index] = { ...data.apartamentos[index], ...updates };
      this.saveSharedData(data);
      return true;
    }
    return false;
  }

  deleteApartamento(id) {
    const data = this.getSharedData();
    data.apartamentos = data.apartamentos.filter(a => a.id !== id);
    this.saveSharedData(data);
  }

  // ============================================
  // RESERVAS (USER-SPECIFIC DATA)
  // ============================================

  getReservas() {
    return this.getUserData().reservas || [];
  }

  getReservaById(id) {
    return this.getReservas().find(r => r.id === id);
  }

  getReservasByCliente(clienteId) {
    const reservas = this.getReservas();
    return reservas.filter(r => r.clienteId === clienteId);
  }

  addReserva(reserva) {
    const data = this.getUserData();
    reserva.id = this.generateId();
    reserva.dataCadastro = new Date().toISOString();
    data.reservas.push(reserva);
    this.saveUserData(data);
    return reserva.id;
  }

  updateReserva(id, updates) {
    const data = this.getUserData();
    const index = data.reservas.findIndex(r => r.id === id);
    if (index !== -1) {
      data.reservas[index] = { ...data.reservas[index], ...updates };
      this.saveUserData(data);
      return true;
    }
    return false;
  }

  deleteReserva(id) {
    const data = this.getUserData();
    data.reservas = data.reservas.filter(r => r.id !== id);
    this.saveUserData(data);
  }

  // ============================================
  // PAGAMENTOS (USER-SPECIFIC DATA)
  // ============================================

  getPagamentos() {
    return this.getUserData().pagamentos || [];
  }

  getPagamentosByReserva(reservaId) {
    const pagamentos = this.getPagamentos();
    return pagamentos.filter(p => p.reservaId === reservaId);
  }

  addPagamento(pagamento) {
    const data = this.getUserData();
    pagamento.id = this.generateId();
    pagamento.dataCadastro = new Date().toISOString();
    data.pagamentos.push(pagamento);
    this.saveUserData(data);
    return pagamento.id;
  }

  updatePagamento(id, updates) {
    const data = this.getUserData();
    const index = data.pagamentos.findIndex(p => p.id === id);
    if (index !== -1) {
      data.pagamentos[index] = { ...data.pagamentos[index], ...updates };
      this.saveUserData(data);
      return true;
    }
    return false;
  }

  deletePagamento(id) {
    const data = this.getUserData();
    data.pagamentos = data.pagamentos.filter(p => p.id !== id);
    this.saveUserData(data);
  }

  // ============================================
  // CONFIGURAÇÕES (USER-SPECIFIC DATA)
  // ============================================

  getConfiguracoes() {
    return this.getUserData().configuracoes || {};
  }

  updateConfiguracoes(updates) {
    const data = this.getUserData();
    data.configuracoes = {
      ...data.configuracoes,
      ...updates
    };
    this.saveUserData(data);
    return data.configuracoes;
  }

  // ============================================
  // BACKUP & RESTORE
  // ============================================

  exportData() {
    const data = this.getData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-flats-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      this.saveData(data);
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  }

  clearAllData() {
    if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita!')) {
      localStorage.removeItem(this.storageKey);
      this.initializeStorage();
      return true;
    }
    return false;
  }
}

// Create global instance
window.storage = new StorageManager();
