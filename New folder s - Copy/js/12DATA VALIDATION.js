// 12DATA VALIDATION.js

function validateSalesRules(container, rowIndex) {
  // گرفتن پیشوند نام فیلد بر اساس ایندکس ردیف پویا
  const getFieldName = (baseName) => `row_${rowIndex}_${baseName}`;

  const txnTypeEl = container.querySelector(`[name="${getFieldName('TransactionType')}"]`);
  const txnType = txnTypeEl ? txnTypeEl.value : '';

  if (txnType === 'بازگشت وجه') {
    const relatedTxnIDEl = container.querySelector(`[name="${getFieldName('RelatedTxnID')}"]`);
    const returnReasonEl = container.querySelector(`[name="${getFieldName('ReturnReason')}"]`);
    const baseAmountEl = container.querySelector(`[name="${getFieldName('BaseAmount')}"]`);
    
    const relatedTxnID = relatedTxnIDEl ? relatedTxnIDEl.value.trim() : '';
    const returnReason = returnReasonEl ? returnReasonEl.value.trim() : '';
    const baseAmount = parseFiniteNumber(baseAmountEl ? baseAmountEl.value : '');

    if (!relatedTxnID) {
      alert(`ردیف ${parseInt(rowIndex) + 1}: برای "بازگشت وجه"، فیلد "شناسه تراکنش مرتبط" اجباری است.`);
      if (relatedTxnIDEl) relatedTxnIDEl.focus();
      addLog(`اعتبارسنجی فروش: ردیف ${parseInt(rowIndex) + 1} - برای بازگشت وجه، شناسه تراکنش مرتبط الزامی است.`, 'error');
      return false;
    }

    if (!returnReason) {
      alert(`ردیف ${parseInt(rowIndex) + 1}: برای "بازگشت وجه"، فیلد "علت بازگشت" اجباری است.`);
      if (returnReasonEl) returnReasonEl.focus();
      addLog(`اعتبارسنجی فروش: ردیف ${parseInt(rowIndex) + 1} - برای بازگشت وجه، علت بازگشت الزامی است.`, 'error');
      return false;
    }

    if (baseAmount !== null && baseAmount < 0) {
      alert(`ردیف ${parseInt(rowIndex) + 1}: برای "بازگشت وجه"، "مبلغ پایه" نمی‌تواند منفی باشد.`);
      if (baseAmountEl) baseAmountEl.focus();
      addLog(`اعتبارسنجی فروش: ردیف ${parseInt(rowIndex) + 1} - برای بازگشت وجه، مبلغ پایه نمی‌تواند منفی باشد.`, 'error');
      return false;
    }
  }

  if (txnType === 'تعویض') {
    const relatedTxnIDEl = container.querySelector(`[name="${getFieldName('RelatedTxnID')}"]`);
    const returnProductIDEl = container.querySelector(`[name="${getFieldName('ReturnProductID')}"]`);
    const returnQtyEl = container.querySelector(`[name="${getFieldName('ReturnQty')}"]`);
    const replacementProductIDEl = container.querySelector(`[name="${getFieldName('ReplacementProductID')}"]`);
    const replacementQtyEl = container.querySelector(`[name="${getFieldName('ReplacementQty')}"]`);
    
    const relatedTxnID = relatedTxnIDEl ? relatedTxnIDEl.value.trim() : '';
    const returnProductID = returnProductIDEl ? returnProductIDEl.value.trim() : '';
    const replacementProductID = replacementProductIDEl ? replacementProductIDEl.value.trim() : '';
    const replacementQtyVal = replacementQtyEl ? replacementQtyEl.value.trim() : '';
    const returnQtyVal = returnQtyEl ? returnQtyEl.value.trim() : '';

    if (!relatedTxnID) {
      alert(`ردیف ${parseInt(rowIndex) + 1}: برای "تعویض"، فیلد "شناسه تراکنش مرتبط" اجباری است.`);
      if (relatedTxnIDEl) relatedTxnIDEl.focus();
      return false;
    }

    if (!returnProductID) {
      alert(`ردیف ${parseInt(rowIndex) + 1}: برای "تعویض"، فیلد "کد محصول بازگشتی" اجباری است.`);
      if (returnProductIDEl) returnProductIDEl.focus();
      return false;
    }

    const returnQty = parseFiniteNumber(returnQtyVal);
    if (returnQty === null || returnQty <= 0) {
      alert(`ردیف ${parseInt(rowIndex) + 1}: برای "تعویض"، فیلد "تعداد محصول بازگشتی" باید بزرگ‌تر از ۰ باشد.`);
      if (returnQtyEl) returnQtyEl.focus();
      return false;
    }

    if (!replacementProductID) {
      alert(`ردیف ${parseInt(rowIndex) + 1}: برای "تعویض"، فیلد "کد محصول جایگزین" اجباری است.`);
      if (replacementProductIDEl) replacementProductIDEl.focus();
      return false;
    }

    const replacementQty = parseFiniteNumber(replacementQtyVal);
    if (replacementQty === null || replacementQty <= 0) {
      alert(`ردیف ${parseInt(rowIndex) + 1}: برای "تعویض"، فیلد "تعداد محصول جایگزین" باید بزرگ‌تر از ۰ باشد.`);
      if (replacementQtyEl) replacementQtyEl.focus();
      return false;
    }
  }

  if (txnType === 'اقساط') {
    const installmentCountEl = container.querySelector(`[name="${getFieldName('InstallmentCount')}"]`);
    const installmentCountVal = installmentCountEl ? installmentCountEl.value.trim() : '';
    const installmentCount = parseFiniteNumber(installmentCountVal);

    if (installmentCount === null || installmentCount <= 0) {
      alert(`ردیف ${parseInt(rowIndex) + 1}: برای تراکنش "اقساط"، فیلد "تعداد اقساط" اجباری و باید بزرگ‌تر از ۰ باشد.`);
      if (installmentCountEl) installmentCountEl.focus();
      return false;
    }
  }

  return true;
}

