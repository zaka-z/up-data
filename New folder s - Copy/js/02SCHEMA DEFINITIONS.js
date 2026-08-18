/* =========================================================
   //02 – اسکیماهای فروش، تعاملات و انبار
   نسخه یکپارچه و رفع‌شده (بدون تعریف تکراری)
   ========================================================= */

/* ۱. اسکیما سربرگ فروش
   - ادغام نسخه پایه (auto / readonly) با نسخه توسعه‌یافته CRM
   - فقط یک const تعریف می‌شود تا خطای Duplicate declaration رخ ندهد */
const salesHeaderSchema = [
  { name: 'uid', label: 'شناسه یکتا', type: 'text', auto: 'uuid', readonly: true },
  { name: 'RecordedAtISO', label: 'زمان ثبت (ISO)', type: 'text', auto: 'iso', readonly: true },
  { name: 'TxnID', label: 'شناسه تراکنش', type: 'text', auto: 'txnid', readonly: true },
  { name: 'Date', label: 'تاریخ', type: 'date', required: true },
  { name: 'Time', label: 'زمان', type: 'time', required: true },

  // فیلدهای مشتری و CRM
  { name: 'CustomerID', label: 'شناسه مشتری', type: 'text' },
  { name: 'CustomerName', label: 'نام مشتری', type: 'text' },
  { name: 'CustomerPhone', label: 'تلفن مشتری', type: 'text' },
  { name: 'StaffID', label: 'کد پرسنل', type: 'text' },
  { name: 'AgeRange', label: 'بازه سنی', type: 'select', options: ['زیر ۱۸', '۱۸-۲۴', '۲۵-۳۴', '۳۵-۴۴', '۴۵-۵۴', '۵۵-۶۴', '۶۵+', 'نامشخص'] },
  { name: 'Gender', label: 'جنسیت', type: 'select', options: ['مرد', 'زن', 'عدم تمایل به پاسخ', 'نامشخص'] },
  { name: 'CustomerMood', label: 'حالت مشتری', type: 'select', options: ['عادی', 'ناراضی', 'راضی'] },
  { name: 'Channel', label: 'کانال', type: 'select', options: ['وب‌سایت', 'اپلیکیشن', 'اینستاگرام', 'تلگرام', 'واتساپ', 'تماس تلفنی', 'حضوری', 'معرفی', 'تبلیغات', 'پیامک', 'ایمیل', 'سایر'] },
  { name: 'TransactionStatus', label: 'وضعیت تراکنش', type: 'select', options: ['موفق', 'ناموفق', 'در انتظار پرداخت', 'در حال بررسی', 'لغو شده', 'بازگشت داده شده', 'نیمه‌کاره', 'منقضی شده'] },
  { name: 'ServiceType', label: 'نوع خدمات', type: 'select', options: ['فروش محصول', 'ارائه خدمات', 'مشاوره', 'پشتیبانی', 'آموزش', 'نصب و راه‌اندازی', 'تعمیرات', 'اشتراک', 'سفارش اختصاصی', 'سایر'] },
  { name: 'PaymentMethod', label: 'روش پرداخت', type: 'select', options: ['پرداخت آنلاین', 'کارت‌به‌کارت', 'کارت‌خوان حضوری', 'نقدی', 'انتقال بانکی', 'چک', 'کیف پول', 'پرداخت در محل', 'اعتباری', 'اقساطی', 'سایر'] },
  { name: 'Notes', label: 'یادداشت', type: 'textarea' }
];

/* ۲. فیلدهای ردیف (پویا و تکرارشونده)
   توجه: فیلدهای محاسباتی کل از سطح ردیف حذف شده‌اند؛ آنها به بخش محاسبات نهایی منتقل می‌شوند. */
const salesLineItemSchema = [
  { name: 'TransactionType', label: 'نوع تراکنش', type: 'select', options: ['خرید', 'بازگشت وجه', 'تعویض', 'اقساط'], required: true },

  // فیلدهای عمومی ردیف
  { name: 'ProductID', label: 'کد محصول', type: 'text' },
  { name: 'Qty', label: 'تعداد', type: 'number' },
  { name: 'DiscountPercent', label: 'درصد تخفیف', type: 'number' },
  { name: 'BaseAmount', label: 'مبلغ پایه', type: 'number' },

  // فیلدهای مربوط به بازگشت وجه و تعویض
  { name: 'RelatedTxnID', label: 'شناسه تراکنش مرتبط', type: 'text' },
  { name: 'ReturnProductID', label: 'کد محصول بازگشتی', type: 'text' },
  { name: 'ReturnQty', label: 'تعداد محصول بازگشتی', type: 'number' },
  { name: 'ReplacementProductID', label: 'کد محصول جایگزین', type: 'text' },
  { name: 'ReplacementQty', label: 'تعداد محصول جایگزین', type: 'number' },
  { name: 'ReturnReason', label: 'علت بازگشت', type: 'select', options: ['خرابی کالا', 'اشتباه در ارسال', 'انصراف مشتری', 'سایر'] },
  { name: 'InstallmentCount', label: 'تعداد اقساط', type: 'number' }
];

/* ۳. حفظ سازگاری عقب‌رو (Backward Compatibility) برای رندر جداول قدیمی */
const salesSchema = [...salesHeaderSchema, ...salesLineItemSchema];

/* ۴. اسکیما تعاملات
   توجه: به ترازِ توپ‌لِوِل (سراسری) منتقل شد تا مثل سایر اسکیماها در دسترس همه فایل‌ها باشد. */
