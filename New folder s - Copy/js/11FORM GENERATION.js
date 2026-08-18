//11
function generateFormFields(schema, containerId) {
      const container = document.getElementById(containerId);
      if (!container) {
        addLog(`Container با id ${containerId} پیدا نشد`, 'error');
        return;
      }
      
      container.innerHTML = '';
      
      schema.forEach(field => {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        group.appendChild(label);

        let input;
        if (field.type === 'select') {
          input = document.createElement('select');
          field.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt || '--';
            input.appendChild(option);
          });
        } else if (field.type === 'textarea') {
          input = document.createElement('textarea');
          input.rows = 2;
        } else {
          input = document.createElement('input');
          input.type = field.type;
          if (field.type === 'number') input.step = 'any';
        }
        
        input.name = field.name;
        if (field.auto) {
          input.setAttribute('data-auto', field.auto);
          input.readOnly = true;
        }
        if (field.required) {
          input.required = true;
        }
        
        group.appendChild(input);
        container.appendChild(group);
      });
    }

    function fillAutoFields(schema, containerId, rowData = null) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const now = new Date();
      
      schema.forEach(field => {
        if (field.auto) {
          const input = container.querySelector(`[name="${field.name}"]`);
          if (!input) return;
          
          if (rowData && rowData[field.name] !== undefined) {
            input.value = rowData[field.name];
            return;
          }
          
          switch (field.auto) {
            case 'uuid':
              input.value = generateUUID();
              break;
            case 'iso':
              input.value = now.toISOString();
              break;
            case 'txnid':
              input.value = generateTxnID();
              break;
            case 'date':
              input.value = formatLocalDate(now);
              break;
            case 'time':
              input.value = formatLocalTime(now);
              break;
          }
        }
      });
    }

    function getFormData(schema, containerId) {
      const container = document.getElementById(containerId);
      const data = {};
      
      if (!container) {
        schema.forEach(field => { data[field.name] = ''; });
        return data;
      }
      
      schema.forEach(field => {
        const input = container.querySelector(`[name="${field.name}"]`);
        data[field.name] = input ? input.value : '';
      });
      
      return data;
    }

    function clearForm(schema, containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      schema.forEach(field => {
        const input = container.querySelector(`[name="${field.name}"]`);
        if (!input) return;
        
        if (field.auto) {
          switch (field.auto) {
            case 'uuid':
              input.value = generateUUID();
              break;
            case 'iso':
              input.value = new Date().toISOString();
              break;
            case 'txnid':
              input.value = generateTxnID();
              break;
            case 'date':
              input.value = formatLocalDate();
              break;
            case 'time':
              input.value = formatLocalTime();
              break;
          }
        } else {
          input.value = '';
        }
      });

      if (containerId === 'inventoryFormGrid') {
        resetInventoryPricingState();
      }
    }

const inventoryPricingState = {
  manualSellPrice: false
};

