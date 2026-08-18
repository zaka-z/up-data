//13
function createEmptyInteractionRow() {
      const now = new Date();
      const row = {};

      interactionsSchema.forEach(field => {
        switch (field.auto) {
          case 'uuid':
            row[field.name] = generateUUID();
            break;
          case 'iso':
            row[field.name] = now.toISOString();
            break;
          case 'date':
            row[field.name] = formatLocalDate(now);
            break;
          case 'time':
            row[field.name] = formatLocalTime(now);
            break;
          default:
            row[field.name] = '';
        }
      });

      return row;
    }

    function validateInteractionRow(row, rowIndex) {
      const normalizedProductID = normalizeProductID(row.ProductID);
      if (!normalizedProductID) {
        alert(`ردیف ${rowIndex + 1}: فیلد "کد محصول" اجباری است.`);
        addLog(`اعتبارسنجی تعاملات: ردیف ${rowIndex + 1} فاقد ProductID.`, 'error');
        return false;
      }

      const numericFields = ['View', 'Touch', 'Ask', 'Pause', 'Like', 'Save', 'Comment', 'Message', 'EngagementScore', 'PurchaseIntentScore'];
      for (let fieldName of numericFields) {
        const value = row[fieldName];
        if (value !== undefined && value !== '' && value !== null) {
          const num = parseFiniteNumber(value);
          if (Number.isNaN(num)) {
            alert(`ردیف ${rowIndex + 1}: فیلد "${fieldName}" باید عددی باشد.`);
            addLog(`اعتبارسنجی تعاملات: ردیف ${rowIndex + 1} فیلد ${fieldName} عددی نیست.`, 'error');
            return false;
          }
          if (num !== null && num < 0) {
            alert(`ردیف ${rowIndex + 1}: فیلد "${fieldName}" نمی‌تواند منفی باشد.`);
            addLog(`اعتبارسنجی تعاملات: ردیف ${rowIndex + 1} فیلد ${fieldName} منفی است.`, 'error');
            return false;
          }
        }
      }
      return true;
    }

    function validateInteractionsData() {
      for (let i = 0; i < interactionsData.length; i++) {
        if (!validateInteractionRow(interactionsData[i], i)) return false;
      }
      return true;
    }

    function addInteractionRow() {
      const newRow = createEmptyInteractionRow();
      interactionsData.push(newRow);
      markDirty('interactions');
      addLog('یک ردیف جدید به جدول تعاملات اضافه شد.', 'info');
      refreshTableForTab('interactions');
      
      const totalPages = Math.ceil(interactionsData.length / pageSize);
      if (totalPages > 0 && paginationState.interactions.page !== totalPages) {
        paginationState.interactions.page = totalPages;
        refreshTableForTab('interactions');
      }
    }

    function renderEditableInteractionsTable() {
      const container = document.getElementById('interactionsTableContainer');
      const paginationDiv = document.getElementById('interactionsPagination');
      if (!container || !paginationDiv) return;

      const page = paginationState.interactions.page;
      const totalPages = Math.ceil(interactionsData.length / pageSize) || 1;
      const clampedPage = clampPage(page, totalPages);
      if (page !== clampedPage) paginationState.interactions.page = clampedPage;
      
      const start = (paginationState.interactions.page - 1) * pageSize;
      const end = Math.min(start + pageSize, interactionsData.length);
      const pageData = interactionsData.slice(start, end);

      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      interactionsSchema.forEach(field => {
        const th = document.createElement('th');
        th.textContent = field.label;
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      const tbody = document.createElement('tbody');
      
      pageData.forEach((row, pageIndex) => {
        const globalIndex = start + pageIndex;
        const tr = document.createElement('tr');
        tr.dataset.index = globalIndex;
        
        interactionsSchema.forEach(field => {
          const td = document.createElement('td');
          const fieldName = field.name;
          const value = row[fieldName] !== undefined ? row[fieldName] : '';
          const isAuto = !!field.auto;
          
          if (field.type === 'select') {
            const select = document.createElement('select');
            select.dataset.field = fieldName;
            select.dataset.index = globalIndex;
            if (isAuto) select.disabled = true;
            
            field.options.forEach(opt => {
              const option = document.createElement('option');
              option.value = opt;
              option.textContent = opt || '--';
              option.selected = value === opt;
              select.appendChild(option);
            });
            
            select.addEventListener('change', function() {
              const idx = parseInt(this.dataset.index, 10);
              const field = this.dataset.field;
              if (idx >= 0 && idx < interactionsData.length && field) {
                interactionsData[idx][field] = this.value;
                markDirty('interactions');
                if (field === 'ProductID') {
                  updateInteractionsProductHelper(this.value, idx);
                }
              }
            });
            
            td.appendChild(select);
          } else if (field.type === 'textarea') {
            const textarea = document.createElement('textarea');
            textarea.dataset.field = fieldName;
            textarea.dataset.index = globalIndex;
            textarea.value = value;
            if (isAuto) textarea.readOnly = true;
            
            textarea.addEventListener('change', function() {
              const idx = parseInt(this.dataset.index, 10);
              const field = this.dataset.field;
              if (idx >= 0 && idx < interactionsData.length && field) {
                interactionsData[idx][field] = this.value;
                markDirty('interactions');
              }
            });
            
            td.appendChild(textarea);
          } else {
            let inputType = 'text';
            if (field.type === 'number') inputType = 'number';
            else if (field.type === 'date') inputType = 'date';
            else if (field.type === 'time') inputType = 'time';
            
            const input = document.createElement('input');
            input.type = inputType;
            input.dataset.field = fieldName;
            input.dataset.index = globalIndex;
            input.value = value;
            if (isAuto) input.readOnly = true;
            
            input.addEventListener('change', function() {
              const idx = parseInt(this.dataset.index, 10);
              const field = this.dataset.field;
              if (idx >= 0 && idx < interactionsData.length && field) {
                const normalizedValue = normalizeCellValue(field, this.value, interactionsSchema);
                interactionsData[idx][field] = normalizedValue;
                markDirty('interactions');
                if (field === 'ProductID') {
                  updateInteractionsProductHelper(this.value, idx);
                }
              }
            });
            
            td.appendChild(input);
          }
          
          tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
      });
      
      table.appendChild(tbody);
      container.innerHTML = '';
      container.appendChild(table);

      let pagHTML = '';
      pagHTML += `<button ${page === 1 ? 'disabled' : ''} onclick="changePage('interactions', ${page - 1})">قبلی</button>`;
      pagHTML += `<span>صفحه ${page} از ${totalPages}</span>`;
      pagHTML += `<button ${page === totalPages ? 'disabled' : ''} onclick="changePage('interactions', ${page + 1})">بعدی</button>`;
      pagHTML += `<span> | نمایش ${interactionsData.length} رکورد</span>`;
      paginationDiv.innerHTML = pagHTML;
    }

    async function saveInteractionsTable() {
      if (!validateInteractionsData()) {
        addLog('ذخیره تعاملات انجام نشد؛ جدول دارای خطا است.', 'error');
        return false;
      }

      const result = await saveCSVToFile(
        interactionsData,
        interactionsSchema,
        interactionsFileHandle,
        'interactions'
      );

      if (result) {
        markClean('interactions');
        addLog('جدول تعاملات با موفقیت ذخیره شد.', 'info');
      }

      return result;
    }