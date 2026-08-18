/* =========================================================
   سیستم مدیریت فروش و انبار — نسخهٔ اصلاح‌شده (رفع خطا + بهبود عملکرد)
   ترکیب فایل‌های x7 (ارکستراسیون) و x8 (فروش چندردیفی)
   ========================================================= */

/* =========================================================
   //18 — راه‌اندازی تب‌ها
   ========================================================= */
function setupTabSwitching() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const target = document.getElementById(`tab-${tabName}`);
      if (target) target.classList.add('active');
    });
  });
}

/* =========================================================
   اتصال راهنما و اتوفیل (رویداد-نمایندگی — برای همهٔ ردیف‌ها)
   این نسخه جایگزین اتصالِ فقط «اولین ردیف» شده است.
   ========================================================= */
function bindSalesRowDelegation(container) {
  if (!container || container.dataset.bindSalesInit === '1') return; // جلوگیری از اتصال دوباره
  container.dataset.bindSalesInit = '1';

  container.addEventListener('input', handleSalesRowInput);
  container.addEventListener('change', calculateSalesTotal);
}

function handleSalesRowInput(e) {
  const t = e.target;
  if (t && t.matches && t.matches('[name="ProductID"]')) {
    if (typeof updateSalesProductHelper === 'function') updateSalesProductHelper(t.value);
    if (typeof updateSalesStockEffectHelper === 'function') updateSalesStockEffectHelper(t.value);
    if (typeof handleProductIDAutoFill === 'function') handleProductIDAutoFill(t);
  }
  calculateSalesTotal();
}

function setupSalesProductHelper() {
  // در ساختار جدید چندردیفی فیلدها داخل salesLineItemsContainer هستند.
  // اتصال به صورت نمایندگی روی کل کانتینر انجام می‌شود (بدون خطای null).
  const container = document.getElementById('salesLineItemsContainer') ||
                    document.getElementById('salesFormGrid');
  if (container) bindSalesRowDelegation(container);
}

/* =========================================================
   //18 — راه‌اندازی کلی برنامه
   نسخهٔ فروش تک‌ردیفی از init حذف شد؛ ساخت آن بر عهدهٔ
   initializeSalesHeader + setupMultiRowSales است (یک‌بار، هماهنگ).
   ========================================================= */
/* =========================================================
   //18 - تابع راه‌اندازی (Initialization) سینک شده و ایمن
   ========================================================= */
function init() {
  try {
    console.log("در حال اجرای راه‌اندازی برنامه...");

    if (typeof generateFormFields === 'function' && typeof inventorySchema !== 'undefined') {
      const invGrid = document.getElementById('inventoryFormGrid');
      if (invGrid) {
        generateFormFields(inventorySchema, 'inventoryFormGrid');
        fillAutoFields(inventorySchema, 'inventoryFormGrid');
      }
    }

    if (typeof setupMultiRowSales === 'function') {
      setupMultiRowSales();
    }

    if (typeof bindInventoryPricing === 'function') bindInventoryPricing();
    if (typeof setupTabSwitching === 'function') setupTabSwitching();

    const btnMap = [
      { id: 'clearCacheBtn', action: typeof clearCache === 'function' ? clearCache : null },
      { id: 'openSalesCSV', action: () => openCSVFile(salesSchema, salesData, salesFileHandle, 'sales') },
      { id: 'openInteractionsCSV', action: () => openCSVFile(interactionsSchema, interactionsData, interactionsFileHandle, 'interactions') },
      { id: 'openInventoryCSV', action: () => openCSVFile(inventorySchema, inventoryData, inventoryFileHandle, 'inventory') },
      { id: 'addSalesRecord', action: () => addRecord(salesSchema, salesData, salesFileHandle, 'sales') },
      { id: 'addInventoryRecord', action: () => addRecord(inventorySchema, inventoryData, inventoryFileHandle, 'inventory') },
      { id: 'addInteractionRow', action: typeof addInteractionRow === 'function' ? addInteractionRow : null },
      { id: 'saveInteractionsCSV', action: typeof saveInteractionsTable === 'function' ? saveInteractionsTable : null }
    ];

    btnMap.forEach(item => {
      const el = document.getElementById(item.id);
      if (el && item.action) {
        el.addEventListener('click', item.action);
      }
    });

    if (typeof refreshTableForTab === 'function') {
      ['sales', 'interactions', 'inventory'].forEach(tab => {
        try { refreshTableForTab(tab); } catch (e) { console.warn(`خطا در رفرش جدول ${tab}:`, e); }
      });
    }

    if (typeof bindSalesRowDelegation === 'function') {
      const container = document.getElementById('salesLineItemsContainer');
      if (container) bindSalesRowDelegation(container);
    }

    if (typeof setupSalesProductHelper === 'function') {
      setupSalesProductHelper();
    }

    addLog('برنامه با موفقیت راه‌اندازی و سینک شد.', 'info');
  } catch (err) {
    addLog(`خطا در راه‌اندازی برنامه: ${err.message}`, 'error');
    console.error('Initialization Critical Error:', err);
  }
}