function parseInventoryNumber(value) {
  const n = parseFloat(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function getInventoryField(fieldName) {
  return document.querySelector(`#inventoryFormGrid [name="${fieldName}"]`);
}

function syncInventorySellPrice() {
  const buyPriceEl = getInventoryField('BuyPrice');
  const profitPercentEl = getInventoryField('ProfitPercent'); // اصلاح نام ارجاع
  const sellPriceEl = getInventoryField('SellPrice');

  if (!buyPriceEl || !profitPercentEl || !sellPriceEl) return;
  if (inventoryPricingState.manualSellPrice) return;

  const buyValue = buyPriceEl.value.trim();
  const profitPercentValue = profitPercentEl.value.trim();

  if (buyValue === '' || profitPercentValue === '') {
    sellPriceEl.value = '';
    return;
  }

  const buyPrice = parseInventoryNumber(buyValue);
  const profitPercent = parseInventoryNumber(profitPercentValue);

  // فرمول درخواستی: قیمت خرید + درصد سود از قیمت خرید
  const computedSellPrice = buyPrice + (buyPrice * profitPercent / 100);
  sellPriceEl.value = String(computedSellPrice);
}

function bindInventoryPricing() {
  const buyPriceEl = getInventoryField('BuyPrice');
  const profitPercentEl = getInventoryField('ProfitPercent'); // اصلاح نام ارجاع
  const sellPriceEl = getInventoryField('SellPrice');

  if (!buyPriceEl || !profitPercentEl || !sellPriceEl) return;

  if (!buyPriceEl.dataset.inventoryPricingBound) {
    buyPriceEl.dataset.inventoryPricingBound = '1';
    buyPriceEl.addEventListener('input', syncInventorySellPrice);
    buyPriceEl.addEventListener('change', syncInventorySellPrice);
  }

  if (!profitPercentEl.dataset.inventoryPricingBound) {
    profitPercentEl.dataset.inventoryPricingBound = '1';
    profitPercentEl.addEventListener('input', syncInventorySellPrice);
    profitPercentEl.addEventListener('change', syncInventorySellPrice);
  }

  if (!sellPriceEl.dataset.inventoryPricingBound) {
    sellPriceEl.dataset.inventoryPricingBound = '1';
    sellPriceEl.addEventListener('input', () => {
      inventoryPricingState.manualSellPrice = true;
    });
    sellPriceEl.addEventListener('change', () => {
      inventoryPricingState.manualSellPrice = true;
    });
  }

  syncInventorySellPrice();
}

function resetInventoryPricingState() {
  inventoryPricingState.manualSellPrice = false;
  syncInventorySellPrice();
}

/* ==========================================
   بخش مدیریت فرم فروش چندردیفی و محاسبات مالی
   ========================================== */

// تابع کمکی برای پیدا کردن ردیف والد یک عنصر DOM
function getSalesRowParent(element) {
  return element.closest('.sales-row-item');
}

function getSalesRowField(row, fieldName) {
  if (!row || !fieldName) return null;
  const selectors = [
    `[name="row_${row.dataset.index || 0}_${fieldName}"]`,
    `[name="${fieldName}"]`,
    `[data-field-name="${fieldName}"]`
  ];
  for (const selector of selectors) {
    const el = row.querySelector(selector);
    if (el) return el;
  }
  return null;
}

// تابع تغییر و نمایش داینامیک فیلدهای ردیف فروش بر اساس نوع تراکنش
function handleSalesRowTypeChange(selectElement) {
  const row = getSalesRowParent(selectElement);
  if (!row) return;

  const txnType = selectElement.value;

  const allFieldNames = [
    'TransactionType', 'ProductID', 'Qty', 'DiscountPercent', 'BaseAmount',
    'RelatedTxnID', 'ReturnProductID', 'ReturnQty', 'ReplacementProductID',
    'ReplacementQty', 'ReturnReason', 'InstallmentCount'
  ];

  const setVisible = (el, isVisible) => {
    if (!el) return;
    const parentGroup = el.closest('.form-group');
    if (parentGroup) {
      parentGroup.style.display = isVisible ? 'block' : 'none';
    }
  };

  allFieldNames.forEach(fieldName => {
    const el = getSalesRowField(row, fieldName);
    setVisible(el, false);
  });

  // نمایش فیلدهای ضروری حسب نوع تراکنش
  if (txnType === 'خرید') {
    ['TransactionType', 'ProductID', 'Qty', 'DiscountPercent', 'BaseAmount'].forEach(name => setVisible(getSalesRowField(row, name), true));
  } else if (txnType === 'بازگشت وجه') {
    ['TransactionType', 'ProductID', 'Qty', 'BaseAmount', 'RelatedTxnID', 'ReturnReason'].forEach(name => setVisible(getSalesRowField(row, name), true));
  } else if (txnType === 'تعویض') {
    ['TransactionType', 'RelatedTxnID', 'ReturnProductID', 'ReturnQty', 'ReplacementProductID', 'ReplacementQty', 'ReturnReason'].forEach(name => setVisible(getSalesRowField(row, name), true));
  } else if (txnType === 'اقساط') {
    ['TransactionType', 'ProductID', 'Qty', 'DiscountPercent', 'BaseAmount', 'InstallmentCount'].forEach(name => setVisible(getSalesRowField(row, name), true));
  }

  // اگر نوع تراکنش نامشخص بود، فقط فیلدهای عمومی را نمایش بده
  if (!['خرید', 'بازگشت وجه', 'تعویض', 'اقساط'].includes(txnType)) {
    ['TransactionType', 'ProductID', 'Qty', 'DiscountPercent', 'BaseAmount'].forEach(name => setVisible(getSalesRowField(row, name), true));
  }

  calculateSalesTotal();
}

// تابع افزودن ردیف جدید به بدنه فرم فروش
/* =========================================================
   تابع addSalesRow (نسخه سینک‌شده و حرفه‌ای)
   محل قرارگیری: فایل x6 (جایگزین تعریف قبلی)
   ========================================================= */
function addSalesRow() {
  const container = document.getElementById('salesLineItemsContainer');
  if (!container || typeof salesLineItemSchema === 'undefined') {
    console.error("خطا: کانتینر یا اسکیما برای افزودن ردیف موجود نیست.");
    return;
  }

  const rowDiv = document.createElement('div');
  rowDiv.className = 'sales-row-item';
  // چیدمان گرید برای زیبایی و خوانایی
  rowDiv.style = "display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; position: relative; background: #fff;";

  // تعیین ایندکس ردیف (برای نام‌گذاری scope‌شده)
  const currentIndex = container.querySelectorAll('.sales-row-item').length;
  rowDiv.dataset.index = String(currentIndex);

  // فهرست فیلدهای مورد انتظار که باید حتماً وجود داشته باشند
  const requiredFieldNames = [
    'TransactionType', 'ProductID', 'Qty', 'DiscountPercent', 'BaseAmount',
    'RelatedTxnID', 'ReturnProductID', 'ReturnQty', 'ReplacementProductID',
    'ReplacementQty', 'ReturnReason', 'InstallmentCount'
  ];

  // نقشهٔ پیش‌فرض برای فیلدهایی که ممکن است در اسکیما وجود نداشته باشند
  const fallbackFieldMap = {
    TransactionType: { name: 'TransactionType', label: 'نوع تراکنش', type: 'select', options: ['خرید', 'بازگشت وجه', 'تعویض', 'اقساط'] },
    ProductID: { name: 'ProductID', label: 'کد کالا', type: 'text' },
    Qty: { name: 'Qty', label: 'تعداد', type: 'number' },
    DiscountPercent: { name: 'DiscountPercent', label: 'درصد تخفیف', type: 'number' },
    BaseAmount: { name: 'BaseAmount', label: 'قیمت پایه', type: 'number' },
    RelatedTxnID: { name: 'RelatedTxnID', label: 'شناسه تراکنش مرتبط', type: 'text' },
    ReturnProductID: { name: 'ReturnProductID', label: 'کد کالای برگشتی', type: 'text' },
    ReturnQty: { name: 'ReturnQty', label: 'تعداد برگشتی', type: 'number' },
    ReplacementProductID: { name: 'ReplacementProductID', label: 'کد کالای جایگزین', type: 'text' },
    ReplacementQty: { name: 'ReplacementQty', label: 'تعداد جایگزین', type: 'number' },
    ReturnReason: { name: 'ReturnReason', label: 'علت بازگشت', type: 'textarea' },
    InstallmentCount: { name: 'InstallmentCount', label: 'تعداد اقساط', type: 'number' }
  };

  // تولید ساختار درونی ردیف بر اساس salesLineItemSchema اما با پوشش فیلدهای ضروری
  requiredFieldNames.forEach(fieldName => {
    // تلاش برای پیدا کردن تعریف فیلد در اسکیما
    let field = salesLineItemSchema.find(f => f.name === fieldName);
    if (!field) {
      // استفاده از فیلد پیش‌فرض در صورت نبود
      field = fallbackFieldMap[fieldName] || { name: fieldName, label: fieldName, type: 'text' };
    }

    const group = document.createElement('div');
    group.className = 'form-group';
    group.style.display = 'block';

    const label = document.createElement('label');
    label.textContent = field.label || field.name;
    label.style.display = 'block';
    label.style.fontSize = '0.9em';
    label.style.marginBottom = '5px';
    group.appendChild(label);

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      (field.options || []).forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt || '--';
        input.appendChild(option);
      });
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 1;
    } else {
      input = document.createElement('input');
      input.type = field.type || 'text';
      if (input.type === 'number') input.step = 'any';
    }

    // نگهداری نام پایهٔ فیلد و ساخت شناسه/نام scope‌شده برای سازگاری با سرچ‌های مختلف
    input.name = field.name; // حفظ نام ساده برای سازگاری با کدهای موجود
    input.dataset.fieldName = field.name;
    input.setAttribute('data-row-name', `row_${currentIndex}_${field.name}`);
    input.id = `row_${currentIndex}_${field.name}`;
    input.className = 'form-control';
    input.style.width = '100%';
    if (field.required) input.required = true;

    group.appendChild(input);
    rowDiv.appendChild(group);
  });

  // افزودن دکمه‌ی حذف برای هر ردیف
  const actionDiv = document.createElement('div');
  actionDiv.style.alignSelf = 'end';
  
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn-delete-row';
  deleteBtn.textContent = 'حذف';
  deleteBtn.style = 'background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%;';
  
  deleteBtn.onclick = function() {
    // جلوگیری از حذف آخرین ردیف (اختیاری)
    if (container.querySelectorAll('.sales-row-item').length > 1) {
      rowDiv.remove();
      // مرتب‌سازی شاخص ردیف‌ها پس از حذف تا نام‌های scope‌شده معتبر بمانند
      container.querySelectorAll('.sales-row-item').forEach((r, i) => {
        r.dataset.index = String(i);
        r.querySelectorAll('[data-field-name]').forEach(el => {
          const base = el.dataset.fieldName;
          el.id = `row_${i}_${base}`;
          el.setAttribute('data-row-name', `row_${i}_${base}`);
        });
      });

      calculateSalesTotal();
    } else {
      alert("حداقل یک ردیف باید در تراکنش وجود داشته باشد.");
    }
  };
  
  actionDiv.appendChild(deleteBtn);
  rowDiv.appendChild(actionDiv);

  container.appendChild(rowDiv);

  // --- اتصال رویدادها (Sync) ---

  // ۱. رویداد تغییر نوع تراکنش (اگر تابع handleSalesRowTypeChange وجود دارد)
  const typeSelect = rowDiv.querySelector('[name="TransactionType"], [data-field-name="TransactionType"]');
  if (typeSelect && typeof handleSalesRowTypeChange === 'function') {
    typeSelect.addEventListener('change', function() {
      handleSalesRowTypeChange(this);
    });
    handleSalesRowTypeChange(typeSelect);
  }

  // ۲. رویدادهای محاسبه (Input/Change)
  rowDiv.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', calculateSalesTotal);
    input.addEventListener('change', () => {
      calculateSalesTotal();
      if (input.name === 'TransactionType' && typeof handleSalesRowTypeChange === 'function') {
        handleSalesRowTypeChange(input);
      }
    });
  });

  // ۳. اتصال به منطق اتوفیل محصول (اگر تابع handleProductIDAutoFill وجود دارد)
  const productInput = rowDiv.querySelector('[name="ProductID"]');
  if (productInput && typeof handleProductIDAutoFill === 'function') {
    productInput.addEventListener('change', function() {
      handleProductIDAutoFill(this);
    });
  }
}


