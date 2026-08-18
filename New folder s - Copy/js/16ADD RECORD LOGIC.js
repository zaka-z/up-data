//16
async function addRecord(schema, dataArray, fileHandleRef, tabKey) {
  try {
    // =========================================================
    // بخش اول: مدیریت تراکنش‌های فروش (Multi-row)
    // =========================================================
    if (tabKey === 'sales') {
      // ۱. اعتبارسنجی هدر
      if (typeof salesHeaderSchema === 'undefined') {
        addLog('خطا: salesHeaderSchema یافت نشد.', 'error');
        return;
      }
      if (!validateForm(salesHeaderSchema, 'salesHeaderGrid', 'sales')) return;

      // ۲. اعتبارسنجی ردیف‌های عملیاتی فروش
      const rows = document.querySelectorAll('#salesLineItemsContainer .sales-row-item');
      if (rows.length === 0) {
        addLog('لطفاً حداقل یک ردیف تراکنش فروش اضافه کنید.', 'error');
        return;
      }

      let isRowsValid = true;
      rows.forEach(row => {
        const inputs = row.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
          const parentGroup = input.closest('.form-group');
          const isHidden = parentGroup && parentGroup.style.display === 'none';
          if (!isHidden && !input.value.trim()) {
            input.style.border = '2px solid red';
            isRowsValid = false;
          } else {
            input.style.border = '';
          }
        });
      });

      if (!isRowsValid) {
        addLog('لطفاً فیلدهای اجباری ردیف‌های فروش را پر کنید.', 'error');
        return;
      }

      // ۳. ثبت زمان و شناسه تراکنش (Snapshot) در فرم قبل از استخراج
      const now = new Date();
      const txnSnapshot = {
        RecordedAtISO: now.toISOString(),
        TxnID: (typeof generateTxnID === 'function') ? generateTxnID() : `TXN-${Date.now()}`,
        Date: (typeof formatLocalDate === 'function') ? formatLocalDate(now) : now.toLocaleDateString('fa-IR'),
        Time: (typeof formatLocalTime === 'function') ? formatLocalTime(now) : now.toLocaleTimeString('fa-IR')
      };

      // تزریق داده‌های سیستمی به فیلدهای هدر جهت خواندن توسط getSalesDataList
      if (typeof syncSalesHeaderSnapshot === 'function') {
        syncSalesHeaderSnapshot(txnSnapshot);
      } else {
        ['RecordedAtISO', 'TxnID', 'Date', 'Time'].forEach(key => {
          const el = document.querySelector(`#salesHeaderGrid [name="${key}"]`) || 
                     document.getElementById(`header_${key}`);
          if (el) el.value = txnSnapshot[key];
        });
      }

      // ۴. استخراج داده‌ها (خروجی آرایه‌ای از ردیف‌ها با هدر مشترک)
      const newRecords = getSalesDataList(); 
      if (!Array.isArray(newRecords) || newRecords.length === 0) {
        addLog('خطا در استخراج ردیف‌های فروش.', 'error');
        return;
      }

      // ۵. ثبت در حافظه و فایل
      newRecords.forEach(record => dataArray.push(record));
      markDirty(tabKey);
      addLog(`${newRecords.length} ردیف فروش با شناسه ${txnSnapshot.TxnID} ثبت شد.`, 'info');

      refreshTableForTab(tabKey);
      await saveCSVToFile(dataArray, schema, fileHandleRef, tabKey);

      // ۶. پاکسازی فرم اختصاصی فروش
      if (typeof clearMultiRowSalesForm === 'function') {
        clearMultiRowSalesForm();
      } else {
        clearForm(salesHeaderSchema, 'salesHeaderGrid');
        const container = document.getElementById('salesLineItemsContainer');
        if (container) container.innerHTML = '';
        if (typeof addSalesRow === 'function') addSalesRow();
      }

      return newRecords;
    }

    // =========================================================
    // بخش دوم: مدیریت سایر تب‌ها (Single-row مثل Inventory)
    // =========================================================
    const containerId = (tabKey === 'inventory') ? 'inventoryFormGrid' : null;
    if (!containerId) {
      addLog(`کانتینر فرم برای تب "${tabKey}" تعریف نشده است.`, 'error');
      return;
    }

    if (!validateForm(schema, containerId, tabKey)) return;

    const newRecord = getFormData(schema, containerId);
    dataArray.push(newRecord);
    markDirty(tabKey);
    addLog(`رکورد جدید در ${tabNames[tabKey] || tabKey} ثبت شد.`, 'info');

    refreshTableForTab(tabKey);
    await saveCSVToFile(dataArray, schema, fileHandleRef, tabKey);
    clearForm(schema, containerId);

    if (tabKey === 'inventory' && typeof onInventoryDatabaseUpdated === 'function') {
      onInventoryDatabaseUpdated();
    }

    return newRecord;

  } catch (error) {
    console.error('AddRecord Error:', error);
    addLog(`خطا در ثبت: ${error.message || error}`, 'error');
  }
}