/* =========================================================
   نقشهٔ اثرات تراکنش‌ها بر انبار
   ========================================================= */
const stockImpactMap = {
  "خرید": -1,
  "خروج از انبار": -1,
  "پیش‌پرداخت": -1,
  "پیش پرداخت": -1,
  "لغو": 1,
  "ورود به انبار": 1,
  "بازگشت وجه": 1,
  "تعویض": 0,
  "تمدید": 0,
  "ارتقا": 0,
  "تسویه حساب": 0,
  "رزرو": 0,
  "سایر": 0
};

// تابع محاسبه اثر خالص تراکنش‌ها بر اساس شناسه محصول
function getSalesNetEffectByProductID(productId) {
  if (typeof salesData === 'undefined' || !Array.isArray(salesData)) return 0;

  const targetId = String(productId ?? '').trim();
  if (!targetId) return 0;

  return salesData.reduce((total, txn) => {
    const txnProductId = String(txn.ProductID ?? '').trim();
    if (txnProductId !== targetId) return total;

    const txnType = String(txn.TransactionType ?? '').trim();
    const qty = parseFloat(txn.Qty) || 0;
    const impact = stockImpactMap[txnType] || 0;

    return total + (qty * impact);
  }, 0);
}

// تابع اصلی جهت رفع Uncaught ReferenceError
function updateSalesStockEffectHelper(productId) {
  const actualProductId = productId || (document.querySelector('#salesFormGrid [name="ProductID"]')?.value);
  const helper = document.getElementById('salesProductHelper');
  if (!helper || !actualProductId) return;

  const infoDiv = helper.querySelector('.helper-info');
  const warningDiv = helper.querySelector('.helper-warning');

  const netEffect = getSalesNetEffectByProductID(actualProductId);
  const product = typeof findInventoryProductById === 'function' ? findInventoryProductById(actualProductId) : null;
  const openingStock = product ? (parseFloat(product.OpeningStock) || 0) : 0;
  const currentRealStock = openingStock + netEffect;

  const effectText = netEffect > 0 ? `+${netEffect}` : `${netEffect}`;
  const colorStyle = currentRealStock <= 0 ? 'color: red; font-weight: bold;' : '';

  let effectSection = helper.querySelector('.helper-stock-effect');
  if (!effectSection) {
    effectSection = document.createElement('div');
    effectSection.className = 'helper-stock-effect';
    effectSection.style.marginTop = '10px';
    effectSection.style.paddingTop = '10px';
    effectSection.style.borderTop = '1px dashed #ccc';
  }

  effectSection.innerHTML = `
    <strong>محاسبه هوشمند موجودی (دیتابیس فروش):</strong>
    <ul style="margin-top: 5px; padding-right: 20px; list-style-type: circle;">
      <li>اثر خالص تراکنش‌های فروش: <strong>${effectText}</strong></li>
      <li style="${colorStyle}">موجودی واقعی نهایی: <strong>${currentRealStock}</strong></li>
    </ul>
  `;

  if (infoDiv) {
    infoDiv.appendChild(effectSection);
  } else if (warningDiv) {
    warningDiv.appendChild(effectSection);
  }
}