const interactionsSchema = [
  { name: 'uid', label: 'شناسه یکتا', type: 'text', auto: 'uuid' },
  { name: 'RecordedAtISO', label: 'زمان ثبت (ISO)', type: 'text', auto: 'iso' },
  { name: 'Date', label: 'تاریخ', type: 'date', auto: 'date' },
  { name: 'Time', label: 'زمان', type: 'time', auto: 'time' },
  { name: 'ProductID', label: 'کد محصول', type: 'text', required: true },
  { name: 'CustomerID', label: 'شناسه مشتری', type: 'text' },
  { name: 'StaffID', label: 'کد پرسنل', type: 'text' },
  { name: 'SessionType', label: 'نوع جلسه', type: 'select', options: ['', 'بازدید اولیه', 'مشاوره', 'پیگیری', 'مقایسه محصول', 'پشتیبانی', 'شکایت', 'درخواست قیمت', 'مذاکره خرید', 'پس از خرید', 'سایر'] },
  { name: 'VisitSource', label: 'منبع بازدید', type: 'select', options: ['حضوری', 'وب‌سایت', 'اپلیکیشن', 'اینستاگرام', 'تلگرام', 'واتساپ', 'گوگل', 'تبلیغات آنلاین', 'پیامک', 'ایمیل', 'تماس تلفنی', 'مراجعه حضوری', 'معرفی دوستان', 'مشتری قبلی', 'سایر'] },
  { name: 'View', label: 'مشاهده', type: 'number' },
  { name: 'Touch', label: 'لمس', type: 'number' },
  { name: 'Ask', label: 'پرسش', type: 'number' },
  { name: 'Pause', label: 'مکث', type: 'number' },
  { name: 'Like', label: 'لایک', type: 'number' },
  { name: 'Save', label: 'ذخیره', type: 'number' },
  { name: 'Comment', label: 'نظر', type: 'number' },
  { name: 'Message', label: 'پیام', type: 'number' },
  { name: 'EngagementScore', label: 'امتیاز تعامل', type: 'number' },
  { name: 'PurchaseIntentScore', label: 'امتیاز قصد خرید', type: 'number' },
  { name: 'Notes', label: 'یادداشت', type: 'textarea' }
];

/* ۵. اسکیما انبار */
const inventorySchema = [
  { name: 'uid', label: 'شناسه یکتا', type: 'text', auto: 'uuid' },
  { name: 'RecordedAtISO', label: 'زمان ثبت (ISO)', type: 'text', auto: 'iso' },
  { name: 'ProductID', label: 'کد محصول', type: 'text', required: true },
  { name: 'Name', label: 'نام محصول', type: 'text', required: true },
  { name: 'Category', label: 'دسته‌بندی', type: 'select', options: ['', 'لوازم الکترونیکی', 'لوازم خانگی', 'پوشاک', 'مواد غذایی', 'سایر'] },
  { name: 'SubCategory', label: 'زیردسته', type: 'select', options: ['', 'عمومی', 'ویژه', 'اقتصادی', 'لوکس', 'سایر'] },
  { name: 'Supplier', label: 'تأمین‌کننده', type: 'select', options: ['', 'داخلی', 'خارجی', 'مستقیم', 'واسطه', 'سایر'] },
  { name: 'ShelfLocation', label: 'محل قفسه', type: 'select', options: ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
  { name: 'BuyPrice', label: 'قیمت خرید', type: 'number', required: true },
  { name: 'ProfitPercent', label: 'درصد سود', type: 'number' },
  { name: 'SellPrice', label: 'قیمت فروش', type: 'number', required: true },
  { name: 'MinStock', label: 'حداقل موجودی', type: 'number' },
  { name: 'OpeningStock', label: 'موجودی اولیه', type: 'number', required: true },
  { name: 'MaxDiscountPercent', label: 'حداکثر درصد تخفیف', type: 'number' },
  { name: 'SpecialDiscountPercent', label: 'درصد تخفیف ویژه', type: 'number' },
  { name: 'Condition', label: 'وضعیت', type: 'select', options: ['', 'نو', 'در حد نو', 'کارکرده', 'نیازمند تعمیر', 'سایر'] },
  { name: 'HasAccessories', label: 'لوازم جانبی دارد', type: 'select', options: ['', 'بله', 'خیر'] },
  { name: 'RepairAccepted', label: 'تعمیر پذیرفته می‌شود', type: 'select', options: ['', 'بله', 'خیر'] },
  { name: 'Active', label: 'فعال', type: 'select', options: ['', 'بله', 'خیر'] },
  { name: 'ReturnWindowHours', label: 'ساعت بازگشت', type: 'number' },
  { name: 'DefectiveQty', label: 'تعداد معیوب', type: 'number' },
  { name: 'CreatedDate', label: 'تاریخ ایجاد', type: 'date', auto: 'date' },
  { name: 'CreatedTime', label: 'زمان ایجاد', type: 'time', auto: 'time' },
  { name: 'Notes', label: 'یادداشت', type: 'textarea' }
];

/* ۶. رفرش جداول بر اساس تب فعال (بدون تغییر منطق) */
function refreshTableForTab(tabKey) {
  switch (tabKey) {
    case 'sales':
      renderTable(
        salesData,
        salesSchema,
        'salesTableContainer',
        'salesPagination',
        'sales'
      );
      break;

    case 'interactions':
      renderEditableInteractionsTable();
      break;

    case 'inventory':
      renderTable(
        inventoryData,
        inventorySchema,
        'inventoryTableContainer',
        'inventoryPagination',
        'inventory'
      );
      break;
  }
}
