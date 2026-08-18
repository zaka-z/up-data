   //01
   // آرایه‌های اصلی ذخیره‌سازی داده‌های استخراج شده از CSV
    const salesData = [];
    const interactionsData = [];
    const inventoryData = [];
    
    // هندلرهای دسترسی به فایل‌های محلی (File System Access API)
    let salesFileHandle = { handle: null };
    let interactionsFileHandle = { handle: null };
    let inventoryFileHandle = { handle: null };
    
    // سیستم ثبت لاگ رویدادها
    const logs = [];
    const MAX_LOG_ENTRIES = 500; // تعریف به صورت عدد برای مقایسه‌های ریاضی عددی

    // وضعیت صفحه‌بندی جداول نمایش داده‌ها
    const pageSize = 50;
    const paginationState = {
      sales: { page: 1 },
      interactions: { page: 1 },
      inventory: { page: 1 }
    };

    // مدیریت وضعیت ثبت‌نشده داده‌ها (تغییرات ذخیره‌نشده)
    const dirtyState = {
      sales: false,
      interactions: false,
      inventory: false
    };

    // عناوین فارسی زبان تب‌ها برای نمایش در پیام‌ها و خطاها
    const tabNames = {
      sales: 'فروش',
      interactions: 'تعاملات',
      inventory: 'انبار'
    };

    // نام‌های پیش‌فرض فایل‌های خروجی CSV
    const defaultFileNames = {
      sales: 'sales.csv',
      interactions: 'interactions.csv',
      inventory: 'inventory.csv'
    };

    // کش ایندکس محصولات انبار جهت دسترسی سریع O(1) بر اساس کد محصول (ProductID)
    // برای استفاده در محاسبات سود ناخالص و اعتبارسنجی فرآیند تعویض کالا
    let inventoryProductMap = new Map();