// تعریف متغیر کمکی گلوبال جهت ممانعت از خطای selectedProductID تعریف‌نشده
if (typeof selectedProductID === 'undefined') {
  window.selectedProductID = undefined;
}

/* =========================================================
   منطق موجودی و اثرات تراکنش (چندردیفی)
   ========================================================= */

// یافتن محصول در انبار بر اساس شناسه
function findInventoryProductById(productId) {
  if (typeof inventoryData === 'undefined' || !Array.isArray(inventoryData)) return null;
  const targetId = String(productId ?? '').trim();
  return inventoryData.find(item => String(item.ProductID ?? '').trim() === targetId) || null;
}

// به‌روزرسانی راهنمای محصول برای هر ردیف به صورت تفکیک‌شده
function updateSalesProductHelperForRow(inputElement) {
  const row = getSalesRowParent(inputElement);
  if (!row) return;

  const productId = inputElement.value.trim();

  let helper = row.querySelector('.row-product-helper');
  if (!helper) {
    helper = document.createElement('div');
    helper.className = 'row-product-helper';
    helper.style = 'font-size: 0.85em; margin-top: 8px; padding: 8px; background: #f9f9f9; border-radius: 4px;';
    row.appendChild(helper);
  }

  if (!productId) {
    helper.innerHTML = '<span style="color: #666;">کد محصول را وارد کنید...</span>';
    return;
  }

  const product = findInventoryProductById(productId);
  const netEffect = getSalesNetEffectByProductID(productId);
  const openingStock = product ? (parseFloat(product.OpeningStock) || 0) : 0;
  const currentRealStock = openingStock + netEffect;

  const productName = product ? (product.ProductName || 'بدون نام') : 'محصول یافت نشد';
  const colorStyle = currentRealStock <= 0 ? 'color: #d93025; font-weight: bold;' : 'color: #188038;';

  helper.innerHTML = `
    <div><strong>کالا:</strong> ${productName} | <strong>موجودی اولیه:</strong> ${openingStock}</div>
    <div style="margin-top: 4px; border-top: 1px dashed #ddd; padding-top: 4px;">
      اثر تراکنش‌های قبلی: <strong>${netEffect > 0 ? '+' + netEffect : netEffect}</strong> |
      موجودی فعلی: <span style="${colorStyle}">${currentRealStock}</span>
    </div>
  `;
}

// اتوفیل قیمت فروش و به‌روزرسانی راهنما بر اساس ProductID
function handleProductIDAutoFill(productInputEl) {
  const row = getSalesRowParent(productInputEl);
  if (!row) return;

  const productID = productInputEl.value.trim();

  // ۱. آپدیت بخش راهنمای موجودی (Helper)
  updateSalesProductHelperForRow(productInputEl);

  // ۲. واکشی قیمت فروش خودکار
  const foundProduct = findInventoryProductById(productID);
  if (foundProduct) {
    const baseAmountEl = row.querySelector('[name="BaseAmount"]');
    const sellPrice = parseFloat(foundProduct.SellPrice || 0);
    if (baseAmountEl && sellPrice) {
      baseAmountEl.value = sellPrice;
      calculateSalesTotal();
    }
  }
}

/* =========================================================
   راه‌اندازی فروش چندردیفی
   نسخهٔ مرجع: یک‌بار کانتینر/فوتر را می‌سازد، یک ردیف اول را اضافه می‌کند
   و اتصال معرفی‌شده (delegation) را ایمن برقرار می‌کند.
   ========================================================= */
