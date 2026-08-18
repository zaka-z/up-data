/* =========================================================
   PROJECT HEALTH CHECK / DEBUG DIAGNOSTIC
   فقط برای بررسی سلامت توابع در Console مرورگر
   ========================================================= *
(function () {
  'use strict';

  const HEALTH = {
    version: '1.0.0',
    enabled: true, // اگر نمی‌خواهی خودکار اجرا شود false بگذار
    autoRun: false, // برای اجرای خودکار روی load
    showPureFunctionSamples: true, // اجرای نمونه فقط برای توابع بی‌خطر
    results: []
  };

  function nowMs() {
    return (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
  }

  function isFn(value) {
    return typeof value === 'function';
  }

  function getFnMeta(fn) {
    if (!isFn(fn)) return null;
    return {
      type: fn.constructor && fn.constructor.name ? fn.constructor.name : 'Function',
      length: fn.length,
      name: fn.name || '(anonymous)'
    };
  }

  function safeCall(fn, args = []) {
    try {
      const t0 = nowMs();
      const result = fn(...args);
      const t1 = nowMs();
      return {
        ok: true,
        durationMs: +(t1 - t0).toFixed(3),
        result
      };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || String(error)
      };
    }
  }

  async function safeCallAsync(fn, args = []) {
    try {
      const t0 = nowMs();
      const result = await fn(...args);
      const t1 = nowMs();
      return {
        ok: true,
        durationMs: +(t1 - t0).toFixed(3),
        result
      };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || String(error)
      };
    }
  }

  function checkDOM(id) {
    const el = document.getElementById(id);
    return {
      id,
      exists: !!el,
      tag: el?.tagName || null
    };
  }

  function logTable(title, rows) {
    console.groupCollapsed(`%c${title}`, 'color:#0b5; font-weight:bold;');
    console.table(rows);
    console.groupEnd();
  }

  function addResult(row) {
    HEALTH.results.push(row);
  }

  // ---------------------------------------------------------
  // تعریف وضعیت و انتظار هر تابع
  // ---------------------------------------------------------
  const functionSpecs = [
    {
      name: 'generateUUID',
      purpose: 'تولید شناسه یکتا',
      input: 'بدون ورودی',
      output: 'string',
      safe: true,
      sampleArgs: []
    },
    {
      name: 'generateTxnID',
      purpose: 'تولید شناسه تراکنش',
      input: 'بدون ورودی',
      output: 'string',
      safe: true,
      sampleArgs: []
    },
    {
      name: 'formatLocalDate',
      purpose: 'تبدیل تاریخ به فرمت محلی',
      input: 'Date اختیاری',
      output: 'string',
      safe: true,
      sampleArgs: [new Date()]
    },
    {
      name: 'formatLocalTime',
      purpose: 'تبدیل زمان به فرمت محلی',
      input: 'Date اختیاری',
      output: 'string',
      safe: true,
      sampleArgs: [new Date()]
    },
    {
      name: 'generateFormFields',
      purpose: 'ساخت فیلدهای فرم از روی schema',
      input: 'schema, containerId',
      output: 'void / DOM mutation',
      safe: false
    },
    {
      name: 'fillAutoFields',
      purpose: 'پر کردن فیلدهای خودکار',
      input: 'schema, containerId, rowData?',
      output: 'void / DOM mutation',
      safe: false
    },
    {
      name: 'getFormData',
      purpose: 'استخراج داده فرم به object',
      input: 'schema, containerId',
      output: 'object',
      safe: false
    },
    {
      name: 'clearForm',
      purpose: 'پاک‌سازی فرم و بازنشانی فیلدهای auto',
      input: 'schema, containerId',
      output: 'void / DOM mutation',
      safe: false
    },
    {
      name: 'validateForm',
      purpose: 'اعتبارسنجی فرم',
      input: 'schema, containerId, tabKey',
      output: 'boolean',
      safe: false
    },
    {
      name: 'addSalesRow',
      purpose: 'افزودن ردیف فروش',
      input: 'بدون ورودی',
      output: 'void / DOM mutation',
      safe: false
    },
    {
      name: 'calculateSalesTotal',
      purpose: 'محاسبه جمع فروش',
      input: 'بدون ورودی یا وابسته به DOM',
      output: 'void / DOM mutation',
      safe: false
    },
    {
      name: 'getSalesDataList',
      purpose: 'استخراج آرایه رکوردهای فروش',
      input: 'txnSnapshot?',
      output: 'Array',
      safe: false
    },
    {
      name: 'syncSalesHeaderSnapshot',
      purpose: 'همگام‌سازی snapshot هدر فروش در DOM',
      input: 'txnSnapshot',
      output: 'void / DOM mutation',
      safe: false
    },
    {
      name: 'clearMultiRowSalesForm',
      purpose: 'پاک‌سازی فرم چندردیفی فروش',
      input: 'بدون ورودی',
      output: 'void / DOM mutation',
      safe: false
    },
    {
      name: 'refreshTableForTab',
      purpose: 'به‌روزرسانی جدول نمایش',
      input: 'tabKey',
      output: 'void / DOM mutation',
      safe: false
    },
    {
      name: 'saveCSVToFile',
      purpose: 'ذخیره CSV',
      input: 'dataArray, schema, fileHandleRef, tabKey',
      output: 'Promise',
      safe: false
    },
    {
      name: 'addRecord',
      purpose: 'ثبت رکورد/تراکنش',
      input: 'schema, dataArray, fileHandleRef, tabKey',
      output: 'Promise',
      safe: false
    },
    {
      name: 'setupMultiRowSales',
      purpose: 'راه‌اندازی فرم چندردیفی فروش',
      input: 'بدون ورودی',
      output: 'void / DOM mutation',
      safe: false
    },
    {
      name: 'onInventoryDatabaseUpdated',
      purpose: 'اعلان بروزرسانی دیتابیس انبار',
      input: 'بدون ورودی',
      output: 'void',
      safe: false
    },
    {
      name: 'markDirty',
      purpose: 'علامت‌گذاری تب به‌عنوان تغییر کرده',
      input: 'tabKey',
      output: 'void',
      safe: false
    },
    {
      name: 'addLog',
      purpose: 'ثبت پیام در لاگ داخلی برنامه',
      input: 'message, level',
      output: 'void',
      safe: false
    }
  ];

  async function runHealthCheck() {
    if (!HEALTH.enabled) {
      console.warn('[HEALTH] Disabled.');
      return;
    }

    HEALTH.results = [];
    console.group('%cProject Health Check', 'color:#2563eb; font-weight:bold; font-size:14px;');

    console.info('Version:', HEALTH.version);
    console.info('Mode:', 'diagnostic only');
    console.info('Auto-run:', HEALTH.autoRun);
    console.info('Pure sample execution:', HEALTH.showPureFunctionSamples);

    // -----------------------------------------------------
    // بررسی پیش‌نیازهای DOM
    // -----------------------------------------------------
    const domChecks = [
      checkDOM('salesHeaderGrid'),
      checkDOM('salesLineItemsContainer'),
      checkDOM('salesFormGrid'),
      checkDOM('inventoryFormGrid'),
      checkDOM('totalRefundAmount'),
      checkDOM('netProfitAmount')
    ];

    logTable('DOM prerequisites', domChecks);

    // -----------------------------------------------------
    // بررسی متغیرهای schema
    // -----------------------------------------------------
    const schemaChecks = [
      {
        name: 'salesHeaderSchema',
        exists: typeof window.salesHeaderSchema !== 'undefined',
        isArray: Array.isArray(window.salesHeaderSchema),
        length: Array.isArray(window.salesHeaderSchema) ? window.salesHeaderSchema.length : null
      },
      {
        name: 'salesLineItemSchema',
        exists: typeof window.salesLineItemSchema !== 'undefined',
        isArray: Array.isArray(window.salesLineItemSchema),
        length: Array.isArray(window.salesLineItemSchema) ? window.salesLineItemSchema.length : null
      },
      {
        name: 'salesSchema',
        exists: typeof window.salesSchema !== 'undefined',
        isArray: Array.isArray(window.salesSchema),
        length: Array.isArray(window.salesSchema) ? window.salesSchema.length : null
      }
    ];

    logTable('Schema checks', schemaChecks);

    // -----------------------------------------------------
    // بررسی توابع
    // -----------------------------------------------------
    const fnRows = [];

    for (const spec of functionSpecs) {
      const fn = window[spec.name];
      const exists = isFn(fn);
      const meta = getFnMeta(fn);

      const row = {
        function: spec.name,
        exists,
        type: meta?.type || null,
        arity: meta?.length ?? null,
        expectedInput: spec.input,
        expectedOutput: spec.output,
        purpose: spec.purpose,
        safeToExecute: spec.safe
      };

      // اجرای نمونه فقط برای توابع بی‌خطر
      if (exists && spec.safe && HEALTH.showPureFunctionSamples) {
        if (fn.constructor.name === 'AsyncFunction') {
          const sample = await safeCallAsync(fn, spec.sampleArgs || []);
          row.sampleRun = sample.ok ? 'ok' : 'error';
          row.sampleDurationMs = sample.durationMs ?? null;
          row.sampleResultType = sample.ok ? typeof sample.result : null;
          row.sampleError = sample.ok ? null : sample.error;
        } else {
          const sample = safeCall(fn, spec.sampleArgs || []);
          row.sampleRun = sample.ok ? 'ok' : 'error';
          row.sampleDurationMs = sample.durationMs ?? null;
          row.sampleResultType = sample.ok ? typeof sample.result : null;
          row.sampleResultPreview = sample.ok
            ? String(sample.result).slice(0, 120)
            : null;
          row.sampleError = sample.ok ? null : sample.error;
        }
      } else if (exists && !spec.safe) {
        row.sampleRun = 'skipped';
        row.sampleDurationMs = null;
        row.sampleResultType = null;
        row.sampleError = null;
      } else {
        row.sampleRun = 'missing';
        row.sampleDurationMs = null;
        row.sampleResultType = null;
        row.sampleError = 'function not found';
      }

      fnRows.push(row);
      addResult(row);
    }

    logTable('Function health', fnRows);

    // -----------------------------------------------------
    // جمع‌بندی نهایی
    // -----------------------------------------------------
    const missingFns = fnRows.filter(r => !r.exists).map(r => r.function);
    const errorSamples = fnRows.filter(r => r.sampleRun === 'error').map(r => r.function);

    console.group('%cSummary', 'color:#7c3aed; font-weight:bold;');
    console.info('Total functions checked:', fnRows.length);
    console.info('Missing functions:', missingFns.length ? missingFns : 'none');
    console.info('Sample execution errors:', errorSamples.length ? errorSamples : 'none');
    console.groupEnd();

    if (missingFns.length) {
      console.warn('Missing functions detected:', missingFns);
    }

    if (errorSamples.length) {
      console.warn('Functions with sample execution errors:', errorSamples);
    }

    console.groupEnd();

    return {
      domChecks,
      schemaChecks,
      functionChecks: fnRows,
      missingFns,
      errorSamples
    };
  }

  // ---------------------------------------------------------
  // در دسترس برای اجرای دستی از Console
  // ---------------------------------------------------------
  window.runProjectHealthCheck = runHealthCheck;
  window.__PROJECT_HEALTH__ = HEALTH;

  // ---------------------------------------------------------
  // اجرای خودکار فقط اگر خواستی
  // ---------------------------------------------------------
  if (HEALTH.autoRun) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(() => {
        runHealthCheck();
      }, 0);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        runHealthCheck();
      });
    }
  }
})();*/
/* =========================================================
   PROJECT HEALTH CHECK & DIAGNOSTIC SYSTEM (Pro Version)
   این ماژول برای عیب‌یابی است و تغییری در منطق برنامه ایجاد نمی‌کند.
   اجرا در کنسول: runProjectHealthCheck()
   ========================================================= */