function validateForm(schema, containerId, tabKey) {
  const container = document.getElementById(containerId);
  if (!container) return false;

  // ۱. حالت اعتبارسنجی اختصاصی سیستم فروش چندردیفی
  if (tabKey === 'sales') {
    // الف) اعتبارسنجی فیلدهای هدر ثابت در بالای فرم
    if (typeof salesHeaderSchema !== 'undefined') {
      for (let field of salesHeaderSchema) {
        const input = container.querySelector(`[name="header_${field.name}"]`);
        if (!input) continue;
        const val = input.value.trim();

        if (field.required && !val) {
          alert(`فیلد هدر "${field.label}" اجباری است.`);
          input.focus();
          return false;
        }
      }
    }

    // ب) اعتبارسنجی تک‌تک ردیف‌های کانتینر فروش
    // اصلاح شد: جستجو فقط در کانتینر مخصوص ردیف‌ها
    const lineItemsContainer = document.getElementById('salesLineItemsContainer');
    const rows = lineItemsContainer ? lineItemsContainer.querySelectorAll('.sales-row-item') : [];
    
    if (rows.length === 0) {
      alert('حداقل باید یک ردیف فروش ثبت کنید.');
      return false;
    }

    for (let row of rows) {
      const idx = row.dataset.index;
      
      const salesConstraints = [
        { name: 'Qty', label: 'تعداد', min: 0, allowMin: false, msg: 'باید بزرگ‌تر از ۰ باشد' },
        { name: 'InstallmentCount', label: 'تعداد اقساط', min: 0, allowMin: true, integer: true, msg: 'باید عدد صحیح و بزرگ‌تر یا مساوی ۰ باشد' },
        { name: 'DiscountPercent', label: 'درصد تخفیف', min: 0, max: 100, msg: 'باید بین ۰ تا ۱۰۰ باشد' },
        { name: 'BaseAmount', label: 'مبلغ پایه', min: 0, allowMin: true, msg: 'باید بزرگ‌تر یا مساوی ۰ باشد' },
        { name: 'ReturnQty', label: 'تعداد برگشتی', min: 0, allowMin: false, msg: 'باید بزرگ‌تر از ۰ باشد' },
        { name: 'ReplacementQty', label: 'تعداد جایگزین', min: 0, allowMin: false, msg: 'باید بزرگ‌تر از ۰ باشد' }
      ];

      for (let c of salesConstraints) {
        const input = row.querySelector(`[name="row_${idx}_${c.name}"]`);
        if (!input || !input.value.trim()) continue;

        const num = parseFiniteNumber(input.value);
        if (num === null || !Number.isFinite(num)) continue;

        if (c.integer && !Number.isInteger(num)) {
          alert(`ردیف ${parseInt(idx) + 1}: فیلد "${c.label}" باید عدد صحیح باشد.`);
          input.focus();
          return false;
        }

        if (c.allowMin === false && num <= c.min) {
          alert(`ردیف ${parseInt(idx) + 1}: فیلد "${c.label}" ${c.msg}.`);
          input.focus();
          return false;
        }

        if (c.allowMin !== false && num < c.min) {
          alert(`ردیف ${parseInt(idx) + 1}: فیلد "${c.label}" ${c.msg}.`);
          input.focus();
          return false;
        }

        if (c.max !== undefined && num > c.max) {
          alert(`ردیف ${parseInt(idx) + 1}: فیلد "${c.label}" ${c.msg}.`);
          input.focus();
          return false;
        }
      }

      if (!validateSalesRules(row, idx)) return false;
    }

    return true;
  }

  // ۲. منطق اعتبارسنجی عمومی برای سایر تب‌ها
  for (let field of schema) {
    const input = container.querySelector(`[name="${field.name}"]`);
    if (!input) continue;
    const val = input.value.trim();

    if (field.required && !val) {
      alert(`فیلد "${field.label}" اجباری است.`);
      input.focus();
      if (typeof addLog === 'function') addLog(`اعتبارسنجی ${tabKey}: فیلد "${field.label}" خالی است.`, 'error');
      return false;
    }

    if (val !== '' && field.type === 'number') {
      const num = parseFiniteNumber(val);
      if (num === null || !Number.isFinite(num)) {
        alert(`فیلد "${field.label}" باید عددی باشد.`);
        input.focus();
        return false;
      }
    }
  }

  if (tabKey === 'inventory') {
    const inventoryConstraints = [
      { name: 'BuyPrice', label: 'قیمت خرید', min: 0, msg: 'باید بزرگ‌تر یا مساوی ۰ باشد' },
      { name: 'SellPrice', label: 'قیمت فروش', min: 0, msg: 'باید بزرگ‌تر یا مساوی ۰ باشد' },
      { name: 'MinStock', label: 'حداقل موجودی', min: 0, msg: 'باید بزرگ‌تر یا مساوی ۰ باشد' },
      { name: 'OpeningStock', label: 'موجودی اولیه', min: 0, msg: 'باید بزرگ‌تر یا مساوی ۰ باشد' },
      { name: 'MaxDiscountPercent', label: 'حداکثر درصد تخفیف', min: 0, max: 100, msg: 'باید بین ۰ تا ۱۰۰ باشد' },
      { name: 'ReturnWindowHours', label: 'ساعت بازگشت', min: 0, msg: 'باید بزرگ‌تر یا مساوی ۰ باشد' },
      { name: 'DefectiveQty', label: 'تعداد معیوب', min: 0, msg: 'باید بزرگ‌تر یا مساوی ۰ باشد' }
    ];

    for (let c of inventoryConstraints) {
      const input = container.querySelector(`[name="${c.name}"]`);
      if (!input || !input.value.trim()) continue;

      const num = parseFiniteNumber(input.value);
      if (num === null || !Number.isFinite(num)) continue;

      if (num < c.min) {
        alert(`فیلد "${c.label}" ${c.msg}.`);
        input.focus();
        return false;
      }

      if (c.max !== undefined && num > c.max) {
        alert(`فیلد "${c.label}" ${c.msg}.`);
        input.focus();
        return false;
      }
    }

    const defectiveQtyEl = container.querySelector('[name="DefectiveQty"]');
    const openingStockEl = container.querySelector('[name="OpeningStock"]');

    if (defectiveQtyEl && openingStockEl && defectiveQtyEl.value.trim() && openingStockEl.value.trim()) {
      const defectiveQty = parseFiniteNumber(defectiveQtyEl.value);
      const openingStock = parseFiniteNumber(openingStockEl.value);

      if (defectiveQty !== null && openingStock !== null && defectiveQty > openingStock) {
        alert('فیلد "تعداد معیوب" نمی‌تواند از "موجودی اولیه" بیشتر باشد.');
        defectiveQtyEl.focus();
        return false;
      }
    }
  }

  return true;
}

function normalizeCellValue(fieldName, value, schema) {
  const field = schema.find(f => f.name === fieldName);
  if (!field) return value;

  if (field.type === 'number') {
    if (String(value).trim() === '') return '';
    const number = parseFiniteNumber(value);
    return Number.isNaN(number) ? value : number;
  }

  return value;
}
