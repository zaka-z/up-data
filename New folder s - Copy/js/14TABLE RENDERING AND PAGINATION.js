    //14
    function renderTable(dataArray, schema, containerId, paginationId, tabKey) {
      const container = document.getElementById(containerId);
      const paginationDiv = document.getElementById(paginationId);
      if (!container || !paginationDiv) return;

      if (typeof paginationState === 'undefined' || !paginationState[tabKey]) return;
      if (typeof pageSize === 'undefined') {
        console.error('pageSize is not defined');
        return;
      }

      const page = paginationState[tabKey].page;
      const totalPages = Math.ceil(dataArray.length / pageSize) || 1;
      
      if (typeof clampPage === 'function') {
        const clampedPage = clampPage(page, totalPages);
        if (page !== clampedPage) paginationState[tabKey].page = clampedPage;
      }
      
      const start = (paginationState[tabKey].page - 1) * pageSize;
      const end = Math.min(start + pageSize, dataArray.length);
      const pageData = dataArray.slice(start, end);

      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      schema.forEach(field => {
        const th = document.createElement('th');
        th.textContent = field.label;
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      const tbody = document.createElement('tbody');
      
      pageData.forEach(row => {
        const tr = document.createElement('tr');
        
        schema.forEach(field => {
          const td = document.createElement('td');
          td.textContent = row[field.name] !== undefined ? row[field.name] : '';
          tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
      });
      
      table.appendChild(tbody);
      container.innerHTML = '';
      container.appendChild(table);

      // Safely escape tabKey if escapeHTML function exists
      const safeTabKey = (typeof escapeHTML === 'function') ? escapeHTML(tabKey) : tabKey;
      let pagHTML = '';
      pagHTML += `<button ${page === 1 ? 'disabled' : ''} onclick="changePage('${safeTabKey}', ${page - 1})">قبلی</button>`;
      pagHTML += `<span>صفحه ${page} از ${totalPages}</span>`;
      pagHTML += `<button ${page === totalPages ? 'disabled' : ''} onclick="changePage('${safeTabKey}', ${page + 1})">بعدی</button>`;
      pagHTML += `<span> | نمایش ${dataArray.length} رکورد</span>`;
      paginationDiv.innerHTML = pagHTML;
    }

    function changePage(tabKey, newPage) {
      if (typeof paginationState === 'undefined' || !paginationState[tabKey]) return;

      const totalPages = (() => {
        switch (tabKey) {
          case 'sales': 
            return (typeof salesData !== 'undefined') ? Math.ceil(salesData.length / pageSize) : 1;
          case 'interactions': 
            return (typeof interactionsData !== 'undefined') ? Math.ceil(interactionsData.length / pageSize) : 1;
          case 'inventory': 
            return (typeof inventoryData !== 'undefined') ? Math.ceil(inventoryData.length / pageSize) : 1;
          default: 
            return 1;
        }
      })();
      
      if (typeof clampPage === 'function') {
        const clampedPage = clampPage(newPage, totalPages);
        paginationState[tabKey].page = clampedPage;
      }
      refreshTableForTab(tabKey);
    }

    function refreshTableForTab(tabKey) {
      if (tabKey === 'sales' && typeof salesSchema !== 'undefined' && typeof salesData !== 'undefined') {
        renderTable(salesData, salesSchema, 'salesTableContainer', 'salesPagination', 'sales');
      } else if (tabKey === 'interactions') {
        if (typeof renderEditableInteractionsTable === 'function') {
          renderEditableInteractionsTable();
        }
      } else if (tabKey === 'inventory' && typeof inventorySchema !== 'undefined' && typeof inventoryData !== 'undefined') {
        renderTable(inventoryData, inventorySchema, 'inventoryTableContainer', 'inventoryPagination', 'inventory');
      }
    }