/* =========================================================
   اصلاح و الحاق منطق جمع‌آوری فیلدهای محاسباتی فوتر فروش
   ========================================================= */

// این بخش باید درون منطق تابع ثبت تراکنش (addRecord / getSalesDataList) قرار گیرد
function getSalesDataList(txnSnapshot = {}) {
  const rows = document.querySelectorAll('#salesLineItemsContainer .sales-row-item');
  const records = [];

  const totalRefund = parseFloat(document.getElementById('totalRefundAmount')?.value || 0);
  const netProfit = parseFloat(document.getElementById('netProfitAmount')?.value || 0);

  // ---------------------------------------------------------
  // هدر فروش: اولویت با snapshot، سپس DOM
  // ---------------------------------------------------------
  const headerData = {};

  if (typeof salesHeaderSchema === 'undefined' || !Array.isArray(salesHeaderSchema)) {
    console.error('salesHeaderSchema تعریف نشده یا نامعتبر است.');
    return records;
  }

  salesHeaderSchema.forEach(field => {
    if (txnSnapshot && txnSnapshot[field.name] !== undefined && txnSnapshot[field.name] !== null) {
      headerData[field.name] = String(txnSnapshot[field.name]).trim();
      return;
    }

    const input =
      document.querySelector(`#salesHeaderGrid [name="${field.name}"]`) ||
      document.getElementById(`header_${field.name}`);

    headerData[field.name] = input ? String(input.value || '').trim() : '';
  });

  // uid هدر نباید با uid ردیف قاطی شود
  delete headerData.uid;

  // ---------------------------------------------------------
  // اگر ردیف وجود نداشت، یک رکورد خالی نسازیم مگر اینکه منطق پروژه بخواهد
  // ---------------------------------------------------------
  if (!rows.length) {
    return records;
  }

  // ---------------------------------------------------------
  // استخراج هر ردیف
  // ---------------------------------------------------------
  rows.forEach((row, index) => {
    if (!row.dataset.index) {
      row.dataset.index = String(index + 1);
    }

    // uid پایدار ردیف
    if (!row.dataset.uid) {
      row.dataset.uid = generateUUID();
    }

    const rowUid = row.dataset.uid;
    const idx = row.dataset.index;
    const rowData = {};

    if (typeof salesLineItemSchema === 'undefined' || !Array.isArray(salesLineItemSchema)) {
      console.error('salesLineItemSchema تعریف نشده یا نامعتبر است.');
      return;
    }

    salesLineItemSchema.forEach(field => {
      // این فیلدها از snapshot یا محاسبه می‌آیند
      if (['uid', 'FinalAmount', 'ExchangeAmount', 'NetProfit', 'RecordedAtISO', 'TxnID', 'Date', 'Time'].includes(field.name)) {
        return;
      }

      const input =
        row.querySelector(`[name="row_${idx}_${field.name}"]`) ||
        row.querySelector(`[name="${field.name}"]`);

      rowData[field.name] = input ? String(input.value || '').trim() : '';
    });

    // مقدارهای تراکنش مشترک
    const qty = parseFloat(rowData.Qty || 0);
    const base = parseFloat(rowData.BaseAmount || 0);
    const disc = parseFloat(rowData.DiscountPercent || 0);

    let finalAmount = 0;
    const txnType = rowData.TransactionType;

    if (txnType === 'خرید' || txnType === 'اقساط') {
      finalAmount = base * qty * (1 - disc / 100);
    }

    records.push({
      ...headerData,
      ...rowData,
      uid: rowUid,
      RecordedAtISO: txnSnapshot.RecordedAtISO || headerData.RecordedAtISO || '',
      TxnID: txnSnapshot.TxnID || headerData.TxnID || '',
      Date: txnSnapshot.Date || headerData.Date || '',
      Time: txnSnapshot.Time || headerData.Time || '',
      FinalAmount: finalAmount,
      ExchangeAmount: totalRefund,
      NetProfit: netProfit
    });
  });

  return records;
}

function syncSalesHeaderSnapshot(txnSnapshot = {}) {
  const fields = ['RecordedAtISO', 'TxnID', 'Date', 'Time'];

  fields.forEach(fieldName => {
    const input =
      document.querySelector(`#salesHeaderGrid [name="${fieldName}"]`) ||
      document.getElementById(`header_${fieldName}`);

    if (input && txnSnapshot[fieldName] !== undefined) {
      input.value = txnSnapshot[fieldName];
    }
  });
}







    