function setupMultiRowSales() {
  const salesFormGrid = document.getElementById('salesFormGrid');
  if (salesFormGrid) salesFormGrid.innerHTML = ''; // پاک‌سازی فرم قدیمی

  // کانتینر ردیف‌های فروش
  let container = document.getElementById('salesLineItemsContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'salesLineItemsContainer';

    const headerGrid = document.getElementById('salesHeaderGrid');
    if (headerGrid && headerGrid.parentNode) {
      headerGrid.parentNode.insertBefore(container, headerGrid.nextSibling);
    }
  }

  // فوتر محاسبات
  let footer = document.getElementById('salesFormFooter');
  if (!footer) {
    footer = document.createElement('div');
    footer.id = 'salesFormFooter';
    footer.innerHTML = `
      <div style="margin-top:10px; display:flex; gap:20px; background:#f0f0f0; padding:10px; border-radius:4px;">
        <div><label>مجموع مبالغ تعویض/برگشت: </label><input type="number" id="totalRefundAmount" readonly value="0"></div>
        <div><label>سود خالص نهایی: </label><input type="number" id="netProfitAmount" readonly value="0"></div>
      </div>
    `;

    if (container && container.parentNode) {
      container.parentNode.insertBefore(footer, container.nextSibling);
    }
  }

  // اتصال ایمن شنونده‌ها + اتوفیل (نمایندگی) — فقط یک‌بار
  if (container) bindSalesRowDelegation(container);

  // افزودن اولین ردیف خالی (فقط یک‌بار)
  if (typeof addSalesRow === 'function') {
    addSalesRow();
  }
}

/* =========================================================
   محاسبهٔ مجموع (ایمن در برابر نبود کانتینر)
   ========================================================= */
function calculateSalesTotal() {
  const container = document.getElementById('salesLineItemsContainer');
  if (!container) return; // جلوگیری از خطای null

  const rows = container.querySelectorAll('.sales-row-item');
  let totalRefund = 0;
  let totalNetProfit = 0;

  rows.forEach(row => {
    const txnType = row.querySelector('[name="TransactionType"]')?.value || 'خرید';
    const qty = parseFloat(row.querySelector('[name="Qty"]')?.value) || 0;
    const baseAmount = parseFloat(row.querySelector('[name="BaseAmount"]')?.value) || 0;
    const discount = parseFloat(row.querySelector('[name="DiscountPercent"]')?.value) || 0;

    const lineAmount = (qty * baseAmount) * (1 - discount / 100);

    if (txnType === 'بازگشت وجه' || txnType === 'تعویض') {
      totalRefund += lineAmount;
      totalNetProfit -= lineAmount;
    } else {
      totalNetProfit += lineAmount;
    }
  });

  const totalRefundInput = document.getElementById('totalRefundAmount');
  const netProfitInput = document.getElementById('netProfitAmount');

  if (totalRefundInput) totalRefundInput.value = totalRefund;
  if (netProfitInput) netProfitInput.value = totalNetProfit;
}

/* =========================================================
   مقداردهی اولیه فیلدهای هدر فروش (تاریخ، زمان و شناسه)
   محافظت‌شده در برابر نبود اسکیما/توابع کمکی.
   ========================================================= */
/* =========================================================
   تولید هدر تراکنش و فیلدهای CRM (اصلاح شده)
   ========================================================= */
