// ============================================
// REUSABLE UI COMPONENTS
// ============================================

class UIComponents {
    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================

    static showToast(message, type = 'info', duration = 3000) {
        // Create toast container if it doesn't exist
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getToastIcon(type);
        toast.innerHTML = `
      <span style="font-size: 1.25rem;">${icon}</span>
      <span>${message}</span>
    `;

        container.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    // ============================================
    // MODAL
    // ============================================

    static showModal(title, content, options = {}) {
        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.maxWidth = options.maxWidth || '600px';

            modal.innerHTML = `
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" type="button">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${options.showFooter !== false ? `
          <div class="modal-footer">
            ${options.cancelText ? `<button class="btn btn-secondary" data-action="cancel">${options.cancelText}</button>` : ''}
            ${options.confirmText ? `<button class="btn btn-primary" data-action="confirm">${options.confirmText}</button>` : ''}
          </div>
        ` : ''}
      `;

            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);

            // Event handlers
            const closeModal = (result) => {
                backdrop.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    backdrop.remove();
                    resolve(result);
                }, 300);
            };

            // Only attach default listeners if NOT returning element for custom handling
            if (!options.returnElement) {
                modal.querySelector('.modal-close').addEventListener('click', () => closeModal(false));
                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) closeModal(false);
                });

                const confirmBtn = modal.querySelector('[data-action="confirm"]');
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        if (options.onConfirm) {
                            const result = options.onConfirm(modal);
                            if (result !== false) closeModal(true);
                        } else {
                            closeModal(true);
                        }
                    });
                }

                const cancelBtn = modal.querySelector('[data-action="cancel"]');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => closeModal(false));
                }
            }

            // Return modal element for custom handling
            if (options.returnElement) {
                resolve({ modal, backdrop, close: closeModal });
            }
        });
    }

    static async confirm(message, title = 'Confirmação') {
        return await this.showModal(title, `<p>${message}</p>`, {
            confirmText: 'Confirmar',
            cancelText: 'Cancelar'
        });
    }

    // ============================================
    // FILE UPLOAD WITH PREVIEW
    // ============================================

    static createFileUpload(options = {}) {
        const container = document.createElement('div');

        const uploadArea = document.createElement('div');
        uploadArea.className = 'file-upload-area';
        uploadArea.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
      <p><strong>Clique para selecionar</strong> ou arraste arquivos aqui</p>
      <p style="font-size: 0.875rem; color: var(--color-text-tertiary);">
        ${options.accept || 'Todos os arquivos'}
      </p>
      <p style="font-size: 0.75rem; color: var(--color-text-tertiary); margin-top: 0.5rem;">
        ✅ Limite: 50MB por arquivo
      </p>
      <input type="file" style="display: none;" ${options.multiple ? 'multiple' : ''} 
             accept="${options.accept || '*'}">
    `;

        const previewGrid = document.createElement('div');
        previewGrid.className = 'file-preview-grid';

        container.appendChild(uploadArea);
        container.appendChild(previewGrid);

        const fileInput = uploadArea.querySelector('input[type="file"]');
        const files = [];

        // Click to select
        uploadArea.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });


        const handleFiles = (fileList) => {
            Array.from(fileList).forEach(file => {
                // Check file size - IndexedDB can handle much larger files
                const fileSizeMB = file.size / (1024 * 1024);

                // Reject files larger than 50MB
                if (fileSizeMB > 50) {
                    UIComponents.showToast(
                        `Arquivo "${file.name}" é muito grande (${fileSizeMB.toFixed(1)}MB). Máximo: 50MB`,
                        'error',
                        5000
                    );
                    return;
                }

                // Warn about files between 20-50MB
                if (fileSizeMB > 20) {
                    UIComponents.showToast(
                        `Arquivo "${file.name}" é grande (${fileSizeMB.toFixed(1)}MB). O upload pode demorar alguns segundos.`,
                        'warning',
                        4000
                    );
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileData = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.target.result
                    };
                    files.push(fileData);
                    addPreview(fileData);
                    if (options.onChange) options.onChange(files);
                };
                reader.onerror = () => {
                    UIComponents.showToast(
                        `Erro ao carregar "${file.name}". Tente novamente.`,
                        'error'
                    );
                };
                reader.readAsDataURL(file);
            });
        };

        const addPreview = (fileData) => {
            const preview = document.createElement('div');
            preview.className = 'file-preview';

            if (fileData.type.startsWith('image/')) {
                preview.innerHTML = `
          <img src="${fileData.data}" alt="${fileData.name}">
          <button class="file-preview-remove" type="button">&times;</button>
        `;
            } else if (fileData.type.startsWith('video/')) {
                preview.innerHTML = `
          <video src="${fileData.data}"></video>
          <button class="file-preview-remove" type="button">&times;</button>
        `;
            }

            preview.querySelector('.file-preview-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                const index = files.indexOf(fileData);
                if (index > -1) files.splice(index, 1);
                preview.remove();
                if (options.onChange) options.onChange(files);
            });

            previewGrid.appendChild(preview);
        };

        return {
            container, getFiles: () => files, setFiles: (newFiles) => {
                files.length = 0;
                files.push(...newFiles);
                previewGrid.innerHTML = '';
                newFiles.forEach(addPreview);
            }
        };
    }

    // ============================================
    // FORM BUILDER
    // ============================================

    static createForm(fields, data = {}) {
        const form = document.createElement('form');

        fields.forEach(field => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.className = 'form-label' + (field.required ? ' form-label-required' : '');
            label.textContent = field.label;
            label.htmlFor = field.name;
            formGroup.appendChild(label);

            let input;

            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.className = 'form-textarea';
            } else if (field.type === 'select') {
                input = document.createElement('select');
                input.className = 'form-select';

                if (field.placeholder) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = field.placeholder;
                    input.appendChild(option);
                }

                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    input.appendChild(option);
                });
            } else if (field.type === 'checkbox') {
                const wrapper = document.createElement('div');
                wrapper.className = 'form-checkbox';
                input = document.createElement('input');
                input.type = 'checkbox';
                const checkLabel = document.createElement('label');
                checkLabel.textContent = field.checkLabel || '';
                wrapper.appendChild(input);
                wrapper.appendChild(checkLabel);
                formGroup.appendChild(wrapper);
            } else {
                input = document.createElement('input');
                input.className = 'form-input';
                input.type = field.type || 'text';
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            input.name = field.name;
            input.id = field.name;
            if (field.required) input.required = true;
            if (data[field.name] !== undefined) {
                if (field.type === 'checkbox') {
                    input.checked = data[field.name];
                } else {
                    input.value = data[field.name];
                }
            }

            if (field.type !== 'checkbox') {
                formGroup.appendChild(input);
            }

            if (field.help) {
                const help = document.createElement('div');
                help.className = 'form-help';
                help.textContent = field.help;
                formGroup.appendChild(help);
            }

            form.appendChild(formGroup);
        });

        return form;
    }

    // ============================================
    // LOADING SPINNER
    // ============================================

    static showLoading(container) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.margin = '2rem auto';
        container.innerHTML = '';
        container.appendChild(spinner);
    }

    // ============================================
    // EMPTY STATE
    // ============================================

    static showEmptyState(container, options = {}) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${options.icon || '📭'}</div>
        <h3 class="empty-state-title">${options.title || 'Nenhum item encontrado'}</h3>
        <p class="empty-state-description">${options.description || 'Comece adicionando um novo item.'}</p>
        ${options.actionText ? `<button class="btn btn-primary" id="empty-state-action">${options.actionText}</button>` : ''}
      </div>
    `;

        if (options.onAction) {
            container.querySelector('#empty-state-action')?.addEventListener('click', options.onAction);
        }
    }

    // ============================================
    // FORMAT HELPERS
    // ============================================

    static formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'GBP'
        }).format(value);
    }

    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    static formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('pt-BR');
    }
}

// Make available globally
window.UI = UIComponents;