// تابع اتصال و واکشی قیمت خرید و فروش از بانک انبار
function handleProductIDAutoFill(productInputEl) {
  const row = getSalesRowParent(productInputEl);
  if (!row) return;

  const productID = productInputEl.value.trim();
  if (!productID) return;

  // اگر تابع جستجوی محصول در انبار در اسکریپت اصلی وجود دارد (مانند استفاده از map یا آرایه)
  let foundProduct = null;
  if (typeof inventoryProductMap !== 'undefined' && inventoryProductMap.has(productID)) {
    foundProduct = inventoryProductMap.get(productID);
  } else if (typeof inventoryData !== 'undefined') {
    foundProduct = inventoryData.find(item => item.ProductID === productID);
  }

  if (foundProduct) {
    const baseAmountEl = row.querySelector('[name="BaseAmount"]');
    const sellPrice = parseFloat(foundProduct.SellPrice || 0);
    if (baseAmountEl && sellPrice) {
      baseAmountEl.value = sellPrice;
      calculateSalesTotal();
    }
  }
}

// محاسبات نهایی کل ردیف‌ها و چاپ مبالغ در سلول‌های مربوطه
function calculateSalesTotal() {
  const rows = document.querySelectorAll('#salesLineItemsContainer .sales-row-item');
  let totalRefund = 0;
  let totalNetProfit = 0;

  rows.forEach(row => {
    const txnType = row.querySelector('[name="TransactionType"]')?.value || 'خرید';
    
    // واکشی فیلدهای عددی و تبدیل مقادیر
    const qty = parseFloat(row.querySelector('[name="Qty"]')?.value || 0);
    const discountPercent = parseFloat(row.querySelector('[name="DiscountPercent"]')?.value || 0);
    const baseAmount = parseFloat(row.querySelector('[name="BaseAmount"]')?.value || 0);
    
    const returnQty = parseFloat(row.querySelector('[name="ReturnQty"]')?.value || 0);
    const replacementQty = parseFloat(row.querySelector('[name="ReplacementQty"]')?.value || 0);
    const productID = row.querySelector('[name="ProductID"]')?.value || '';
    const returnProductID = row.querySelector('[name="ReturnProductID"]')?.value || '';
    const replacementProductID = row.querySelector('[name="ReplacementProductID"]')?.value || '';

    // یافتن قیمت خرید محصولات جهت محاسبه سود نهایی
    let buyPrice = 0;
    let replacementBuyPrice = 0;

    if (typeof inventoryData !== 'undefined') {
      const prod = inventoryData.find(p => p.ProductID === productID);
      if (prod) buyPrice = parseFloat(prod.BuyPrice || 0);

      const retProd = inventoryData.find(p => p.ProductID === returnProductID);
      if (retProd) buyPrice = parseFloat(retProd.BuyPrice || 0); // قیمت خرید کالای برگشتی

      const repProd = inventoryData.find(p => p.ProductID === replacementProductID);
      if (repProd) replacementBuyPrice = parseFloat(repProd.BuyPrice || 0);
    }

    if (txnType === 'خرید' || txnType === 'اقساط') {
      const lineFinalAmount = baseAmount * qty * (1 - discountPercent / 100);
      const lineProfit = lineFinalAmount - (buyPrice * qty);
      totalNetProfit += lineProfit;

    } else if (txnType === 'بازگشت وجه') {
      // بازگشت وجه از ما کسر شده و سود نهایی را منفی می‌کند
      const lineFinalAmount = baseAmount * qty;
      totalRefund += lineFinalAmount;
      // سود این تراکنش منفیِ هزینه بازگردانده شده منهای قیمت خرید (که دوباره به انبار برگشته) است
      totalNetProfit -= (lineFinalAmount - (buyPrice * qty));

    } else if (txnType === 'تعویض') {
      // پیدا کردن مشخصات کالاها برای محاسبه تفاوت ارزش تعویض
      let returnProductSellPrice = 0;
      let replacementProductSellPrice = 0;

      if (typeof inventoryData !== 'undefined') {
        const retProd = inventoryData.find(p => p.ProductID === returnProductID);
        if (retProd) returnProductSellPrice = parseFloat(retProd.SellPrice || 0);

        const repProd = inventoryData.find(p => p.ProductID === replacementProductID);
        if (repProd) replacementProductSellPrice = parseFloat(repProd.SellPrice || 0);
      }

      const totalReturnWorth = returnProductSellPrice * returnQty;
      const totalReplacementWorth = replacementProductSellPrice * replacementQty;
      const diff = totalReplacementWorth - totalReturnWorth;

      if (diff < 0) {
        // اگر ارزش کالای برگشتی بیشتر باشد، مابه‌التفاوت باید به مشتری پرداخت شود (کسر از ما)
        totalRefund += Math.abs(diff);
      } else {
        // اگر ارزش کالای جدید بیشتر باشد، ما سود می‌گیریم
        totalNetProfit += diff;
      }
      
      // محاسبه تأثیر سود واقعی انبار در تعویض: (خروج کالای جایگزین - ورود کالای برگشتی)
      const costDiff = (replacementBuyPrice * replacementQty) - (buyPrice * returnQty);
      totalNetProfit -= costDiff;
    }
  });

  // ثبت و چاپ مقادیر نهایی در بخش محاسبات پایین فرم
  const totalRefundEl = document.getElementById('totalRefundAmount');
  const netProfitEl = document.getElementById('netProfitAmount');

  if (totalRefundEl) totalRefundEl.value = totalRefund;
  if (netProfitEl) netProfitEl.value = totalNetProfit;
}

