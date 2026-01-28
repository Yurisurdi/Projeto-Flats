// ============================================
// APARTAMENTOS MODULE - Trello Style
// ============================================

const ApartamentosModule = {
  draggedCard: null,
  initialized: false,

  render(container) {
    container.innerHTML = `
      <div style="margin-bottom: var(--space-lg);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: var(--space-sm);">
            <input type="text" class="form-input" id="search-apartamento" placeholder="🔍 Buscar apartamento..." style="max-width: 300px;">
          </div>
          <button class="btn btn-primary" id="add-apartamento-btn">
            ➕ Novo Apartamento
          </button>
        </div>
      </div>

      <div class="kanban-board" id="kanban-board"></div>
    `;

    this.renderKanban();

    // Only attach main event listeners once
    if (!this.initialized) {
      this.attachMainEventListeners();
      this.initialized = true;
    }

    // Always attach card event listeners (they're recreated each render)
    this.attachCardEventListeners();
  },

  renderKanban() {
    const board = document.getElementById('kanban-board');
    let apartamentos = storage.getApartamentos();

    // Apply search
    const searchTerm = document.getElementById('search-apartamento')?.value.toLowerCase();
    if (searchTerm) {
      apartamentos = apartamentos.filter(a =>
        a.landlord?.toLowerCase().includes(searchTerm) ||
        a.cidade?.toLowerCase().includes(searchTerm) ||
        a.endereco?.toLowerCase().includes(searchTerm) ||
        a.descricao?.toLowerCase().includes(searchTerm)
      );
    }

    // Group by landlord
    const landlordGroups = {};
    apartamentos.forEach(apt => {
      const landlord = apt.landlord || 'Sem Landlord';
      if (!landlordGroups[landlord]) {
        landlordGroups[landlord] = [];
      }
      landlordGroups[landlord].push(apt);
    });

    // If no apartments, show empty state
    if (Object.keys(landlordGroups).length === 0) {
      board.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-xl);">
                    <div style="font-size: 3rem; margin-bottom: var(--space-md);">🏢</div>
                    <h3>Nenhum apartamento encontrado</h3>
                    <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">
                        Adicione um novo apartamento para começar.
                    </p>
                    <button class="btn btn-primary" onclick="ApartamentosModule.showForm()">
                        ➕ Novo Apartamento
                    </button>
                </div>
            `;
      return;
    }

    // Render columns for each landlord
    board.innerHTML = Object.keys(landlordGroups).sort().map(landlord => {
      const apartments = landlordGroups[landlord];

      return `
                <div class="kanban-column" data-landlord="${landlord}">
                    <div class="kanban-header">
                        <h3 class="kanban-title">🏠 ${landlord}</h3>
                        <span class="kanban-count">${apartments.length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${apartments.map(apt => this.renderApartmentCard(apt)).join('')}
                    </div>
                </div>
            `;
    }).join('');

    this.attachCardEventListeners();
  },

  renderApartmentCard(apt) {
    const fotos = apt.fotos || [];
    const videoCount = (apt.videoIds || []).length;
    const totalMedia = fotos.length + videoCount;
    const statusBadge = this.getStatusBadge(apt.status || 'disponivel');
    const statusLabel = this.getStatusLabel(apt.status || 'disponivel');

    return `
      <div class="apartment-card" data-id="${apt.id}">
        <div class="apartment-header">
          <div>
            <div class="apartment-location">📍 ${apt.cidade || 'N/A'}</div>
            ${apt.endereco ? `<div style="font-size: 0.75rem; color: var(--color-text-tertiary); margin-top: 2px;">${apt.endereco}</div>` : ''}
          </div>
          <div class="apartment-price">${UI.formatCurrency(apt.valorSemanal || 0)}/sem</div>
        </div>

        <div class="apartment-details">
          <span class="badge badge-${statusBadge}">${statusLabel}</span>
          <span class="badge badge-info">${apt.quartos || 0} 🛏️</span>
        </div>

        ${apt.descricao ? `
          <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin: var(--space-sm) 0; line-height: 1.4;">
            ${apt.descricao.substring(0, 120)}${apt.descricao.length > 120 ? '...' : ''}
          </p>
        ` : ''}

        ${totalMedia > 0 ? `
          <div class="apartment-gallery">
            ${fotos.slice(0, 2).map(foto => `
              <img src="${foto.data}" alt="Foto do apartamento">
            `).join('')}
            ${videoCount > 0 && fotos.length < 2 ? `
              <div style="display: flex; align-items: center; justify-content: center; background: var(--color-bg-tertiary); border-radius: var(--radius-sm); font-size: 2rem;">
                🎬
              </div>
            ` : ''}
            ${totalMedia > 2 ? `
              <div style="display: flex; align-items: center; justify-content: center; background: var(--color-bg-tertiary); border-radius: var(--radius-sm); font-size: 0.875rem; font-weight: 600; color: var(--color-text-secondary);">
                +${totalMedia - 2} arquivos
              </div>
            ` : ''}
          </div>
        ` : `
          <div style="padding: var(--space-md); background: var(--color-bg-tertiary); border-radius: var(--radius-sm); text-align: center; color: var(--color-text-tertiary); font-size: 0.875rem;">
            📷 Sem fotos ou vídeos
          </div>
        `}

        <div style="display: flex; gap: var(--space-xs); margin-top: var(--space-sm);">
          <button class="btn btn-sm btn-secondary" data-action="view" data-id="${apt.id}" style="flex: 1;">👁️ Ver</button>
          <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${apt.id}" style="flex: 1;">✏️</button>
          <button class="btn btn-sm btn-danger" data-action="delete" data-id="${apt.id}" style="flex: 1;">🗑️</button>
        </div>
      </div>
    `;
  },

  attachMainEventListeners() {
    // These listeners are attached only once when module initializes
    document.getElementById('add-apartamento-btn').addEventListener('click', () => this.showForm());

    const searchInput = document.getElementById('search-apartamento');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderKanban());
    }

    // Use event delegation for card buttons - attach once to the board
    const board = document.getElementById('kanban-board');
    board.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      e.stopPropagation();
      const action = target.getAttribute('data-action');
      const id = target.getAttribute('data-id');

      if (action === 'view') {
        this.showDetails(id);
      } else if (action === 'edit') {
        this.showForm(id);
      } else if (action === 'delete') {
        if (await UI.confirm('Tem certeza que deseja excluir este apartamento?')) {
          await window.mediaStorage.deleteFilesByApartment(id);
          storage.deleteApartamento(id);
          UI.showToast('Apartamento excluído com sucesso', 'success');
          this.renderKanban();
        }
      }
    });
  },

  attachCardEventListeners() {
    // No longer needed - using event delegation instead
    // This function is kept for compatibility but does nothing
  },

  async showDetails(aptId) {
    const apt = storage.getApartamentoById(aptId);
    if (!apt) return;

    const fotos = apt.fotos || [];
    const videoCount = (apt.videoIds || []).length;

    const detailsHtml = `
      <div style="padding: var(--space-md);">
        <div class="grid grid-2" style="gap: var(--space-md); margin-bottom: var(--space-md);">
          <div>
            <strong>Landlord:</strong> ${apt.landlord || 'N/A'}
          </div>
          <div>
            <strong>Cidade:</strong> ${apt.cidade || 'N/A'}
          </div>
        </div>
        
        ${apt.endereco ? `<div style="margin-bottom: var(--space-md);"><strong>Endereço:</strong> ${apt.endereco}</div>` : ''}
        
        <div class="grid grid-2" style="gap: var(--space-md); margin-bottom: var(--space-md);">
          <div>
            <strong>Quartos:</strong> ${apt.quartos || 0}
          </div>
          <div>
            <strong>Valor Semanal:</strong> ${UI.formatCurrency(apt.valorSemanal || 0)}
          </div>
        </div>
        
        <div style="margin-bottom: var(--space-md);">
          <strong>Status:</strong> <span class="badge badge-${this.getStatusBadge(apt.status || 'disponivel')}">${this.getStatusLabel(apt.status || 'disponivel')}</span>
        </div>
        
        ${apt.descricao ? `<div style="margin-bottom: var(--space-md);"><strong>Descrição:</strong><br>${apt.descricao}</div>` : ''}
        
        <div>
          <strong>Mídia:</strong> ${fotos.length} foto(s), ${videoCount} vídeo(s)
        </div>
      </div>
    `;

    await UI.showModal(
      'Detalhes do Apartamento',
      detailsHtml,
      {
        confirmText: 'Fechar',
        cancelText: null,
        maxWidth: '600px'
      }
    );
  },


  async showForm(aptId = null) {
    const apt = aptId ? storage.getApartamentoById(aptId) : {};
    const isEdit = !!aptId;

    const formHtml = `
      <form id="apartamento-form">
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label form-label-required">Nome do Landlord</label>
            <input type="text" class="form-input" name="landlord" value="${apt.landlord || ''}" required>
          </div>

          <div class="form-group">
            <label class="form-label form-label-required">Cidade</label>
            <input type="text" class="form-input" name="cidade" value="${apt.cidade || ''}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Endereço / Localização</label>
          <input type="text" class="form-input" name="endereco" value="${apt.endereco || ''}">
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label form-label-required">Quantidade de Quartos</label>
            <select class="form-select" name="quartos" required>
              <option value="">Selecione...</option>
              <option value="1" ${apt.quartos == 1 ? 'selected' : ''}>1 quarto</option>
              <option value="2" ${apt.quartos == 2 ? 'selected' : ''}>2 quartos</option>
              <option value="3" ${apt.quartos == 3 ? 'selected' : ''}>3 quartos</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label form-label-required">Valor Semanal (£)</label>
            <input 
              type="number" 
              class="form-input" 
              name="valorSemanal" 
              value="${apt.valorSemanal || ''}" 
              step="0.01" 
              min="0"
              inputmode="decimal"
              onkeypress="return (event.charCode >= 48 && event.charCode <= 57) || event.charCode === 46 || event.charCode === 44"
              required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" name="status">
            <option value="disponivel" ${(apt.status || 'disponivel') === 'disponivel' ? 'selected' : ''}>Disponível</option>
            <option value="ocupado" ${apt.status === 'ocupado' ? 'selected' : ''}>Ocupado</option>
            <option value="reforma" ${apt.status === 'reforma' ? 'selected' : ''}>Em Reforma</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Descrição Completa</label>
          <textarea class="form-textarea" name="descricao">${apt.descricao || ''}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Fotos e Vídeos</label>
          <div id="file-upload-container"></div>
        </div>
      </form>
    `;


    const result = await UI.showModal(
      isEdit ? 'Editar Apartamento' : 'Novo Apartamento',
      formHtml,
      {
        confirmText: 'Salvar',
        cancelText: 'Cancelar',
        maxWidth: '700px',
        returnElement: true,
        onConfirm: null // We'll handle this manually
      }
    );

    if (!result) return;

    const { modal, backdrop, close } = result;

    // Add backdrop click listener (close when clicking outside)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        e.preventDefault();
        e.stopPropagation();
        close(false);
      }
    });

    // Close button (X)
    const modalCloseBtn = modal.querySelector('.modal-close');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close(false);
      });
    }

    // Cancel button
    const modalCancelBtn = modal.querySelector('[data-action="cancel"]');
    if (modalCancelBtn) {
      modalCancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close(false);
      });
    }

    // Setup file upload
    const fileUploadContainer = modal.querySelector('#file-upload-container');
    const fileUpload = UI.createFileUpload({
      multiple: true,
      accept: 'image/*,video/*'
    });
    fileUploadContainer.appendChild(fileUpload.container);

    // Set existing files - load videos from IndexedDB
    if (apt.fotos || (apt.videoIds && apt.videoIds.length > 0)) {
      const existingFiles = [...(apt.fotos || [])];

      // Load videos from IndexedDB if editing
      if (apt.videoIds && apt.videoIds.length > 0) {
        try {
          const videoPromises = apt.videoIds.map(id => window.mediaStorage.getFile(id));
          const videos = await Promise.all(videoPromises);
          existingFiles.push(...videos);
        } catch (error) {
          console.error('Erro ao carregar vídeos:', error);
        }
      }

      fileUpload.setFiles(existingFiles);
    }

    // Confirm button handler
    const confirmBtn = modal.querySelector('[data-action="confirm"]');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const form = modal.querySelector('#apartamento-form');
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        // Show loading state
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Salvando...';

        try {
          console.log('🚀 INICIANDO SALVAMENTO');
          const formData = new FormData(form);
          const files = fileUpload.getFiles();
          console.log('📁 Total de arquivos:', files.length, files);

          // Separate small images (localStorage) from large videos (IndexedDB)
          const fotos = files.filter(f => f.type.startsWith('image/'));
          const videos = files.filter(f => f.type.startsWith('video/'));
          console.log('📸 Fotos:', fotos.length, '🎬 Vídeos:', videos.length);

          const data = {
            landlord: formData.get('landlord'),
            cidade: formData.get('cidade'),
            endereco: formData.get('endereco'),
            quartos: parseInt(formData.get('quartos')),
            valorSemanal: parseFloat(formData.get('valorSemanal')),
            status: formData.get('status'),
            descricao: formData.get('descricao'),
            fotos: fotos, // Store in localStorage
            videoIds: [] // Will store IndexedDB IDs
          };

          let apartmentId;

          // Save or update apartment
          if (isEdit) {
            // Delete old videos from IndexedDB
            await window.mediaStorage.deleteFilesByApartment(aptId);
            storage.updateApartamento(aptId, data);
            apartmentId = aptId;
          } else {
            apartmentId = storage.addApartamento(data);
          }

          // Save videos to IndexedDB
          console.log('🔍 Verificando vídeos. Total:', videos.length);
          if (videos.length > 0) {
            console.log('💾 ENTRANDO no bloco de salvar vídeos! ApartmentID:', apartmentId);
            const videoIds = [];
            for (const video of videos) {
              console.log('📹 Salvando vídeo:', video.name, video.type, video.size, 'bytes');
              const savedVideo = await window.mediaStorage.saveFile(apartmentId, video);
              videoIds.push(savedVideo.id);
              console.log('✅ Vídeo salvo com ID:', savedVideo.id);
            }

            // Update apartment with video IDs
            storage.updateApartamento(apartmentId, { videoIds });
          }

          UI.showToast(
            isEdit ? 'Apartamento atualizado com sucesso' : 'Apartamento adicionado com sucesso',
            'success'
          );

          // Close modal FIRST
          close(true);

          // Then render kanban
          this.renderKanban();
        } catch (error) {
          console.error('Erro ao salvar apartamento:', error);
          UI.showToast('Erro ao salvar. Tente novamente.', 'error');
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Salvar';
        }
      });
    }

    // Cancel button handler
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close(false);
      });
    }

    // Close button (X) handler
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close(false);
      });
    }
  },

  async showDetails(aptId) {
    const apt = storage.getApartamentoById(aptId);
    if (!apt) return;

    const fotos = apt.fotos || [];

    // Load videos from IndexedDB
    let videos = [];
    if (apt.videoIds && apt.videoIds.length > 0) {
      try {
        const videoPromises = apt.videoIds.map(id => window.mediaStorage.getFile(id));
        videos = await Promise.all(videoPromises);
      } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
      }
    }

    const detailsHtml = `
      <div style="margin-bottom: var(--space-lg);">
        <h4>${apt.landlord}</h4>
        <p style="color: var(--color-text-secondary);">📍 ${apt.cidade} - ${apt.endereco || 'N/A'}</p>
      </div>

      <div class="grid grid-2" style="margin-bottom: var(--space-lg);">
        <div>
          <p><strong>Quartos:</strong> ${apt.quartos} 🛏️</p>
          <p><strong>Valor Semanal:</strong> ${UI.formatCurrency(apt.valorSemanal || 0)}</p>
        </div>
        <div>
          <p><strong>Status:</strong> <span class="badge badge-${this.getStatusBadge(apt.status)}">${this.getStatusLabel(apt.status)}</span></p>
        </div>
      </div>

      ${apt.descricao ? `
        <div style="margin-bottom: var(--space-lg);">
          <h5>Descrição</h5>
          <p style="white-space: pre-wrap;">${apt.descricao}</p>
        </div>
      ` : ''}

      ${fotos.length > 0 ? `
        <div style="margin-bottom: var(--space-lg);">
          <h5>Fotos (${fotos.length})</h5>
          <div class="file-preview-grid">
            ${fotos.map(foto => `
              <div class="file-preview">
                <img src="${foto.data}" alt="${foto.name}" style="cursor: pointer;" onclick="window.open('${foto.data}', '_blank')">
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${videos.length > 0 ? `
        <div>
          <h5>Vídeos (${videos.length})</h5>
          <div class="file-preview-grid">
            ${videos.map(video => `
              <div class="file-preview">
                <video src="${video.data}" controls></video>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    await UI.showModal('Detalhes do Apartamento', detailsHtml, {
      showFooter: false,
      maxWidth: '800px'
    });
  },

  getStatusBadge(status) {
    const badges = {
      'disponivel': 'success',
      'ocupado': 'warning',
      'reforma': 'danger'
    };
    return badges[status] || 'info';
  },

  getStatusLabel(status) {
    const labels = {
      'disponivel': 'Disponível',
      'ocupado': 'Ocupado',
      'reforma': 'Em Reforma'
    };
    return labels[status] || status;
  }
};


// Register module
window.ApartamentosModule = ApartamentosModule;
window.registerModuleWhenReady('apartamentos', ApartamentosModule);