function initializeSalesHeader() {
  const headerGrid = document.getElementById('salesHeaderGrid');
  if (!headerGrid || typeof salesHeaderSchema === 'undefined') return;

  headerGrid.innerHTML = '';
  // تنظیم استایل گرید برای نمایش فیلدهای زیاد
  headerGrid.style.display = 'grid';
  headerGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
  headerGrid.style.gap = '15px';

  salesHeaderSchema.forEach(field => {
    if (field.type === 'hidden') return;

    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.innerText = field.label;
    label.style.display = 'block';
    label.style.marginBottom = '5px';
    label.style.fontWeight = 'bold';

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      field.options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.text = opt;
        input.appendChild(o);
      });
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 2;
    } else {
      input = document.createElement('input');
      input.type = field.type || 'text';
    }

    input.name = `header_${field.name}`;
    input.id = `header_${field.name}`;
    input.className = 'form-control';
    input.style.width = '100%';

    // مقادیر پیش‌فرض
    if (field.name === 'Date') input.value = typeof formatLocalDate === 'function' ? formatLocalDate() : '';
    if (field.name === 'Time') input.value = typeof formatLocalTime === 'function' ? formatLocalTime().slice(0, 5) : '';
    if (field.name === 'TxnID') {
        input.value = typeof generateTxnID === 'function' ? generateTxnID() : '';
        input.readOnly = true;
        input.style.background = '#f4f4f4';
    }

    group.appendChild(label);
    group.appendChild(input);
    headerGrid.appendChild(group);
  });
}

function setupMultiRowSales() {
  const salesFormGrid = document.getElementById('salesFormGrid');
  if (salesFormGrid) salesFormGrid.innerHTML = ''; 

  let container = document.getElementById('salesLineItemsContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'salesLineItemsContainer';
    container.style.marginTop = '20px';
    container.style.borderTop = '2px solid #eee';
    container.style.paddingTop = '10px';
    
    const label = document.createElement('h3');
    label.innerText = 'آیتم‌های تراکنش';
    salesFormGrid.parentNode.insertBefore(label, salesFormGrid.nextSibling);
    salesFormGrid.parentNode.insertBefore(container, label.nextSibling);
  }

  let footer = document.getElementById('salesFormFooter');
  if (!footer) {
    footer = document.createElement('div');
    footer.id = 'salesFormFooter';
    footer.style = "margin-top:20px; padding:15px; background:#f8f9fa; border-radius:8px; border:1px solid #ddd;";
    footer.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <div>
            <label style="font-weight:bold;">مجموع مبالغ برگشتی/تعویض:</label>
            <input type="number" id="totalRefundAmount" class="form-control" readonly value="0" style="background:#fff; color:red;">
        </div>
        <div>
            <label style="font-weight:bold;">سود خالص نهایی تراکنش:</label>
            <input type="number" id="netProfitAmount" class="form-control" readonly value="0" style="background:#fff; color:green; font-weight:bold;">
        </div>
      </div>
      <div style="margin-top:15px; display:flex; gap:10px;">
         <button id="addSalesRowBtn" class="btn btn-secondary">+ افزودن ردیف محصول</button>
         <button id="addSalesRecord" class="btn btn-primary" style="flex-grow:1;">ثبت نهایی تراکنش در سیستم</button>
      </div>
    `;
    container.parentNode.insertBefore(footer, container.nextSibling);
    
    // اتصال دکمه افزودن ردیف
    document.getElementById('addSalesRowBtn').addEventListener('click', (e) => {
        e.preventDefault();
        addSalesRow();
    });
  }

  initializeSalesHeader();
  if (container.children.length === 0) addSalesRow();
  bindSalesRowDelegation(container);
}


/* =========================================================
   توابع کمکی تاریخ/زمان
   ========================================================= */
function getCurrentISO(date = new Date()) {
  return date.toISOString();
}

function getCurrentDate(date = new Date()) {
  return typeof formatLocalDate === 'function' ? formatLocalDate(date) : '';
}

function getCurrentTime(date = new Date()) {
  return typeof formatLocalTime === 'function' ? formatLocalTime(date) : '';
}

/* =========================================================
   راه‌اندازی هماهنگ (جایگزین ۳ شنوندهٔ تکراری قدیمی)
   ترتیب: init → هدر → ساخت ردیف‌ها/فوتر/اتصالات
   فقط یک‌بار addSalesRow اجرا می‌شود — بدون ردیف اضافه.
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  try {
    if (typeof init === 'function') init();
  } catch (err) {
    console.error('خطا در init:', err);
  }

  initializeSalesHeader();
  setupMultiRowSales();
});