// تابع یکپارچه‌ساز و استخراج داده‌های کل فرم فروش (هدر + تمام ردیف‌ها) جهت ذخیره در CSV
function getSalesDataList() {
  const headerGrid = document.getElementById('salesHeaderGrid');
  const headerData = getFormData(salesHeaderSchema, 'salesHeaderGrid') || {};
  const rows = document.querySelectorAll('#salesLineItemsContainer .sales-row-item');
  const records = [];

  const totalRefund = parseFloat(document.getElementById('totalRefundAmount')?.value || 0);
  const netProfit = parseFloat(document.getElementById('netProfitAmount')?.value || 0);

  const readHeaderValue = (fieldName) => {
    const el = headerGrid?.querySelector(
      `[name="${fieldName}"], [name="header_${fieldName}"], #${fieldName}, #header_${fieldName}`
    );
    return el ? el.value.trim() : '';
  };

  // تطبیق صریح تاریخ و زمان
  headerData.Date = readHeaderValue('Date') || headerData.Date || '';
  headerData.Time = readHeaderValue('Time') || headerData.Time || '';

  // uid هدر را حذف می‌کنیم تا به همه ردیف‌ها سرایت نکند
  delete headerData.uid;

  if (rows.length === 0) {
    const emptyRow = {};
    salesLineItemSchema.forEach(f => { emptyRow[f.name] = ''; });

    records.push({
      ...headerData,
      ...emptyRow,
      uid: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
      ExchangeAmount: totalRefund,
      NetProfit: netProfit,
      FinalAmount: 0
    });

    return records;
  }

  rows.forEach(row => {
    const rowData = {};
    salesLineItemSchema.forEach(field => {
      if (['FinalAmount', 'ExchangeAmount', 'NetProfit', 'uid'].includes(field.name)) return;
      const input = row.querySelector(`[name="${field.name}"], [name="row_${row.dataset.index}_${field.name}"]`);
      rowData[field.name] = input ? input.value.trim() : '';
    });

    let finalAmount = 0;
    const qty = parseFloat(rowData.Qty || 0);
    const base = parseFloat(rowData.BaseAmount || 0);
    const disc = parseFloat(rowData.DiscountPercent || 0);

    if (rowData.TransactionType === 'خرید' || rowData.TransactionType === 'اقساط') {
      finalAmount = base * qty * (1 - disc / 100);
    }

    records.push({
      ...headerData,
      ...rowData,
      uid: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
      FinalAmount: finalAmount,
      ExchangeAmount: totalRefund,
      NetProfit: netProfit
    });
  });

  return records;
}


// تابع اختصاصی پاکسازی کامل فرم چندردیفی فروش
function clearMultiRowSalesForm() {
  clearForm(salesHeaderSchema, 'salesHeaderGrid');
  const container = document.getElementById('salesLineItemsContainer');
  if (container) container.innerHTML = '';
  
  const totalRefundEl = document.getElementById('totalRefundAmount');
  const netProfitEl = document.getElementById('netProfitAmount');
  if (totalRefundEl) totalRefundEl.value = '0';
  if (netProfitEl) netProfitEl.value = '0';
  
  // افزودن یک ردیف پیش‌فرض جهت سهولت کاربری
  addSalesRow();
}