/* ==========================================================================
   check.js — GapGPT Professional Project Health Check
   --------------------------------------------------------------------------
   هدف:
   - تحلیل فقط‌خواندنی (Read-only) پروژه، بدون تغییر state یا DOM
   - بررسی Runtime، DOM، Schemaها، توابع، وابستگی‌ها، selectors، auto-runها
   - تحلیل ایستای scriptهای قابل دسترس و تشخیص duplicate definition
   - جلوگیری از اجرای هم‌زمان و امکان اجرای دستی کنترل‌شده

   استفاده در Console:
      runProjectHealthCheck()

   اجرای مجدد کامل در همان صفحه:
      resetProjectHealthCheck()
      runProjectHealthCheck({ force: true })

   نکته:
   این فایل هیچ‌کدام از توابع عملیاتی پروژه را فراخوانی نمی‌کند.
   ========================================================================== */

/* ==========================================================================
   check.js v3 — GapGPT Professional Project Health Check
   تغییرات نسخه ۳ نسبت به ۲:
   - حذف خودکار فایل checker از اسکن (رفع نویز setTimeout/DOMContentLoaded)
   - رزولشن lexical برای schema و global state (حذف false positive)
   - فیلتر تکراری‌های کاذب (تک‌حرفی / غیر function در runtime)
   - نمایش محل (فایل:خط) به‌صورت inline برای موارد بحرانی
   - اتکای گزارش به اسکن زندهٔ واقعی فایل‌ها به‌جای داده‌های مرجع
   ========================================================================== */
