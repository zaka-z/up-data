    //07
    
    function clearProductHelpers() {
      const salesHelper = document.getElementById('salesProductHelper');
      const interactionsHelper = document.getElementById('interactionsProductHelper');
      if (salesHelper) salesHelper.innerHTML = '';
      if (interactionsHelper) interactionsHelper.innerHTML = '';
    }

    function updateSalesProductHelper(productId) {
      const helper = document.getElementById('salesProductHelper');
      if (!helper) return;
      
      const product = findInventoryProductById(productId);
      if (product) {
        const div = document.createElement('div');
        div.className = 'helper-info';
        
        const strong = document.createElement('strong');
        strong.textContent = 'اطلاعات محصول از دیتابیس انبار:';
        div.appendChild(strong);
        
        const ul = document.createElement('ul');
        const items = [
          `نام محصول: ${product.Name || '---'}`,
          `دسته‌بندی: ${product.Category || '---'}`,
          `زیردسته: ${product.SubCategory || '---'}`,
          `قیمت خرید: ${product.BuyPrice || '---'}`,
          `قیمت فروش: ${product.SellPrice || '---'}`,
          `موجودی اولیه: ${product.OpeningStock || '---'}`,
          `حداکثر درصد تخفیف: ${product.MaxDiscountPercent || '---'}`,
          `وضعیت: ${product.Condition || '---'}`
        ];
        
        items.forEach(text => {
          const li = document.createElement('li');
          li.textContent = text;
          ul.appendChild(li);
        });
        
        div.appendChild(ul);
        helper.innerHTML = '';
        helper.appendChild(div);

        const baseAmountEl = document.querySelector('#salesFormGrid [name="BaseAmount"]');
        const finalAmountEl = document.querySelector('#salesFormGrid [name="FinalAmount"]');
        const sellPrice = parseFiniteNumber(product.SellPrice);
        
        if (baseAmountEl && !baseAmountEl.value.trim() && sellPrice !== null && sellPrice >= 0) {
          baseAmountEl.value = sellPrice;
        }
        if (finalAmountEl && !finalAmountEl.value.trim() && sellPrice !== null && sellPrice >= 0) {
          finalAmountEl.value = sellPrice;
        }
      } else {
        const div = document.createElement('div');
        div.className = 'helper-warning';
        div.textContent = 'این کد محصول در دیتابیس انبار پیدا نشد، اما ثبت فروش محدود نمی‌شود.';
        helper.innerHTML = '';
        helper.appendChild(div);
      }
    }

    function updateInteractionsProductHelper(productId, rowIndex) {
      const helper = document.getElementById('interactionsProductHelper');
      if (!helper) return;
      
      const product = findInventoryProductById(productId);
      const div = document.createElement('div');
      
      if (product) {
        div.className = 'helper-info';
        div.textContent = `ردیف ${rowIndex + 1}: محصول با کد ${productId} پیدا شد: نام ${product.Name || '---'}، قیمت فروش ${product.SellPrice || '---'}`;
      } else {
        div.className = 'helper-warning';
        div.textContent = `ردیف ${rowIndex + 1}: این ProductID در دیتابیس انبار پیدا نشد، اما ثبت تعامل مجاز است.`;
      }
      
      helper.innerHTML = '';
      helper.appendChild(div);
    }

    // ۱. تعریف ایمن نقشه اثرات (فقط اگر قبلاً تعریف نشده باشد)
if (typeof window.stockImpactMap === 'undefined') {
  window.stockImpactMap = {
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
}

// ۲. تابع محاسبه اثر خالص با مدیریت خطای عدم وجود داده‌ها
if (typeof window.getSalesNetEffectByProductID === 'undefined') {
  window.getSalesNetEffectByProductID = function(productId) {
    if (typeof salesData === 'undefined' || !Array.isArray(salesData)) return 0;
    
    const targetId = String(productId ?? '').trim();
    if (!targetId) return 0;
    
    return salesData.reduce((total, txn) => {
      const txnProductId = String(txn.ProductID ?? '').trim();
      if (txnProductId !== targetId) return total;
      
      const txnType = String(txn.TransactionType ?? '').trim();
      const qty = parseFloat(txn.Qty) || 0;
      const impact = window.stockImpactMap[txnType] || 0;
      
      return total + (qty * impact);
    }, 0);
  };
}

// ۳. تعریف تابع اصلی جهت رفع خطای ReferenceError در فایل INITIALIZATION
// این تابع دقیقاً با همان نامی که در کد شما صدا زده شده (updateSalesStockEffectHelper) تعریف می‌شود
if (typeof window.updateSalesStockEffectHelper === 'undefined') {
  window.updateSalesStockEffectHelper = function(productId) {
    // مدیریت متغیر selectedProductID که در کد شما استفاده شده اما ممکن است تعریف نشده باشد
    const actualId = productId || (typeof selectedProductID !== 'undefined' ? selectedProductID : null) || document.querySelector('#salesFormGrid [name="ProductID"]')?.value;
    
    const helper = document.getElementById('salesProductHelper');
    if (!helper || !actualId) return;

    const netEffect = window.getSalesNetEffectByProductID(actualId);
    
    // واکشی موجودی اولیه از انبار (Inventory)
    const product = typeof findInventoryProductById === 'function' ? findInventoryProductById(actualId) : null;
    const openingStock = product ? (parseFloat(product.OpeningStock) || 0) : 0;
    const currentRealStock = openingStock + netEffect;

    const effectText = netEffect > 0 ? `+${netEffect}` : `${netEffect}`;
    const colorStyle = currentRealStock <= 0 ? 'color: #e74c3c; font-weight: bold;' : 'color: #27ae60;';

    // تزریق بصری به DOM بدون تخریب محتوای تولید شده توسط تابع اصلی شما
    let effectSection = helper.querySelector('.helper-stock-effect');
    if (!effectSection) {
      effectSection = document.createElement('div');
      effectSection.className = 'helper-stock-effect';
      effectSection.style.cssText = 'margin-top:12px; padding-top:10px; border-top:1px dashed #ddd; font-size:0.9em; line-height:1.6;';
      
      const targetContainer = helper.querySelector('.helper-info') || helper.querySelector('.helper-warning') || helper;
      targetContainer.appendChild(effectSection);
    }

    effectSection.innerHTML = `
      <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; border-right: 3px solid #3498db;">
        <strong style="display:block; margin-bottom:4px; color:#2c3e50;">تحلیل هوشمند موجودی:</strong>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span>اثر تراکنش‌های ثبت شده:</span>
          <span dir="ltr"><strong>${effectText}</strong></span>
        </div>
        <div style="display:flex; justify-content:space-between; ${colorStyle}">
          <span>موجودی واقعی فعلی:</span>
          <span dir="ltr"><strong>${currentRealStock}</strong></span>
        </div>
      </div>
    `;
  };
}

// ۴. اطمینان از تعریف شدن متغیر برای جلوگیری از خطای Reference در بدنه اصلی کد شما
if (typeof window.selectedProductID === 'undefined') {
  window.selectedProductID = null;
}

   