(function attachProjectHealthCheck(global) {
  'use strict';

  const NAME = 'GapGPT Professional Project Health Check';
  const VERSION = '3.0.0';
  const RUNNING_KEY = '__projectHealthCheckRunning__';
  const DONE_KEY = '__projectHealthCheckDone__';
  const LAST_KEY = '__projectHealthCheckLastReport__';

  /* منبع خودمان؛ برای حذف فایل checker از اسکن (به‌جای currentScript) */
  const MY_SRC = (document.currentScript && document.currentScript.src) || '';

  /* نام‌هایی که lexical هستند؛ در window نیستند اما معتبرند */
  const LEXICAL_NAMES = [
    'salesHeaderSchema', 'salesLineItemSchema', 'interactionsSchema', 'inventorySchema',
    'salesData', 'interactionsData', 'inventoryData', 'logs',
    'currentPage', 'currentTab', 'inventory', 'selectedProductIds'
  ];

  const DOM_IDS = [
    'salesHeaderGrid', 'salesLineItemsContainer', 'salesFormGrid',
    'totalRefundAmount', 'netProfitAmount', 'logArea', 'salesTableContainer',
    'interactionsTableContainer', 'interactionsPagination',
    'inventoryFormGrid', 'inventoryTableContainer', 'inventoryPagination'
  ];

  /* شبیه‌سازی رزولشن جهانی شامل lexical scope */
  function resolveName(name) {
    if (DOM_IDS.includes(name)) {
      try { return { found: Boolean(document.getElementById(name)), scope: 'dom' }; }
      catch (_) { return { found: false, scope: 'dom' }; }
    }
    if (LEXICAL_NAMES.includes(name)) {
      try {
        return { found: (typeof global[name] !== 'undefined' || typeof eval(name) !== 'undefined'), scope: 'lexical/window' };
      } catch (_) { return { found: (typeof global[name] !== 'undefined'), scope: 'window' }; }
    }
    return { found: (typeof global[name] !== 'undefined'), scope: 'window' };
  }

  const REQUIRED_FUNCTIONS = [
    { name: 'addRecord', cat: 'ثبت داده/I-O', risk: 'high', args: [4], deps: ['validateForm','getSalesDataList','saveCSVToFile','clearMultiRowSalesForm','addLog'] },
    { name: 'getSalesDataList', cat: 'استخراج فروش', risk: 'high', args: [0], deps: ['salesHeaderSchema','salesLineItemSchema','salesLineItemsContainer'] },
    { name: 'setupMultiRowSales', cat: 'راه‌اندازی UI', risk: 'high', args: [0], deps: ['salesLineItemsContainer'] },
    { name: 'calculateSalesTotal', cat: 'محاسبات', risk: 'medium', args: [0], deps: ['inventoryData','salesLineItemsContainer'] },
    { name: 'saveCSVToFile', cat: 'ذخیره فایل', risk: 'high', args: [4], deps: ['showSaveFilePicker','objectsToCSV','addLog'] },
    { name: 'openCSVFile', cat: 'باز کردن فایل', risk: 'high', args: [0], deps: ['showOpenFilePicker','parseCSV','validateCSVHeaders'] },
    { name: 'generateUUID', cat: 'شناسه یکتا', risk: 'low', args: [0], deps: [] },
    { name: 'formatLocalDate', cat: 'فرمت تاریخ', risk: 'low', args: [0], deps: [] },
    { name: 'addLog', cat: 'سامانه لاگ', risk: 'medium', args: [1], deps: ['logs','updateLogDisplay'] },
    { name: 'refreshTableForTab', cat: 'رندر جدول', risk: 'medium', args: [1], deps: [] },
    { name: 'changePage', cat: 'صفحه‌بندی', risk: 'medium', args: [2], deps: ['refreshTableForTab'] },
    { name: 'init', cat: 'راه‌اندازی', risk: 'high', args: [0], deps: ['setupTabSwitching','setupMultiRowSales','initializeSalesHeader'] }
  ];

  const SEV = {
    info:    { label: 'اطلاعات', icon: 'ℹ️', color: '#2563eb', w: 0 },
    low:     { label: 'کم',      icon: '🟡', color: '#ca8a04', w: 1 },
    medium:  { label: 'متوسط',   icon: '🟠', color: '#ea580c', w: 3 },
    high:    { label: 'بالا',    icon: '🔴', color: '#dc2626', w: 7 },
    critical:{ label: 'بحرانی',  icon: '🚨', color: '#991b1b', w: 15 }
  };

  function lineOf(text, index) { return text.slice(0, index).split('\n').length; }
  function safeLog(method, ...args) {
    const fn = (console && typeof console[method] === 'function') ? console[method] : console.log;
    fn.apply(console, args);
  }

  function newReport() {
    return {
      checker: NAME, version: VERSION, startedAt: new Date().toISOString(),
      durationMs: 0, env: {}, schemas: [], states: [], dom: [], functions: [],
      deps: [], scripts: [], autoRuns: [], criticals: [],
      duplicates: [], selectorRisks: [], hazards: [],
      stat: { total: 0, scanned: 0, inaccessible: 0, inline: 0, chars: 0 },
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, score: 100, status: 'نامشخص' }
    };
  }

  function add(report, group, item) {
    const sev = SEV[item.severity] ? item.severity : 'info';
    const entry = { severity: sev, ...item };
    report[group].push(entry);
    report.summary[sev] += 1;
    return entry;
  }

  function score(report) {
    const p = report.summary.critical * SEV.critical.w +
              report.summary.high * SEV.high.w +
              report.summary.medium * SEV.medium.w +
              report.summary.low * SEV.low.w;
    const s = Math.max(0, Math.min(100, 100 - p));
    let st = '💚 سالم';
    if (s < 90) st = '💛 نیازمند بازبینی';
    if (s < 70) st = '🟠 پرریسک';
    if (s < 45) st = '🔴 نیازمند اصلاح فوری';
    if (report.summary.critical > 0) st = '🚨 دارای مورد بحرانی';
    report.summary.score = s;
    report.summary.status = st;
  }

  /* ============ محیط و schema ============ */
  function scanEnv(report) {
    report.env = {
      url: location.href, readyState: document.readyState,
      secure: !!global.isSecureContext, online: navigator.onLine,
      platform: navigator.platform, faDateTime: new Date().toLocaleString('fa-IR')
    };
    ['salesHeaderSchema','salesLineItemSchema','interactionsSchema','inventorySchema'].forEach((nm, i) => {
      const r = resolveName(nm);
      let value;
      try { value = (typeof eval(nm) !== 'undefined') ? eval(nm) : global[nm]; } catch (_) { value = global[nm]; }
      const fields = (value && typeof value === 'object') ? Object.keys(value).length : null;
      const ok = r.found;
      report.schemas.push({
        name: nm, status: ok ? '✅ قابل دسترس' : '❌ قابل مشاهده نیست',
        type: typeof value, fields: fields ?? 'N/A', scope: r.scope
      });
      if (!ok) add(report, 'hazards', {
        severity: 'medium', title: `Schema قابل مشاهده نیست: ${nm}`,
        detail: 'روش lexical/window نتجیه‌ای نداشت؛ اگر داخل module باشد طبیعی است.'
      });
      if (ok && fields === 0) add(report, 'hazards', {
        severity: 'high', title: `${nm} خالی است`, detail: 'بدون فیلد، فرم/اعتبارسنجی/CSV ممکن است ناقص شود.'
      });
    });
  }

  function scanStates(report) {
    ['salesData','interactionsData','inventoryData','logs','currentPage','currentTab'].forEach((nm) => {
      const r = resolveName(nm);
      report.states.push({ name: nm, found: r.found, scope: r.scope, note: r.found ? 'موجود' : 'در scope محلی/module' });
    });
  }

  /* ============ DOM ============ */
  function scanDOM(report) {
    DOM_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) { report.dom.push({ id, status: '❌ مفقود' }); return; }
      report.dom.push({ id, status: `✅ ${el.tagName}` });
    });

    const c = document.getElementById('salesLineItemsContainer');
    if (c) {
      const rows = c.querySelectorAll('.sales-row-item').length;
      const wrong = document.querySelectorAll('#salesLineItemsContainer.sales-row-item').length;
      const right = document.querySelectorAll('#salesLineItemsContainer .sales-row-item').length;
      report.dom.push({ id: 'rows(.sales-row-item)', status: `${rows} ردیف` });
      if (wrong !== right) add(report, 'selectorRisks', {
        severity: 'critical', title: 'ناهماهنگی selector فروش',
        detail: `"#salesLineItemsContainer.sales-row-item" => ${wrong} نتیجه، در حالی که شکل صحیح => ${right} نتیجه.`,
        location: 'runtime'
      });
    } else {
      report.dom.push({ id: 'salesLineItemsContainer', status: '❌ مفقود' });
    }
  }

  /* ============ توابع و وابستگی‌ها ============ */
  function scanFunctions(report) {
    REQUIRED_FUNCTIONS.forEach((t) => {
      const fn = global[t.name];
      const exists = typeof fn === 'function';
      const missing = t.deps.filter((d) => !resolveName(d).found);
      report.functions.push({
        name: t.name, ok: exists ? '✅' : '❌', cat: t.cat,
        args: exists ? fn.length : 'N/A', missing: missing.length ? missing.join(', ') : '---'
      });
      if (!exists) add(report, 'hazards', {
        severity: t.risk === 'high' ? 'critical' : 'high', title: `تابع مفقود است: ${t.name}`, detail: `دسته: ${t.cat}`
      });
      else if (Array.isArray(t.args) && !t.args.includes(fn.length)) add(report, 'hazards', {
        severity: 'medium', title: `پارامتر غیرمنتظره: ${t.name}`,
        detail: `دارای ${fn.length} پارامتر است، انتظار: ${t.args.join(' یا ')}`
      });
      if (missing.length) add(report, 'hazards', {
        severity: t.risk === 'high' ? 'medium' : 'low', title: `وابستگی نامحسوس: ${t.name}`,
        detail: `غیاب مشاهده‌شده برای: ${missing.join(', ')}`
      });
    });
  }

  /* ============ اسکن ایستا ============ */
  function extractDefs(text, src) {
    const out = [];
    const decl = /\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
    const assign = /\b(?:const|let|var|window|globalThis)\s*(?:\.\s*)?([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>?/g;
    let m;
    while ((m = decl.exec(text))) out.push({ name: m[1], kind: 'function', src, line: lineOf(text, m.index) });
    while ((m = assign.exec(text))) out.push({ name: m[1], kind: 'assign', src, line: lineOf(text, m.index) });
    return out;
  }

  function scanStatic(report, text, src) {
    const hazards = [
      { re: /\bnewDate\s*\(/g, sev: 'critical', t: 'newDate() (بدون فاصله)', d: 'سازندهٔ صحیح new Date() است؛ اگر literal باشد ReferenceError می‌دهد.' },
      { re: /\bwhile\s*\(\s*true\s*\)/g, sev: 'critical', t: 'while(true) یافت شد', d: 'حلقهٔ نامحدود محتمل؛ امکان مسدودشدن UI.' },
      { re: /(?:===|==|!==|!=)\s*NaN\b|\bNaN\s*(?:===|==|!==|!=)/g, sev: 'high', t: 'مقایسهٔ مستقیم با NaN', d: 'همیشه false؛ از Number.isNaN() استفاده کنید.' },
      { re: /#salesLineItemsContainer\.sales-row-item/g, sev: 'critical', t: 'selector چندردیفی نادرست', d: 'شکل صحیح: #salesLineItemsContainer .sales-row-item' },
      { re: /document\.getElementById\(\s*['"]salesLineItemsContainer['"]\s*\)\.addEventListener/g, sev: 'high', t: 'listener بدون null-check', d: 'در صورت نبود کانتینر، اجرای فایل متوقف می‌شود.' }
    ];
    hazards.forEach((h) => {
      let m;
      while ((m = h.re.exec(text))) add(report, 'hazards', {
        severity: h.sev, title: h.t, detail: h.d, location: `${src}:${lineOf(text, m.index)}`
      });
    });
    const auto = [
      { re: /(?:window|document)\.addEventListener\(\s*['"]DOMContentLoaded['"]/g, t: 'DOMContentLoaded', risk: 'medium' },
      { re: /(?:window|document)\.addEventListener\(\s*['"]load['"]/g, t: 'load' },
      { re: /\bsetTimeout\s*\(/g, t: 'setTimeout', risk: 'low' }
    ];
    auto.forEach((a) => {
      let m;
      while ((m = a.re.exec(text))) report.autoRuns.push({ source: src, line: lineOf(text, m.index), type: a.t, risk: a.risk || 'low' });
    });
  }

  /* تکراری‌ها با فیلتر نویز: فقط نام‌هایی که در runtime تابع واقعی‌اند */
  async function scanScripts(report) {
    const scripts = Array.from(document.scripts);
    report.stat.total = scripts.length;
    const allDefs = [];

    for (const script of scripts) {
      const src = script.src || `inline-${report.stat.inline++ + 1}`;
      if (src && MY_SRC && src === MY_SRC) {
        report.scripts.push({ source: 'check.js (خود ابزار)', scanned: false, skip: 'خودِ checker' });
        continue;
      }
      let text = script.textContent || '';
      let scanned = false;
      if (!script.src) { scanned = true; text = script.textContent || ''; }
      else {
        try {
          const r = await fetch(script.src, { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          text = await r.text(); scanned = true;
        } catch (e) {
          report.stat.inaccessible++;
          report.scripts.push({ source: src, scanned: false, reason: e.message });
          continue;
        }
      }
      if (scanned) {
        report.stat.scanned++; report.stat.chars += text.length;
        report.scripts.push({ source: src, scanned: true, chars: text.length });
        allDefs.push(...extractDefs(text, src));
        scanStatic(report, text, src);
      }
    }

    /* گروه‌بندی و فیلتر نویز */
    const groups = new Map();
    allDefs.forEach((d) => { if (!groups.has(d.name)) groups.set(d.name, []); groups.get(d.name).push(d); });
    groups.forEach((items, name) => {
      if (items.length < 2) return;
      if (name.length === 1) return;                                   // حذف تک‌حرفی (نویز)
      const isRuntimeFn = typeof global[name] === 'function';
      const hasDecl = items.some((i) => i.kind === 'function');
      if (!isRuntimeFn && !hasDecl) return;                            // متغیر محلی/کاذب
      add(report, 'duplicates', {
        severity: 'high', title: `تعریف تکراری: ${name}`,
        detail: `${items.length} بار تعریف شده (فعّال‌ترین نسخه override می‌کند).`,
        locations: items.map((i) => `${i.src}:${i.line}`).join(' | '),
        runtimeFunction: isRuntimeFn
      });
      if (name === 'addRecord' || name === 'setupMultiRowSales') {
        const last = items[items.length - 1];
        add(report, 'criticals', {
          severity: 'critical', title: `بحرانی: تداخل ${name}`,
          detail: 'دو نسخهٔ متفاوت ثبت داده/راه‌اندازی وجود دارد؛ نسخهٔ دوم ناخواسته نسخهٔ قبلی را override کرده است.',
          location: `${last.src}:${last.line}`
        });
      }
    });
  }

  /* ============ نمایش ============ */
  function table(title, rows) {
    safeLog('groupCollapsed', `%c${title}`, 'color:#0f766e; font-weight:700;');
    rows.length ? safeLog('table', rows) : safeLog('log', '— موردی نیست —');
    safeLog('groupEnd');
  }

  function findings(title, items) {
    safeLog('groupCollapsed', `%c${title} — ${items.length} مورد`, 'color:#b91c1c; font-weight:800;');
    if (!items.length) { safeLog('log', '✅ موردی نیست.'); safeLog('groupEnd'); return; }
    items.forEach((it, i) => {
      const s = SEV[it.severity];
      safeLog('groupCollapsed', `%c${i + 1}. ${s.icon} [${s.label}] ${it.title}${it.location ? ' — ' + it.location : ''}`, `color:${s.color}; font-weight:700;`);
      safeLog('log', it.detail);
      if (it.locations) safeLog('log', 'محل‌ها:', it.locations);
      safeLog('groupEnd');
    });
    safeLog('groupEnd');
  }

  function printReport(r) {
    safeLog('groupCollapsed', `%c🔍 ${NAME} | v${VERSION}`, 'background:#0f172a;color:#38bdf8;padding:6px 10px;border-radius:4px;font-weight:800;font-size:14px;');
    const sCol = r.summary.critical ? '#7f1d1d' : (r.summary.high ? '#9a3412' : '#065f46');
    safeLog('log', `%cامتیاز: ${r.summary.score}/100 — ${r.summary.status}`, `background:${sCol};color:#fff;padding:6px 10px;font-weight:800;`);
    safeLog('log', `زمان: ${r.durationMs.toFixed(2)}ms | اسکن: ${r.stat.scanned}/${r.stat.total} | غیرقابل‌دسترس: ${r.stat.inaccessible}`);
    table('🧭 محیط', [r.env]);
    table('📊 Schemaها', r.schemas);
    table('🗂️ Global State', r.states);
    table('🏗️ DOM', r.dom);
    table('⚙️ توابع', r.functions);
    table('🚀 Auto-run', r.autoRuns);
    findings('🚨 موارد بحرانی/بالا (اولویت رفع)', r.criticals.concat(r.hazards));
    findings('⚠️ تکراری‌ها / Override', r.duplicates);
    findings('🎯 Selectorها', r.selectorRisks);
    safeLog('log', 'راهنما: موارد دارای location مستقیماً از اسکن زندهٔ فایل‌های همین صفحه اند.');
    safeLog('groupEnd');
  }

  /* ============ API ============ */
  async function runProjectHealthCheck(options = {}) {
    const opts = { force: !!options.force, print: options.print !== false };
    if (global[RUNNING_KEY]) { safeLog('warn', 'در حال اجراست.'); return global[LAST_KEY] || null; }
    if (global[DONE_KEY] && !opts.force) { safeLog('warn', 'قبلاً اجرا شده. برای تکرار: runProjectHealthCheck({force:true})'); return global[LAST_KEY] || null; }

    global[RUNNING_KEY] = true;
    const r = newReport();
    const t0 = performance.now();
    try {
      scanEnv(r); scanStates(r); scanDOM(r); scanFunctions(r);
      await scanScripts(r);
      score(r);
      r.durationMs = performance.now() - t0;
      global[DONE_KEY] = true; global[LAST_KEY] = r;
      if (opts.print) printReport(r);
      return r;
    } catch (e) {
      r.durationMs = performance.now() - t0;
      add(r, 'criticals', { severity: 'critical', title: 'خطای داخلی Health Check', detail: e.message, location: String(e.stack).split('\n')[1] || '' });
      score(r); global[LAST_KEY] = r;
      safeLog('error', 'Health Check با خطا متوقف شد.', e);
      if (opts.print) printReport(r);
      return r;
    } finally { global[RUNNING_KEY] = false; }
  }

  function resetProjectHealthCheck() {
    global[RUNNING_KEY] = false; global[DONE_KEY] = false; global[LAST_KEY] = null;
    safeLog('log', '✅ حالت Health Check ریست شد (داده‌های پروژه دست‌نخورده‌اند).');
  }

  global.runProjectHealthCheck = runProjectHealthCheck;
  global.resetProjectHealthCheck = resetProjectHealthCheck;
  global.getLastProjectHealthReport = () => global[LAST_KEY] || null;

  safeLog('log', `%c[System] ${NAME} v${VERSION} آماده است.`, 'color:#0f766e;font-weight:800;');
  safeLog('log', '%cبرای شروع: runProjectHealthCheck()', 'color:#1d4ed8;font-weight:800;');
})(window);
