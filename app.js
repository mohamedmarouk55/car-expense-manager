// إدارة مصروفات السيارات - RASHID INDUSTRIAL CO.
// الملف الرئيسي للتطبيق
//
// مصمم ومطور البرنامج: محمد مبروك عطية
// Designed & Developed by: Mohamed Mabrouk Attia
// جميع الحقوق محفوظة © 2024

// المتغيرات العامة
let currentChart = null;
const DEFAULT_PASSWORD = '1234';

// البيانات المحلية
const AppData = {
    // بيانات الخزينة
    treasury: {
        balance: 0,
        transactions: []
    },
    
    // بيانات الموظفين
    employees: [],
    
    // بيانات السيارات
    cars: [],
    
    // بيانات المصروفات
    expenses: [],
    
    // إعدادات التطبيق
    settings: {
        currency: 'ريال',
        lastLogin: null
    }
};

// تحميل البيانات من localStorage
function loadData() {
    try {
        const savedData = localStorage.getItem('carExpenseApp');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            Object.assign(AppData, parsedData);
        }
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
    }
}

// تحميل البيانات المحلية (للاستخدام مع Supabase)
function loadLocalData() {
    loadData();
    updateDashboardStats();
    updateCarStats();
    updateEmployeeStats();
    updateExpenseListStats();
    updateTreasuryStats();
    updateTodayStats();
}

// تهيئة التطبيق
function initializeApp() {
    // تحديث العرض
    updateDashboardStats();
    updateCarStats();
    updateEmployeeStats();
    updateExpenseListStats();
    updateTreasuryStats();
    updateTodayStats();

    // إعداد event listeners إضافية إذا لزم الأمر
    console.log('✅ تم تهيئة التطبيق');
}

// حفظ البيانات في localStorage
function saveData() {
    try {
        // ضغط البيانات لتوفير المساحة
        const compressedData = JSON.stringify(AppData);
        localStorage.setItem('carExpenseApp', compressedData);

        // حفظ نسخة احتياطية إضافية
        localStorage.setItem('carExpenseApp_backup', compressedData);

        // عرض حجم البيانات المحفوظة
        const dataSize = (compressedData.length / 1024).toFixed(2);
        console.log(`تم حفظ البيانات - الحجم: ${dataSize} كيلوبايت`);

    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);

        // محاولة حفظ بدون المرفقات في حالة امتلاء التخزين
        if (error.name === 'QuotaExceededError') {
            showErrorMessage('مساحة التخزين ممتلئة. يُنصح بحذف بعض المرفقات أو إنشاء نسخة احتياطية.');

            // حفظ البيانات بدون المرفقات كحل طارئ
            const dataWithoutAttachments = {
                ...AppData,
                expenses: AppData.expenses.map(expense => ({
                    ...expense,
                    attachment: expense.attachment ? { name: expense.attachment.name, hasAttachment: true } : null
                }))
            };

            try {
                localStorage.setItem('carExpenseApp_emergency', JSON.stringify(dataWithoutAttachments));
                showInfoMessage('تم حفظ البيانات الأساسية بدون المرفقات');
            } catch (emergencyError) {
                showErrorMessage('فشل في حفظ البيانات. يرجى إنشاء نسخة احتياطية فوراً.');
            }
        } else {
            showErrorMessage('حدث خطأ في حفظ البيانات');
        }
    }
}

// تهيئة التطبيق
function initApp() {
    loadData();
    
    // إعداد نموذج تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
    
    // إعداد أحداث الصفحات
    setupPageEvents();
    
    // عرض صفحة الدخول
    showLoginScreen();
}

// معالجة تسجيل الدخول
function handleLogin(event) {
    event.preventDefault();

    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput.value.trim();
    const submitButton = event.target.querySelector('button[type="submit"]');

    // تعطيل الزر أثناء المعالجة
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i>جاري التحقق...';

    // محاكاة تأخير للتحقق
    setTimeout(() => {
        if (password === DEFAULT_PASSWORD) {
            // حفظ حالة تسجيل الدخول
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('loginTime', new Date().toISOString());
            AppData.settings.lastLogin = new Date().toISOString();
            saveData();

            // إظهار رسالة نجاح
            showSuccessMessage('تم تسجيل الدخول بنجاح!');

            setTimeout(() => {
                hideLoginScreen();
                showMainApp();
                initializeApp();
            }, 1000);
        } else {
            // إظهار رسالة خطأ
            showErrorMessage('كلمة المرور غير صحيحة');
            passwordInput.value = '';
            passwordInput.focus();

            // إعادة تفعيل الزر
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-sign-in-alt ml-2"></i>دخول';
        }
    }, 1500);
}

// عرض شاشة الدخول
function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');

    if (loginScreen) {
        loginScreen.style.display = 'flex';
        loginScreen.classList.remove('hidden');
    }
    if (mainApp) {
        mainApp.style.display = 'none';
        mainApp.classList.add('hidden');
    }

    // التركيز على حقل كلمة المرور إذا كان موجوداً
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        setTimeout(() => passwordInput.focus(), 100);
    }
}

// إخفاء شاشة الدخول
function hideLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
        loginScreen.style.display = 'none';
        loginScreen.classList.add('hidden');
    }
}

// عرض التطبيق الرئيسي
function showMainApp() {
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'block';
        mainApp.classList.remove('hidden');
    }
}

// عرض التطبيق الرئيسي
function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');

    // بدء تحديث الوقت والتاريخ
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // عرض صفحة الرسوم البيانية كصفحة افتراضية
    showPage('charts');
}

// تحديث الوقت والتاريخ
function updateDateTime() {
    const now = new Date();

    // تنسيق الوقت
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const timeString = now.toLocaleTimeString('ar-SA', timeOptions);

    // تنسيق التاريخ
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const dateString = now.toLocaleDateString('ar-SA', dateOptions);

    // تحديث العناصر
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');

    if (timeElement) timeElement.textContent = timeString;
    if (dateElement) dateElement.textContent = dateString;
}

// تسجيل الخروج
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        // حذف حالة تسجيل الدخول
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('loginTime');

        // إخفاء التطبيق وعرض شاشة الدخول
        showLoginScreen();

        showInfoMessage('تم تسجيل الخروج بنجاح');
    }
}

// عرض الإعدادات
function showSettings() {
    const modal = createModal('الإعدادات', `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الحالية</label>
                <input type="password" id="currentPassword" class="form-input" placeholder="أدخل كلمة المرور الحالية">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الجديدة</label>
                <input type="password" id="newPassword" class="form-input" placeholder="أدخل كلمة المرور الجديدة">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">تأكيد كلمة المرور الجديدة</label>
                <input type="password" id="confirmPassword" class="form-input" placeholder="أعد إدخال كلمة المرور الجديدة">
            </div>

            <div class="border-t pt-4">
                <h4 class="font-medium text-gray-700 mb-2">إعدادات أخرى</h4>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="checkbox" id="autoSave" class="ml-2" checked>
                        <span class="text-sm">حفظ تلقائي للبيانات</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="showNotifications" class="ml-2" checked>
                        <span class="text-sm">إظهار الإشعارات</span>
                    </label>
                </div>
            </div>
        </div>
    `, [
        {
            text: 'حفظ التغييرات',
            class: 'btn-primary',
            onclick: 'saveSettings()'
        },
        {
            text: 'إلغاء',
            class: 'btn-secondary',
            onclick: 'closeModal()'
        }
    ]);

    document.body.appendChild(modal);
}

// حفظ الإعدادات
function saveSettings() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword && newPassword !== confirmPassword) {
        showErrorMessage('كلمة المرور الجديدة غير متطابقة');
        return;
    }

    if (newPassword && currentPassword !== DEFAULT_PASSWORD) {
        showErrorMessage('كلمة المرور الحالية غير صحيحة');
        return;
    }

    if (newPassword) {
        // تحديث كلمة المرور (في تطبيق حقيقي يجب تشفيرها)
        AppData.settings.password = newPassword;
        showSuccessMessage('تم تحديث كلمة المرور بنجاح');
    }

    // حفظ الإعدادات الأخرى
    AppData.settings.autoSave = document.getElementById('autoSave').checked;
    AppData.settings.showNotifications = document.getElementById('showNotifications').checked;

    saveData();
    closeModal();
    showSuccessMessage('تم حفظ الإعدادات بنجاح');
}

// عرض صفحة معينة
function showPage(pageName) {
    // إخفاء جميع الصفحات
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.add('hidden'));
    
    // إزالة الفئة النشطة من جميع أزرار التنقل
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(btn => {
        btn.classList.remove('active-nav');
        btn.classList.add('btn-secondary');
    });
    
    // عرض الصفحة المطلوبة
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('fade-in');
    }
    
    // تفعيل زر التنقل المناسب
    const activeNavButton = document.getElementById('nav-' + pageName);
    if (activeNavButton) {
        activeNavButton.classList.add('active-nav');
        activeNavButton.classList.remove('btn-secondary');
    }
    
    // تحديث محتوى الصفحة حسب النوع
    switch (pageName) {
        case 'charts':
            initChartsPage();
            break;
        case 'treasury':
            initTreasuryPage();
            break;
        case 'employees':
            initEmployeesPage();
            break;
        case 'cars':
            initCarsPage();
            break;
        case 'expenses':
            initExpensesPage();
            break;
        case 'expenseList':
            initExpenseListPage();
            break;
        case 'reports':
            initReportsPage();
            break;
        case 'aiAnalysis':
            initAIAnalysisPage();
            break;
    }
}

// إعداد أحداث الصفحات
function setupPageEvents() {
    // سيتم إضافة المزيد من الأحداث لاحقاً
}

// عرض رسالة نسيان كلمة المرور
function showForgotPassword() {
    showInfoMessage('كلمة المرور الافتراضية هي: 1234<br>يمكنك تغييرها من إعدادات التطبيق');
}

// إظهار رسالة نجاح
function showSuccessMessage(message) {
    showToast(message, 'success');
}

// إظهار رسالة خطأ
function showErrorMessage(message) {
    showToast(message, 'error');
}

// إظهار رسالة معلومات
function showInfoMessage(message) {
    showToast(message, 'info');
}

// إظهار Toast notification
function showToast(message, type = 'info') {
    // إنشاء عنصر Toast
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;

    // تحديد الألوان حسب النوع
    let bgColor, textColor, icon;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            icon = 'fas fa-check-circle';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            icon = 'fas fa-exclamation-circle';
            break;
        case 'info':
            bgColor = 'bg-blue-500';
            textColor = 'text-white';
            icon = 'fas fa-info-circle';
            break;
        default:
            bgColor = 'bg-gray-500';
            textColor = 'text-white';
            icon = 'fas fa-bell';
    }

    toast.className += ` ${bgColor} ${textColor}`;
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="${icon} ml-3"></i>
            <div class="flex-1">${message}</div>
            <button onclick="this.parentElement.parentElement.remove()" class="mr-2 hover:opacity-75">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // إظهار Toast
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    // إخفاء Toast تلقائياً بعد 5 ثوان
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, 5000);
}

// إنشاء نافذة منبثقة
function createModal(title, content, buttons = []) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'currentModal';

    const buttonsHtml = buttons.map(btn =>
        `<button class="${btn.class}" onclick="${btn.onclick}">${btn.text}</button>`
    ).join(' ');

    modal.innerHTML = `
        <div class="modal-content">
            <div class="flex justify-between items-center mb-4 pb-4 border-b">
                <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="mb-6">
                ${content}
            </div>

            <div class="flex justify-end space-x-2">
                ${buttonsHtml}
            </div>
        </div>
    `;

    return modal;
}

// إغلاق النافذة المنبثقة
function closeModal() {
    const modal = document.getElementById('currentModal');
    if (modal) {
        modal.remove();
    }
}

// تهيئة صفحة الرسوم البيانية
function initChartsPage() {
    updateDashboardStats();

    // إذا لم يكن هناك مخطط محدد، عرض رسالة عدم وجود بيانات
    const chartSelector = document.getElementById('chartSelector');
    if (!chartSelector.value) {
        showNoDataMessage();
    }
}

// تحديث إحصائيات لوحة التحكم
function updateDashboardStats() {
    // حساب إجمالي المصروفات
    const totalExpenses = AppData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('totalExpensesAmount').textContent = formatCurrency(totalExpenses);

    // عدد السيارات
    document.getElementById('totalCarsCount').textContent = AppData.cars.length;

    // متوسط المصروف الشهري
    const monthlyAvg = AppData.expenses.length > 0 ? totalExpenses / Math.max(1, getUniqueMonths().length) : 0;
    document.getElementById('avgMonthlyExpense').textContent = formatCurrency(monthlyAvg);

    // آخر تحديث
    document.getElementById('lastUpdateTime').textContent = new Date().toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// الحصول على الأشهر الفريدة من المصروفات
function getUniqueMonths() {
    const months = AppData.expenses.map(expense => {
        const date = new Date(expense.date);
        return `${date.getFullYear()}-${date.getMonth()}`;
    });
    return [...new Set(months)];
}

// تنسيق العملة
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount) + ' ريال';
}

// إظهار رسالة عدم وجود بيانات
function showNoDataMessage() {
    const chartCanvas = document.getElementById('mainChart');
    const noDataMessage = document.getElementById('noDataMessage');

    chartCanvas.style.display = 'none';
    noDataMessage.classList.remove('hidden');
}

// إخفاء رسالة عدم وجود بيانات
function hideNoDataMessage() {
    const chartCanvas = document.getElementById('mainChart');
    const noDataMessage = document.getElementById('noDataMessage');

    chartCanvas.style.display = 'block';
    noDataMessage.classList.add('hidden');
}

// تحديث البيانات
function refreshChartData() {
    updateDashboardStats();
    updateChart();
    showSuccessMessage('تم تحديث البيانات بنجاح');
}

// تصدير المخطط
function exportChart() {
    if (!currentChart) {
        showErrorMessage('لا يوجد مخطط لتصديره');
        return;
    }

    const link = document.createElement('a');
    link.download = `chart-${Date.now()}.png`;
    link.href = currentChart.toBase64Image();
    link.click();

    showSuccessMessage('تم تصدير المخطط بنجاح');
}

// تحديث المخطط
function updateChart() {
    const chartType = document.getElementById('chartSelector').value;

    if (!chartType) {
        if (currentChart) {
            currentChart.destroy();
            currentChart = null;
        }
        showNoDataMessage();
        return;
    }

    // تدمير المخطط السابق إن وجد
    if (currentChart) {
        currentChart.destroy();
    }

    hideNoDataMessage();
    const ctx = document.getElementById('mainChart').getContext('2d');

    try {
        switch (chartType) {
            case 'totalExpensesByCarBar':
                createTotalExpensesByCarChart(ctx);
                break;
            case 'expensesByTypeDoughnut':
                createExpensesByTypeChart(ctx);
                break;
            case 'expensesOverTimeLine':
                createExpensesOverTimeChart(ctx);
                break;
            case 'top5ExpensesHorizontalBar':
                createTop5ExpensesChart(ctx);
                break;
            case 'monthlyComparison':
                createMonthlyComparisonChart(ctx);
                break;
            default:
                showNoDataMessage();
        }
    } catch (error) {
        console.error('خطأ في إنشاء المخطط:', error);
        showErrorMessage('حدث خطأ في إنشاء المخطط');
        showNoDataMessage();
    }
}

// إنشاء مخطط إجمالي المصروفات لكل سيارة
function createTotalExpensesByCarChart(ctx) {
    // حساب المصروفات لكل سيارة من البيانات الحقيقية
    const carExpenses = {};

    AppData.expenses.forEach(expense => {
        const carName = expense.carName || 'غير محدد';
        carExpenses[carName] = (carExpenses[carName] || 0) + expense.amount;
    });

    const labels = Object.keys(carExpenses);
    const data = Object.values(carExpenses);

    // إذا لم توجد بيانات، استخدم بيانات تجريبية
    if (labels.length === 0) {
        labels.push('لا توجد بيانات');
        data.push(0);
    }

    // ألوان متدرجة
    const colors = generateColors(labels.length);

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'إجمالي المصروفات (ريال)',
            data: data,
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
        }]
    };

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'إجمالي المصروفات لكل سيارة',
                    font: {
                        size: 18,
                        family: 'Cairo',
                        weight: 'bold'
                    },
                    padding: 20
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// توليد ألوان متدرجة
function generateColors(count) {
    const baseColors = [
        { r: 102, g: 126, b: 234 },
        { r: 118, g: 75, b: 162 },
        { r: 255, g: 99, b: 132 },
        { r: 54, g: 162, b: 235 },
        { r: 255, g: 206, b: 86 },
        { r: 75, g: 192, b: 192 },
        { r: 153, g: 102, b: 255 },
        { r: 255, g: 159, b: 64 }
    ];

    const background = [];
    const border = [];

    for (let i = 0; i < count; i++) {
        const color = baseColors[i % baseColors.length];
        background.push(`rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`);
        border.push(`rgba(${color.r}, ${color.g}, ${color.b}, 1)`);
    }

    return { background, border };
}

// إنشاء مخطط توزيع المصروفات حسب النوع
function createExpensesByTypeChart(ctx) {
    // حساب المصروفات حسب النوع من البيانات الحقيقية
    const typeExpenses = {};

    AppData.expenses.forEach(expense => {
        const type = expense.type || 'أخرى';
        typeExpenses[type] = (typeExpenses[type] || 0) + expense.amount;
    });

    const labels = Object.keys(typeExpenses);
    const data = Object.values(typeExpenses);

    // إذا لم توجد بيانات، استخدم بيانات تجريبية
    if (labels.length === 0) {
        labels.push('وقود', 'صيانة', 'تأمين', 'رسوم', 'أخرى');
        data.push(40, 25, 15, 10, 10);
    }

    const chartData = {
        labels: labels,
        datasets: [{
            data: data,
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40',
                '#C9CBCF',
                '#4BC0C0'
            ].slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#fff',
            hoverBorderWidth: 3,
            hoverBorderColor: '#fff'
        }]
    };

    currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'توزيع المصروفات حسب النوع',
                    font: {
                        size: 18,
                        family: 'Cairo',
                        weight: 'bold'
                    },
                    padding: 20
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            family: 'Cairo'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 1000
            }
        }
    });
}

// إنشاء مخطط المصروفات بمرور الوقت
function createExpensesOverTimeChart(ctx) {
    const data = {
        labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
        datasets: [{
            label: 'المصروفات الشهرية (ريال)',
            data: [1200, 1900, 800, 1500, 2000, 1300],
            borderColor: 'rgba(102, 126, 234, 1)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'المصروفات بمرور الوقت',
                    font: {
                        size: 16,
                        family: 'Cairo'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' ريال';
                        }
                    }
                }
            }
        }
    });
}

// إنشاء مخطط أكبر 5 مصروفات
function createTop5ExpensesChart(ctx) {
    const data = {
        labels: ['صيانة محرك', 'تغيير إطارات', 'تأمين سنوي', 'إصلاح مكيف', 'تغيير زيت'],
        datasets: [{
            label: 'المبلغ (ريال)',
            data: [2500, 1800, 1500, 1200, 800],
            backgroundColor: 'rgba(102, 126, 234, 0.8)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 1
        }]
    };
    
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                title: {
                    display: true,
                    text: 'أكبر 5 مصروفات',
                    font: {
                        size: 16,
                        family: 'Cairo'
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' ريال';
                        }
                    }
                }
            }
        }
    });
}

// إنشاء مخطط المقارنة الشهرية
function createMonthlyComparisonChart(ctx) {
    // تجميع المصروفات حسب الشهر
    const monthlyData = {};

    AppData.expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { name: monthName, amount: 0 };
        }
        monthlyData[monthKey].amount += expense.amount;
    });

    // ترتيب البيانات حسب التاريخ
    const sortedData = Object.keys(monthlyData)
        .sort()
        .slice(-12) // آخر 12 شهر
        .map(key => monthlyData[key]);

    const labels = sortedData.map(item => item.name);
    const data = sortedData.map(item => item.amount);

    // إذا لم توجد بيانات، استخدم بيانات تجريبية
    if (labels.length === 0) {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
        labels.push(...months);
        data.push(1200, 1900, 800, 1500, 2000, 1300);
    }

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'المصروفات الشهرية (ريال)',
            data: data,
            borderColor: 'rgba(102, 126, 234, 1)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgba(102, 126, 234, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
        }]
    };

    currentChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'مقارنة المصروفات الشهرية',
                    font: {
                        size: 18,
                        family: 'Cairo',
                        weight: 'bold'
                    },
                    padding: 20
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `المصروفات: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// تهيئة باقي الصفحات (ستتم إضافتها لاحقاً)
function initTreasuryPage() {
    updateTreasuryStats();
    loadTreasuryTransactions();
    setupTreasuryForm();

    // تعيين التاريخ الحالي كافتراضي
    document.getElementById('treasuryDate').value = new Date().toISOString().split('T')[0];
}

// إعداد نموذج الخزينة
function setupTreasuryForm() {
    const form = document.getElementById('treasuryForm');
    form.addEventListener('submit', handleTreasurySubmit);
}

// معالجة إرسال نموذج الخزينة
function handleTreasurySubmit(event) {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('treasuryAmount').value);
    const source = document.getElementById('treasurySource').value;
    const notes = document.getElementById('treasuryNotes').value;
    const date = document.getElementById('treasuryDate').value;

    if (amount <= 0) {
        showErrorMessage('يجب أن يكون المبلغ أكبر من صفر');
        return;
    }

    // إنشاء معاملة جديدة
    const transaction = {
        id: Date.now().toString(),
        amount: amount,
        source: source,
        notes: notes,
        date: date,
        timestamp: new Date().toISOString(),
        type: 'income'
    };

    // إضافة المعاملة للبيانات
    AppData.treasury.transactions.push(transaction);
    AppData.treasury.balance += amount;

    // حفظ البيانات
    saveData();

    // تحديث الواجهة
    updateTreasuryStats();
    loadTreasuryTransactions();

    // إعادة تعيين النموذج
    document.getElementById('treasuryForm').reset();
    document.getElementById('treasuryDate').value = new Date().toISOString().split('T')[0];

    showSuccessMessage(`تم إضافة مبلغ ${formatCurrency(amount)} بنجاح`);
}

// تحديث إحصائيات الخزينة
function updateTreasuryStats() {
    // حساب إجمالي المستلم
    const totalReceived = AppData.treasury.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    // حساب إجمالي المنصرف (من المصروفات)
    const totalSpent = AppData.expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // الرصيد الحالي
    const currentBalance = totalReceived - totalSpent;

    // تحديث العناصر
    document.getElementById('totalReceived').textContent = formatCurrency(totalReceived);
    document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('currentBalance').textContent = formatCurrency(currentBalance);

    // تحديث التحليل المفصل
    updateDetailedAnalysis(totalReceived, totalSpent, currentBalance);

    // تحديث رصيد الخزينة في البيانات
    AppData.treasury.balance = currentBalance;
}

// تحديث التحليل المفصل
function updateDetailedAnalysis(totalReceived, totalSpent, currentBalance) {
    const incomeTransactions = AppData.treasury.transactions.filter(t => t.type === 'income');
    const expenseCount = AppData.expenses.length;

    // متوسط الإيداع
    const avgDeposit = incomeTransactions.length > 0 ? totalReceived / incomeTransactions.length : 0;
    document.getElementById('avgDeposit').textContent = formatCurrency(avgDeposit);

    // متوسط المصروف
    const avgExpense = expenseCount > 0 ? totalSpent / expenseCount : 0;
    document.getElementById('avgExpense').textContent = formatCurrency(avgExpense);

    // عدد المعاملات
    const totalTransactions = incomeTransactions.length + expenseCount;
    document.getElementById('transactionCount').textContent = totalTransactions;

    // صافي التغيير
    const netChange = totalReceived - totalSpent;
    document.getElementById('netChange').textContent = formatCurrency(netChange);

    // تغيير لون صافي التغيير حسب القيمة
    const netChangeElement = document.getElementById('netChange');
    if (netChange > 0) {
        netChangeElement.className = 'text-lg font-bold text-green-700';
    } else if (netChange < 0) {
        netChangeElement.className = 'text-lg font-bold text-red-700';
    } else {
        netChangeElement.className = 'text-lg font-bold text-gray-700';
    }
}

// تحميل معاملات الخزينة
function loadTreasuryTransactions() {
    const container = document.getElementById('treasuryTransactions');
    const noDataDiv = document.getElementById('noTreasuryData');

    if (AppData.treasury.transactions.length === 0) {
        container.innerHTML = '';
        noDataDiv.classList.remove('hidden');
        return;
    }

    noDataDiv.classList.add('hidden');

    // ترتيب المعاملات حسب التاريخ (الأحدث أولاً)
    const sortedTransactions = [...AppData.treasury.transactions].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    container.innerHTML = sortedTransactions.map(transaction => `
        <div class="bg-gray-50 rounded-lg p-4 border-r-4 border-green-500">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-arrow-down text-green-500 ml-2"></i>
                        <span class="font-semibold text-green-600">${formatCurrency(transaction.amount)}</span>
                        <span class="text-sm text-gray-500 mr-2">من ${transaction.source}</span>
                    </div>

                    <div class="text-sm text-gray-600 mb-1">
                        <i class="fas fa-calendar ml-1"></i>
                        ${formatDate(transaction.date)}
                    </div>

                    ${transaction.notes ? `
                        <div class="text-sm text-gray-600">
                            <i class="fas fa-sticky-note ml-1"></i>
                            ${transaction.notes}
                        </div>
                    ` : ''}
                </div>

                <div class="flex space-x-2">
                    <button onclick="editTreasuryTransaction('${transaction.id}')"
                            class="btn-secondary text-xs p-2" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTreasuryTransaction('${transaction.id}')"
                            class="btn-danger text-xs p-2" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// تعديل معاملة خزينة
function editTreasuryTransaction(transactionId) {
    const transaction = AppData.treasury.transactions.find(t => t.id === transactionId);
    if (!transaction) {
        showErrorMessage('لم يتم العثور على المعاملة');
        return;
    }

    // ملء النموذج بالبيانات الحالية
    document.getElementById('treasuryAmount').value = transaction.amount;
    document.getElementById('treasurySource').value = transaction.source;
    document.getElementById('treasuryNotes').value = transaction.notes || '';
    document.getElementById('treasuryDate').value = transaction.date;

    // حذف المعاملة القديمة
    deleteTreasuryTransaction(transactionId, false);

    showInfoMessage('تم تحميل بيانات المعاملة للتعديل');
}

// حذف معاملة خزينة
function deleteTreasuryTransaction(transactionId, showConfirm = true) {
    if (showConfirm && !confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
        return;
    }

    const transactionIndex = AppData.treasury.transactions.findIndex(t => t.id === transactionId);
    if (transactionIndex === -1) {
        showErrorMessage('لم يتم العثور على المعاملة');
        return;
    }

    const transaction = AppData.treasury.transactions[transactionIndex];

    // إزالة المعاملة من البيانات
    AppData.treasury.transactions.splice(transactionIndex, 1);

    // تحديث الرصيد
    AppData.treasury.balance -= transaction.amount;

    // حفظ البيانات
    saveData();

    // تحديث الواجهة
    updateTreasuryStats();
    loadTreasuryTransactions();

    if (showConfirm) {
        showSuccessMessage('تم حذف المعاملة بنجاح');
    }
}

// تصدير بيانات الخزينة
function exportTreasuryData() {
    if (AppData.treasury.transactions.length === 0) {
        showErrorMessage('لا توجد بيانات للتصدير');
        return;
    }

    // إعداد البيانات للتصدير
    const exportData = AppData.treasury.transactions.map(transaction => ({
        'التاريخ': formatDate(transaction.date),
        'المبلغ': transaction.amount,
        'المصدر': transaction.source,
        'الملاحظات': transaction.notes || '',
        'وقت الإدخال': new Date(transaction.timestamp).toLocaleString('ar-SA')
    }));

    // إنشاء ملف Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'معاملات الخزينة');

    // تحميل الملف
    XLSX.writeFile(wb, `treasury-transactions-${new Date().toISOString().split('T')[0]}.xlsx`);

    showSuccessMessage('تم تصدير بيانات الخزينة بنجاح');
}

function initEmployeesPage() {
    updateEmployeeStats();
    loadEmployeesTable();
    setupEmployeeForm();

    // تعيين التاريخ الحالي كافتراضي
    document.getElementById('employeeHireDate').value = new Date().toISOString().split('T')[0];
}

// إعداد نموذج الموظفين
function setupEmployeeForm() {
    const form = document.getElementById('employeeForm');
    form.addEventListener('submit', handleEmployeeSubmit);
}

// معالجة إرسال نموذج الموظف
function handleEmployeeSubmit(event) {
    event.preventDefault();

    const employeeData = {
        id: Date.now().toString(),
        code: document.getElementById('employeeCode').value.trim(),
        name: document.getElementById('employeeName').value.trim(),
        job: document.getElementById('employeeJob').value,
        region: document.getElementById('employeeRegion').value,
        phone: document.getElementById('employeePhone').value.trim(),
        email: document.getElementById('employeeEmail').value.trim(),
        hireDate: document.getElementById('employeeHireDate').value,
        salary: parseFloat(document.getElementById('employeeSalary').value) || 0,
        notes: document.getElementById('employeeNotes').value.trim(),
        createdAt: new Date().toISOString()
    };

    // التحقق من عدم تكرار الكود
    if (AppData.employees.some(emp => emp.code === employeeData.code)) {
        showErrorMessage('كود الموظف موجود مسبقاً');
        return;
    }

    // إضافة الموظف للبيانات
    AppData.employees.push(employeeData);

    // حفظ البيانات
    saveData();

    // تحديث الواجهة
    updateEmployeeStats();
    loadEmployeesTable();

    // إعادة تعيين النموذج
    resetEmployeeForm();

    showSuccessMessage(`تم إضافة الموظف ${employeeData.name} بنجاح`);
}

// إعادة تعيين نموذج الموظف
function resetEmployeeForm() {
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeHireDate').value = new Date().toISOString().split('T')[0];
}

// تحديث إحصائيات الموظفين
function updateEmployeeStats() {
    const totalEmployees = AppData.employees.length;
    const totalSalaries = AppData.employees.reduce((sum, emp) => sum + emp.salary, 0);
    const avgSalary = totalEmployees > 0 ? totalSalaries / totalEmployees : 0;

    document.getElementById('totalEmployees').textContent = totalEmployees;
    document.getElementById('totalSalaries').textContent = formatCurrency(totalSalaries);
    document.getElementById('avgSalary').textContent = formatCurrency(avgSalary);

    // أحدث موظف
    if (totalEmployees > 0) {
        const latestEmployee = AppData.employees.reduce((latest, emp) =>
            new Date(emp.createdAt) > new Date(latest.createdAt) ? emp : latest
        );
        document.getElementById('latestEmployee').textContent = latestEmployee.name;
    } else {
        document.getElementById('latestEmployee').textContent = '-';
    }
}

// تحميل جدول الموظفين
function loadEmployeesTable() {
    const tbody = document.getElementById('employeesTableBody');
    const noDataDiv = document.getElementById('noEmployeesData');

    if (AppData.employees.length === 0) {
        tbody.innerHTML = '';
        noDataDiv.classList.remove('hidden');
        return;
    }

    noDataDiv.classList.add('hidden');

    tbody.innerHTML = AppData.employees.map(employee => `
        <tr>
            <td>${employee.code}</td>
            <td>${employee.name}</td>
            <td>${employee.job}</td>
            <td>${employee.region}</td>
            <td>${employee.phone || '-'}</td>
            <td>${formatCurrency(employee.salary)}</td>
            <td>${formatDate(employee.hireDate)}</td>
            <td>
                <div class="flex space-x-2">
                    <button onclick="editEmployee('${employee.id}')"
                            class="btn-secondary text-xs p-2" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteEmployee('${employee.id}')"
                            class="btn-danger text-xs p-2" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="viewEmployeeDetails('${employee.id}')"
                            class="btn-primary text-xs p-2" title="التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// تعديل موظف
function editEmployee(employeeId) {
    const employee = AppData.employees.find(emp => emp.id === employeeId);
    if (!employee) {
        showErrorMessage('لم يتم العثور على الموظف');
        return;
    }

    // ملء النموذج بالبيانات الحالية
    document.getElementById('employeeCode').value = employee.code;
    document.getElementById('employeeName').value = employee.name;
    document.getElementById('employeeJob').value = employee.job;
    document.getElementById('employeeRegion').value = employee.region;
    document.getElementById('employeePhone').value = employee.phone || '';
    document.getElementById('employeeEmail').value = employee.email || '';
    document.getElementById('employeeHireDate').value = employee.hireDate;
    document.getElementById('employeeSalary').value = employee.salary;
    document.getElementById('employeeNotes').value = employee.notes || '';

    // حذف الموظف القديم
    deleteEmployee(employeeId, false);

    showInfoMessage('تم تحميل بيانات الموظف للتعديل');
}

// حذف موظف
function deleteEmployee(employeeId, showConfirm = true) {
    if (showConfirm && !confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
        return;
    }

    const employeeIndex = AppData.employees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex === -1) {
        showErrorMessage('لم يتم العثور على الموظف');
        return;
    }

    const employee = AppData.employees[employeeIndex];

    // إزالة الموظف من البيانات
    AppData.employees.splice(employeeIndex, 1);

    // حفظ البيانات
    saveData();

    // تحديث الواجهة
    updateEmployeeStats();
    loadEmployeesTable();

    if (showConfirm) {
        showSuccessMessage(`تم حذف الموظف ${employee.name} بنجاح`);
    }
}

// عرض تفاصيل الموظف
function viewEmployeeDetails(employeeId) {
    const employee = AppData.employees.find(emp => emp.id === employeeId);
    if (!employee) {
        showErrorMessage('لم يتم العثور على الموظف');
        return;
    }

    const modal = createModal(`تفاصيل الموظف: ${employee.name}`, `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">الكود</label>
                    <p class="text-gray-900">${employee.code}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">الاسم</label>
                    <p class="text-gray-900">${employee.name}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">الوظيفة</label>
                    <p class="text-gray-900">${employee.job}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">المنطقة</label>
                    <p class="text-gray-900">${employee.region}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">الهاتف</label>
                    <p class="text-gray-900">${employee.phone || 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                    <p class="text-gray-900">${employee.email || 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">تاريخ التوظيف</label>
                    <p class="text-gray-900">${formatDate(employee.hireDate)}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">الراتب</label>
                    <p class="text-gray-900">${formatCurrency(employee.salary)}</p>
                </div>
            </div>
            ${employee.notes ? `
                <div>
                    <label class="block text-sm font-medium text-gray-700">الملاحظات</label>
                    <p class="text-gray-900">${employee.notes}</p>
                </div>
            ` : ''}
            <div>
                <label class="block text-sm font-medium text-gray-700">تاريخ الإضافة</label>
                <p class="text-gray-900">${new Date(employee.createdAt).toLocaleString('ar-SA')}</p>
            </div>
        </div>
    `, [
        {
            text: 'إغلاق',
            class: 'btn-secondary',
            onclick: 'closeModal()'
        }
    ]);

    document.body.appendChild(modal);
}

// تصفية الموظفين
function filterEmployees() {
    const searchTerm = document.getElementById('employeeSearch').value.toLowerCase();
    const jobFilter = document.getElementById('employeeFilterJob').value;

    const filteredEmployees = AppData.employees.filter(employee => {
        const matchesSearch = !searchTerm ||
            employee.name.toLowerCase().includes(searchTerm) ||
            employee.code.toLowerCase().includes(searchTerm) ||
            employee.region.toLowerCase().includes(searchTerm);

        const matchesJob = !jobFilter || employee.job === jobFilter;

        return matchesSearch && matchesJob;
    });

    // تحديث الجدول بالنتائج المصفاة
    const tbody = document.getElementById('employeesTableBody');
    const noDataDiv = document.getElementById('noEmployeesData');

    if (filteredEmployees.length === 0) {
        tbody.innerHTML = '';
        noDataDiv.classList.remove('hidden');
        return;
    }

    noDataDiv.classList.add('hidden');

    tbody.innerHTML = filteredEmployees.map(employee => `
        <tr>
            <td>${employee.code}</td>
            <td>${employee.name}</td>
            <td>${employee.job}</td>
            <td>${employee.region}</td>
            <td>${employee.phone || '-'}</td>
            <td>${formatCurrency(employee.salary)}</td>
            <td>${formatDate(employee.hireDate)}</td>
            <td>
                <div class="flex space-x-2">
                    <button onclick="editEmployee('${employee.id}')"
                            class="btn-secondary text-xs p-2" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteEmployee('${employee.id}')"
                            class="btn-danger text-xs p-2" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="viewEmployeeDetails('${employee.id}')"
                            class="btn-primary text-xs p-2" title="التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// تصدير الموظفين إلى Excel
function exportEmployees() {
    if (AppData.employees.length === 0) {
        showErrorMessage('لا يوجد موظفين للتصدير');
        return;
    }

    // إعداد البيانات للتصدير
    const exportData = AppData.employees.map(employee => ({
        'كود الموظف': employee.code,
        'الاسم': employee.name,
        'الوظيفة': employee.job,
        'المنطقة': employee.region,
        'رقم الهاتف': employee.phone || '',
        'البريد الإلكتروني': employee.email || '',
        'تاريخ التوظيف': employee.hireDate,
        'الراتب': employee.salary,
        'الملاحظات': employee.notes || '',
        'تاريخ الإضافة': new Date(employee.createdAt).toLocaleDateString('ar-SA')
    }));

    // إنشاء ملف Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الموظفين');

    // تحميل الملف
    XLSX.writeFile(wb, `employees-${new Date().toISOString().split('T')[0]}.xlsx`);

    showSuccessMessage('تم تصدير بيانات الموظفين بنجاح');
}

// استيراد الموظفين من Excel
function importEmployees(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                showErrorMessage('الملف فارغ أو لا يحتوي على بيانات صالحة');
                return;
            }

            let importedCount = 0;
            let skippedCount = 0;

            jsonData.forEach(row => {
                // التحقق من الحقول المطلوبة
                const code = row['كود الموظف'] || row['code'] || '';
                const name = row['الاسم'] || row['name'] || '';
                const job = row['الوظيفة'] || row['job'] || '';
                const region = row['المنطقة'] || row['region'] || '';

                if (!code || !name || !job || !region) {
                    skippedCount++;
                    return;
                }

                // التحقق من عدم تكرار الكود
                if (AppData.employees.some(emp => emp.code === code)) {
                    skippedCount++;
                    return;
                }

                const employee = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    code: code,
                    name: name,
                    job: job,
                    region: region,
                    phone: row['رقم الهاتف'] || row['phone'] || '',
                    email: row['البريد الإلكتروني'] || row['email'] || '',
                    hireDate: row['تاريخ التوظيف'] || row['hireDate'] || new Date().toISOString().split('T')[0],
                    salary: parseFloat(row['الراتب'] || row['salary'] || 0),
                    notes: row['الملاحظات'] || row['notes'] || '',
                    createdAt: new Date().toISOString()
                };

                AppData.employees.push(employee);
                importedCount++;
            });

            // حفظ البيانات
            saveData();

            // تحديث الواجهة
            updateEmployeeStats();
            loadEmployeesTable();

            // إعادة تعيين input الملف
            event.target.value = '';

            showSuccessMessage(`تم استيراد ${importedCount} موظف بنجاح${skippedCount > 0 ? ` (تم تخطي ${skippedCount} سجل)` : ''}`);

        } catch (error) {
            console.error('خطأ في استيراد الملف:', error);
            showErrorMessage('حدث خطأ في قراءة الملف. تأكد من أن الملف بصيغة Excel صحيحة');
        }
    };

    reader.readAsArrayBuffer(file);
}

// حذف جميع الموظفين
function clearAllEmployees() {
    if (AppData.employees.length === 0) {
        showErrorMessage('لا يوجد موظفين للحذف');
        return;
    }

    if (!confirm('هل أنت متأكد من حذف جميع الموظفين؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        return;
    }

    const count = AppData.employees.length;
    AppData.employees = [];

    // حفظ البيانات
    saveData();

    // تحديث الواجهة
    updateEmployeeStats();
    loadEmployeesTable();

    showSuccessMessage(`تم حذف ${count} موظف بنجاح`);
}

function initCarsPage() {
    updateCarStats();
    loadCarsTable();
    setupCarForm();
    populateYearOptions();
    populateDriverOptions();
    checkCarAlerts();
}

// إعداد نموذج السيارات
function setupCarForm() {
    const form = document.getElementById('carForm');
    form.addEventListener('submit', handleCarSubmit);
}

// ملء خيارات السنوات
function populateYearOptions() {
    const yearSelect = document.getElementById('carYear');
    const currentYear = new Date().getFullYear();

    yearSelect.innerHTML = '<option value="">اختر السنة...</option>';

    for (let year = currentYear; year >= 1990; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

// ملء خيارات السائقين من قائمة الموظفين
function populateDriverOptions() {
    const driverSelect = document.getElementById('carDriver');
    driverSelect.innerHTML = '<option value="">اختر السائق...</option>';

    const drivers = AppData.employees.filter(emp => emp.job === 'سائق');
    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.name;
        option.textContent = `${driver.name} (${driver.code})`;
        driverSelect.appendChild(option);
    });
}

// التعبئة التلقائية لبيانات السيارة
function autoFillCarData() {
    const plateNumber = document.getElementById('carPlateNumber').value.trim();
    if (!plateNumber) return;

    // البحث عن السيارة في البيانات الموجودة
    const existingCar = AppData.cars.find(car => car.plateNumber === plateNumber);

    if (existingCar) {
        // ملء البيانات الموجودة
        document.getElementById('carName').value = existingCar.name;
        document.getElementById('carBrand').value = existingCar.brand;
        document.getElementById('carYear').value = existingCar.year;
        document.getElementById('carType').value = existingCar.type;
        document.getElementById('carOwner').value = existingCar.owner;
        document.getElementById('carDriver').value = existingCar.driver || '';
        document.getElementById('carColor').value = existingCar.color || '';
        document.getElementById('carChassisNumber').value = existingCar.chassisNumber || '';
        document.getElementById('carEngineNumber').value = existingCar.engineNumber || '';
        document.getElementById('carInsuranceExpiry').value = existingCar.insuranceExpiry || '';
        document.getElementById('carRegistrationExpiry').value = existingCar.registrationExpiry || '';
        document.getElementById('carLastInspection').value = existingCar.lastInspection || '';
        document.getElementById('carMileage').value = existingCar.mileage || '';
        document.getElementById('carNotes').value = existingCar.notes || '';

        showInfoMessage('تم تحميل بيانات السيارة الموجودة');
    }
}

// معالجة إرسال نموذج السيارة
function handleCarSubmit(event) {
    event.preventDefault();

    const carData = {
        id: Date.now().toString(),
        plateNumber: document.getElementById('carPlateNumber').value.trim(),
        name: document.getElementById('carName').value.trim(),
        brand: document.getElementById('carBrand').value,
        year: document.getElementById('carYear').value,
        type: document.getElementById('carType').value,
        owner: document.getElementById('carOwner').value.trim(),
        driver: document.getElementById('carDriver').value,
        color: document.getElementById('carColor').value,
        chassisNumber: document.getElementById('carChassisNumber').value.trim(),
        engineNumber: document.getElementById('carEngineNumber').value.trim(),
        insuranceExpiry: document.getElementById('carInsuranceExpiry').value,
        registrationExpiry: document.getElementById('carRegistrationExpiry').value,
        lastInspection: document.getElementById('carLastInspection').value,
        mileage: parseInt(document.getElementById('carMileage').value) || 0,
        notes: document.getElementById('carNotes').value.trim(),
        createdAt: new Date().toISOString()
    };

    // التحقق من عدم تكرار لوحة الأرقام
    const existingCarIndex = AppData.cars.findIndex(car => car.plateNumber === carData.plateNumber);

    if (existingCarIndex !== -1) {
        // تحديث السيارة الموجودة
        AppData.cars[existingCarIndex] = { ...AppData.cars[existingCarIndex], ...carData };
        showSuccessMessage(`تم تحديث بيانات السيارة ${carData.plateNumber} بنجاح`);
    } else {
        // إضافة سيارة جديدة
        AppData.cars.push(carData);
        showSuccessMessage(`تم إضافة السيارة ${carData.plateNumber} بنجاح`);
    }

    // حفظ البيانات
    saveData();

    // تحديث الواجهة
    updateCarStats();
    loadCarsTable();
    populateDriverOptions();
    checkCarAlerts();

    // إعادة تعيين النموذج
    resetCarForm();
}

// إعادة تعيين نموذج السيارة
function resetCarForm() {
    document.getElementById('carForm').reset();
}

// تحديث إحصائيات السيارات
function updateCarStats() {
    const totalCars = AppData.cars.length;
    const today = new Date();

    // حساب التأمين الساري والمنتهي
    let validInsurance = 0;
    let expiredInsurance = 0;

    AppData.cars.forEach(car => {
        if (car.insuranceExpiry) {
            const expiryDate = new Date(car.insuranceExpiry);
            if (expiryDate >= today) {
                validInsurance++;
            } else {
                expiredInsurance++;
            }
        }
    });

    document.getElementById('totalCars').textContent = totalCars;
    document.getElementById('validInsurance').textContent = validInsurance;
    document.getElementById('expiredInsurance').textContent = expiredInsurance;

    // أحدث سيارة
    if (totalCars > 0) {
        const latestCar = AppData.cars.reduce((latest, car) =>
            new Date(car.createdAt) > new Date(latest.createdAt) ? car : latest
        );
        document.getElementById('latestCar').textContent = latestCar.name;
    } else {
        document.getElementById('latestCar').textContent = '-';
    }
}

// تحميل جدول السيارات
function loadCarsTable() {
    const tbody = document.getElementById('carsTableBody');
    const noDataDiv = document.getElementById('noCarsData');

    if (AppData.cars.length === 0) {
        tbody.innerHTML = '';
        noDataDiv.classList.remove('hidden');
        return;
    }

    noDataDiv.classList.add('hidden');

    tbody.innerHTML = AppData.cars.map(car => {
        const insuranceStatus = getInsuranceStatus(car.insuranceExpiry);
        return `
            <tr>
                <td>${car.plateNumber}</td>
                <td>${car.name}</td>
                <td>${car.brand}</td>
                <td>${car.year}</td>
                <td>${car.owner}</td>
                <td>${car.driver || '-'}</td>
                <td>
                    <span class="px-2 py-1 rounded text-xs ${insuranceStatus.class}">
                        ${car.insuranceExpiry ? formatDate(car.insuranceExpiry) : 'غير محدد'}
                    </span>
                </td>
                <td>
                    <div class="flex space-x-2">
                        <button onclick="editCar('${car.id}')"
                                class="btn-secondary text-xs p-2" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteCar('${car.id}')"
                                class="btn-danger text-xs p-2" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button onclick="viewCarDetails('${car.id}')"
                                class="btn-primary text-xs p-2" title="التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// الحصول على حالة التأمين
function getInsuranceStatus(insuranceExpiry) {
    if (!insuranceExpiry) {
        return { class: 'bg-gray-100 text-gray-600', status: 'غير محدد' };
    }

    const today = new Date();
    const expiryDate = new Date(insuranceExpiry);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
        return { class: 'bg-red-100 text-red-600', status: 'منتهي' };
    } else if (daysUntilExpiry <= 30) {
        return { class: 'bg-yellow-100 text-yellow-600', status: 'ينتهي قريباً' };
    } else {
        return { class: 'bg-green-100 text-green-600', status: 'ساري' };
    }
}

// فحص التنبيهات
function checkCarAlerts() {
    const alertsContainer = document.getElementById('carAlerts');
    const noAlertsDiv = document.getElementById('noCarAlerts');
    const alerts = [];
    const today = new Date();

    AppData.cars.forEach(car => {
        // فحص انتهاء التأمين
        if (car.insuranceExpiry) {
            const expiryDate = new Date(car.insuranceExpiry);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
                alerts.push({
                    type: 'danger',
                    icon: 'fas fa-exclamation-circle',
                    message: `تأمين السيارة ${car.plateNumber} منتهي منذ ${Math.abs(daysUntilExpiry)} يوم`
                });
            } else if (daysUntilExpiry <= 30) {
                alerts.push({
                    type: 'warning',
                    icon: 'fas fa-exclamation-triangle',
                    message: `تأمين السيارة ${car.plateNumber} ينتهي خلال ${daysUntilExpiry} يوم`
                });
            }
        }

        // فحص انتهاء الاستمارة
        if (car.registrationExpiry) {
            const expiryDate = new Date(car.registrationExpiry);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
                alerts.push({
                    type: 'danger',
                    icon: 'fas fa-exclamation-circle',
                    message: `استمارة السيارة ${car.plateNumber} منتهية منذ ${Math.abs(daysUntilExpiry)} يوم`
                });
            } else if (daysUntilExpiry <= 30) {
                alerts.push({
                    type: 'warning',
                    icon: 'fas fa-exclamation-triangle',
                    message: `استمارة السيارة ${car.plateNumber} تنتهي خلال ${daysUntilExpiry} يوم`
                });
            }
        }
    });

    if (alerts.length === 0) {
        alertsContainer.innerHTML = '';
        noAlertsDiv.classList.remove('hidden');
    } else {
        noAlertsDiv.classList.add('hidden');
        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="flex items-center p-3 rounded-lg ${alert.type === 'danger' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}">
                <i class="${alert.icon} ml-2"></i>
                <span class="text-sm">${alert.message}</span>
            </div>
        `).join('');
    }
}

// تعديل سيارة
function editCar(carId) {
    const car = AppData.cars.find(c => c.id === carId);
    if (!car) {
        showErrorMessage('لم يتم العثور على السيارة');
        return;
    }

    // ملء النموذج بالبيانات الحالية
    document.getElementById('carPlateNumber').value = car.plateNumber;
    document.getElementById('carName').value = car.name;
    document.getElementById('carBrand').value = car.brand;
    document.getElementById('carYear').value = car.year;
    document.getElementById('carType').value = car.type;
    document.getElementById('carOwner').value = car.owner;
    document.getElementById('carDriver').value = car.driver || '';
    document.getElementById('carColor').value = car.color || '';
    document.getElementById('carChassisNumber').value = car.chassisNumber || '';
    document.getElementById('carEngineNumber').value = car.engineNumber || '';
    document.getElementById('carInsuranceExpiry').value = car.insuranceExpiry || '';
    document.getElementById('carRegistrationExpiry').value = car.registrationExpiry || '';
    document.getElementById('carLastInspection').value = car.lastInspection || '';
    document.getElementById('carMileage').value = car.mileage || '';
    document.getElementById('carNotes').value = car.notes || '';

    // حذف السيارة القديمة
    deleteCar(carId, false);

    showInfoMessage('تم تحميل بيانات السيارة للتعديل');
}

// حذف سيارة
function deleteCar(carId, showConfirm = true) {
    if (showConfirm && !confirm('هل أنت متأكد من حذف هذه السيارة؟')) {
        return;
    }

    const carIndex = AppData.cars.findIndex(c => c.id === carId);
    if (carIndex === -1) {
        showErrorMessage('لم يتم العثور على السيارة');
        return;
    }

    const car = AppData.cars[carIndex];

    // إزالة السيارة من البيانات
    AppData.cars.splice(carIndex, 1);

    // حفظ البيانات
    saveData();

    // تحديث الواجهة
    updateCarStats();
    loadCarsTable();
    checkCarAlerts();

    if (showConfirm) {
        showSuccessMessage(`تم حذف السيارة ${car.plateNumber} بنجاح`);
    }
}

// عرض تفاصيل السيارة
function viewCarDetails(carId) {
    const car = AppData.cars.find(c => c.id === carId);
    if (!car) {
        showErrorMessage('لم يتم العثور على السيارة');
        return;
    }

    const modal = createModal(`تفاصيل السيارة: ${car.plateNumber}`, `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">لوحة الأرقام</label>
                    <p class="text-gray-900 font-semibold">${car.plateNumber}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">اسم السيارة</label>
                    <p class="text-gray-900">${car.name}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">العلامة التجارية</label>
                    <p class="text-gray-900">${car.brand}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">سنة الصنع</label>
                    <p class="text-gray-900">${car.year}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">نوع السيارة</label>
                    <p class="text-gray-900">${car.type}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">المالك</label>
                    <p class="text-gray-900">${car.owner}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">السائق</label>
                    <p class="text-gray-900">${car.driver || 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">اللون</label>
                    <p class="text-gray-900">${car.color || 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">رقم الشاسيه</label>
                    <p class="text-gray-900">${car.chassisNumber || 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">رقم المحرك</label>
                    <p class="text-gray-900">${car.engineNumber || 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">انتهاء التأمين</label>
                    <p class="text-gray-900">${car.insuranceExpiry ? formatDate(car.insuranceExpiry) : 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">انتهاء الاستمارة</label>
                    <p class="text-gray-900">${car.registrationExpiry ? formatDate(car.registrationExpiry) : 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">آخر فحص دوري</label>
                    <p class="text-gray-900">${car.lastInspection ? formatDate(car.lastInspection) : 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">عداد الكيلومترات</label>
                    <p class="text-gray-900">${car.mileage ? car.mileage.toLocaleString() + ' كم' : 'غير محدد'}</p>
                </div>
            </div>
            ${car.notes ? `
                <div>
                    <label class="block text-sm font-medium text-gray-700">الملاحظات</label>
                    <p class="text-gray-900">${car.notes}</p>
                </div>
            ` : ''}
            <div>
                <label class="block text-sm font-medium text-gray-700">تاريخ الإضافة</label>
                <p class="text-gray-900">${new Date(car.createdAt).toLocaleString('ar-SA')}</p>
            </div>
        </div>
    `, [
        {
            text: 'إغلاق',
            class: 'btn-secondary',
            onclick: 'closeModal()'
        }
    ]);

    document.body.appendChild(modal);
}

// تصفية السيارات
function filterCars() {
    const searchTerm = document.getElementById('carSearch').value.toLowerCase();
    const brandFilter = document.getElementById('carFilterBrand').value;

    const filteredCars = AppData.cars.filter(car => {
        const matchesSearch = !searchTerm ||
            car.plateNumber.toLowerCase().includes(searchTerm) ||
            car.name.toLowerCase().includes(searchTerm) ||
            car.owner.toLowerCase().includes(searchTerm) ||
            (car.driver && car.driver.toLowerCase().includes(searchTerm));

        const matchesBrand = !brandFilter || car.brand === brandFilter;

        return matchesSearch && matchesBrand;
    });

    // تحديث الجدول بالنتائج المصفاة
    const tbody = document.getElementById('carsTableBody');
    const noDataDiv = document.getElementById('noCarsData');

    if (filteredCars.length === 0) {
        tbody.innerHTML = '';
        noDataDiv.classList.remove('hidden');
        return;
    }

    noDataDiv.classList.add('hidden');

    tbody.innerHTML = filteredCars.map(car => {
        const insuranceStatus = getInsuranceStatus(car.insuranceExpiry);
        return `
            <tr>
                <td>${car.plateNumber}</td>
                <td>${car.name}</td>
                <td>${car.brand}</td>
                <td>${car.year}</td>
                <td>${car.owner}</td>
                <td>${car.driver || '-'}</td>
                <td>
                    <span class="px-2 py-1 rounded text-xs ${insuranceStatus.class}">
                        ${car.insuranceExpiry ? formatDate(car.insuranceExpiry) : 'غير محدد'}
                    </span>
                </td>
                <td>
                    <div class="flex space-x-2">
                        <button onclick="editCar('${car.id}')"
                                class="btn-secondary text-xs p-2" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteCar('${car.id}')"
                                class="btn-danger text-xs p-2" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button onclick="viewCarDetails('${car.id}')"
                                class="btn-primary text-xs p-2" title="التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// تصدير السيارات إلى Excel
function exportCars() {
    if (AppData.cars.length === 0) {
        showErrorMessage('لا توجد سيارات للتصدير');
        return;
    }

    // إعداد البيانات للتصدير
    const exportData = AppData.cars.map(car => ({
        'لوحة الأرقام': car.plateNumber,
        'اسم السيارة': car.name,
        'العلامة التجارية': car.brand,
        'سنة الصنع': car.year,
        'نوع السيارة': car.type,
        'المالك': car.owner,
        'السائق': car.driver || '',
        'اللون': car.color || '',
        'رقم الشاسيه': car.chassisNumber || '',
        'رقم المحرك': car.engineNumber || '',
        'انتهاء التأمين': car.insuranceExpiry || '',
        'انتهاء الاستمارة': car.registrationExpiry || '',
        'آخر فحص دوري': car.lastInspection || '',
        'عداد الكيلومترات': car.mileage || '',
        'الملاحظات': car.notes || '',
        'تاريخ الإضافة': new Date(car.createdAt).toLocaleDateString('ar-SA')
    }));

    // إنشاء ملف Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'السيارات');

    // تحميل الملف
    XLSX.writeFile(wb, `cars-${new Date().toISOString().split('T')[0]}.xlsx`);

    showSuccessMessage('تم تصدير بيانات السيارات بنجاح');
}

// فحص تواريخ الانتهاء
function checkExpiryDates() {
    checkCarAlerts();
    showSuccessMessage('تم فحص تواريخ الانتهاء وتحديث التنبيهات');
}

function initExpensesPage() {
    updateTreasuryBalance();
    updateTodayStats();
    loadRecentExpenses();
    populateCarOptions();
    setupExpenseForm();
    setupFileUpload();

    // تعيين التاريخ والوقت الحالي
    const now = new Date();
    document.getElementById('expenseDate').value = now.toISOString().split('T')[0];
    document.getElementById('expenseTime').value = now.toTimeString().slice(0, 5);
}

// إعداد نموذج المصروفات
function setupExpenseForm() {
    const form = document.getElementById('expenseForm');
    form.addEventListener('submit', handleExpenseSubmit);
}

// إعداد رفع الملفات
function setupFileUpload() {
    const uploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('expenseAttachment');

    // النقر على المنطقة لاختيار ملف
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // السحب والإفلات
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileUpload({ target: fileInput });
        }
    });
}

// ملء خيارات السيارات
function populateCarOptions() {
    const carSelect = document.getElementById('expenseCarPlate');
    carSelect.innerHTML = '<option value="">اختر السيارة...</option>';

    AppData.cars.forEach(car => {
        const option = document.createElement('option');
        option.value = car.plateNumber;
        option.textContent = `${car.plateNumber} - ${car.name}`;
        option.dataset.carName = car.name;
        option.dataset.carBrand = car.brand;
        carSelect.appendChild(option);
    });
}

// ملء تفاصيل السيارة عند الاختيار
function fillCarDetails() {
    const carSelect = document.getElementById('expenseCarPlate');
    const selectedOption = carSelect.options[carSelect.selectedIndex];

    if (selectedOption && selectedOption.value) {
        document.getElementById('expenseCarName').value = selectedOption.dataset.carName;
    } else {
        document.getElementById('expenseCarName').value = '';
    }
}

// معالجة رفع الملف
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // التحقق من حجم الملف (5 ميجا كحد أقصى)
    if (file.size > 5 * 1024 * 1024) {
        showErrorMessage('حجم الملف كبير جداً. الحد الأقصى 5 ميجا');
        event.target.value = '';
        return;
    }

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showErrorMessage('نوع الملف غير مدعوم. يرجى اختيار صورة أو PDF أو Word');
        event.target.value = '';
        return;
    }

    // عرض معلومات الملف
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('uploadedFile').classList.remove('hidden');

    showSuccessMessage('تم رفع الملف بنجاح');
}

// إزالة الملف
function removeFile() {
    document.getElementById('expenseAttachment').value = '';
    document.getElementById('uploadedFile').classList.add('hidden');
}

// معالجة إرسال نموذج المصروف
function handleExpenseSubmit(event) {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('expenseAmount').value);

    // التحقق من الرصيد
    if (amount > AppData.treasury.balance) {
        showErrorMessage('المبلغ أكبر من الرصيد المتاح في الخزينة');
        return;
    }

    const expenseData = {
        id: Date.now().toString(),
        carPlateNumber: document.getElementById('expenseCarPlate').value,
        carName: document.getElementById('expenseCarName').value,
        type: document.getElementById('expenseType').value,
        amount: amount,
        description: document.getElementById('expenseDescription').value.trim(),
        date: document.getElementById('expenseDate').value,
        time: document.getElementById('expenseTime').value,
        vendor: document.getElementById('expenseVendor').value.trim(),
        paymentMethod: document.getElementById('expensePaymentMethod').value,
        mileage: parseInt(document.getElementById('expenseMileage').value) || 0,
        notes: document.getElementById('expenseNotes').value.trim(),
        attachment: null, // سيتم معالجة الملف لاحقاً
        createdAt: new Date().toISOString()
    };

    // معالجة الملف المرفق
    const fileInput = document.getElementById('expenseAttachment');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            expenseData.attachment = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result
            };

            saveExpense(expenseData);
        };

        reader.readAsDataURL(file);
    } else {
        saveExpense(expenseData);
    }
}

// حفظ المصروف
function saveExpense(expenseData) {
    // إضافة المصروف للبيانات
    AppData.expenses.push(expenseData);

    // خصم المبلغ من الخزينة
    AppData.treasury.balance -= expenseData.amount;

    // إضافة معاملة خصم في الخزينة
    AppData.treasury.transactions.push({
        id: Date.now().toString() + '_expense',
        amount: -expenseData.amount,
        source: 'مصروف',
        notes: `${expenseData.type} - ${expenseData.description}`,
        date: expenseData.date,
        timestamp: new Date().toISOString(),
        type: 'expense',
        relatedExpenseId: expenseData.id
    });

    // حفظ البيانات
    saveData();

    // تحديث الواجهة
    updateTreasuryBalance();
    updateTodayStats();
    loadRecentExpenses();

    // إعادة تعيين النموذج
    resetExpenseForm();

    showSuccessMessage(`تم إضافة المصروف بقيمة ${formatCurrency(expenseData.amount)} بنجاح`);
}

// إعادة تعيين نموذج المصروف
function resetExpenseForm() {
    document.getElementById('expenseForm').reset();
    removeFile();

    // إعادة تعيين التاريخ والوقت
    const now = new Date();
    document.getElementById('expenseDate').value = now.toISOString().split('T')[0];
    document.getElementById('expenseTime').value = now.toTimeString().slice(0, 5);
}

// تحديث رصيد الخزينة
function updateTreasuryBalance() {
    const totalReceived = AppData.treasury.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = AppData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const balance = totalReceived - totalSpent;

    document.getElementById('treasuryBalanceDisplay').textContent = formatCurrency(balance);
    AppData.treasury.balance = balance;
}

// تحديث إحصائيات اليوم
function updateTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = AppData.expenses.filter(expense => expense.date === today);

    const totalAmount = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const count = todayExpenses.length;
    const average = count > 0 ? totalAmount / count : 0;

    document.getElementById('todayExpenses').textContent = formatCurrency(totalAmount);
    document.getElementById('todayExpenseCount').textContent = count;
    document.getElementById('avgExpenseToday').textContent = formatCurrency(average);
}

// تحميل آخر المصروفات
function loadRecentExpenses() {
    const container = document.getElementById('recentExpenses');
    const noDataDiv = document.getElementById('noRecentExpenses');

    // أحدث 5 مصروفات
    const recentExpenses = [...AppData.expenses]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (recentExpenses.length === 0) {
        container.innerHTML = '';
        noDataDiv.classList.remove('hidden');
        return;
    }

    noDataDiv.classList.add('hidden');

    container.innerHTML = recentExpenses.map(expense => `
        <div class="bg-gray-50 rounded-lg p-3 border-r-4 border-red-500">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center mb-1">
                        <span class="font-semibold text-red-600">${formatCurrency(expense.amount)}</span>
                        <span class="text-xs text-gray-500 mr-2">${expense.type}</span>
                    </div>
                    <p class="text-sm text-gray-700">${expense.description}</p>
                    <div class="flex items-center text-xs text-gray-500 mt-1">
                        <i class="fas fa-car ml-1"></i>
                        <span>${expense.carPlateNumber}</span>
                        <i class="fas fa-calendar ml-2 mr-1"></i>
                        <span>${formatDate(expense.date)}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function initExpenseListPage() {
    updateExpenseListStats();
    populateExpenseFilters();
    loadExpenseListTable();
    setupExpenseListEvents();
}

// إعداد أحداث صفحة قائمة المصروفات
function setupExpenseListEvents() {
    // إظهار/إخفاء الفترة المخصصة
    document.getElementById('expenseFilterPeriod').addEventListener('change', function() {
        const customRange = document.getElementById('customDateRange');
        if (this.value === 'custom') {
            customRange.classList.remove('hidden');
        } else {
            customRange.classList.add('hidden');
        }
        filterExpenses();
    });
}

// تحديث إحصائيات قائمة المصروفات
function updateExpenseListStats() {
    const totalAmount = AppData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const count = AppData.expenses.length;
    const average = count > 0 ? totalAmount / count : 0;
    const maxExpense = count > 0 ? Math.max(...AppData.expenses.map(e => e.amount)) : 0;

    document.getElementById('totalExpensesDisplay').textContent = formatCurrency(totalAmount);
    document.getElementById('totalExpenseCountDisplay').textContent = count;
    document.getElementById('avgExpenseDisplay').textContent = formatCurrency(average);
    document.getElementById('maxExpenseDisplay').textContent = formatCurrency(maxExpense);
}

// ملء فلاتر المصروفات
function populateExpenseFilters() {
    // ملء فلتر السيارات
    const carFilter = document.getElementById('expenseFilterCar');
    carFilter.innerHTML = '<option value="">جميع السيارات</option>';

    const uniqueCars = [...new Set(AppData.expenses.map(e => e.carPlateNumber))];
    uniqueCars.forEach(plateNumber => {
        if (plateNumber) {
            const car = AppData.cars.find(c => c.plateNumber === plateNumber);
            const option = document.createElement('option');
            option.value = plateNumber;
            option.textContent = car ? `${plateNumber} - ${car.name}` : plateNumber;
            carFilter.appendChild(option);
        }
    });
}

// تحميل جدول قائمة المصروفات
function loadExpenseListTable(expenses = null) {
    const expensesToShow = expenses || AppData.expenses;
    const tbody = document.getElementById('expenseListTableBody');
    const noDataDiv = document.getElementById('noExpenseListData');

    // تحديث العدادات
    document.getElementById('filteredCount').textContent = expensesToShow.length;
    document.getElementById('totalCount').textContent = AppData.expenses.length;

    if (expensesToShow.length === 0) {
        tbody.innerHTML = '';
        noDataDiv.classList.remove('hidden');
        document.getElementById('filterSummary').classList.add('hidden');
        return;
    }

    noDataDiv.classList.add('hidden');

    // ترتيب المصروفات حسب التاريخ (الأحدث أولاً)
    const sortedExpenses = [...expensesToShow].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    tbody.innerHTML = sortedExpenses.map(expense => `
        <tr>
            <td>
                <div>
                    <div class="font-medium">${formatDate(expense.date)}</div>
                    ${expense.time ? `<div class="text-xs text-gray-500">${expense.time}</div>` : ''}
                </div>
            </td>
            <td>
                <div>
                    <div class="font-medium">${expense.carPlateNumber}</div>
                    <div class="text-xs text-gray-500">${expense.carName}</div>
                </div>
            </td>
            <td>
                <span class="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    ${expense.type}
                </span>
            </td>
            <td>
                <div class="max-w-xs">
                    <div class="font-medium">${expense.description}</div>
                    ${expense.notes ? `<div class="text-xs text-gray-500 truncate">${expense.notes}</div>` : ''}
                </div>
            </td>
            <td>
                <span class="font-semibold text-red-600">${formatCurrency(expense.amount)}</span>
            </td>
            <td>${expense.vendor || '-'}</td>
            <td>
                ${expense.attachment ?
                    `<button onclick="viewAttachment('${expense.id}')" class="btn-secondary text-xs p-2" title="عرض المرفق">
                        <i class="fas fa-paperclip"></i>
                    </button>` :
                    '<span class="text-gray-400">-</span>'
                }
            </td>
            <td>
                <div class="flex space-x-2">
                    <button onclick="editExpense('${expense.id}')"
                            class="btn-secondary text-xs p-2" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteExpense('${expense.id}')"
                            class="btn-danger text-xs p-2" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="viewExpenseDetails('${expense.id}')"
                            class="btn-primary text-xs p-2" title="التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // إظهار ملخص النتائج المصفاة إذا كانت هناك فلاتر
    if (expenses && expenses.length !== AppData.expenses.length) {
        showFilterSummary(expenses);
    } else {
        document.getElementById('filterSummary').classList.add('hidden');
    }
}

// إظهار ملخص النتائج المصفاة
function showFilterSummary(filteredExpenses) {
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const count = filteredExpenses.length;
    const average = count > 0 ? total / count : 0;

    document.getElementById('filteredTotal').textContent = formatCurrency(total);
    document.getElementById('filteredCountSummary').textContent = count;
    document.getElementById('filteredAverage').textContent = formatCurrency(average);
    document.getElementById('filterSummary').classList.remove('hidden');
}

// تصفية المصروفات
function filterExpenses() {
    const searchText = document.getElementById('expenseSearchText').value.toLowerCase();
    const carFilter = document.getElementById('expenseFilterCar').value;
    const typeFilter = document.getElementById('expenseFilterType').value;
    const periodFilter = document.getElementById('expenseFilterPeriod').value;
    const dateFrom = document.getElementById('expenseFilterDateFrom').value;
    const dateTo = document.getElementById('expenseFilterDateTo').value;

    let filteredExpenses = AppData.expenses.filter(expense => {
        // فلتر النص
        const matchesText = !searchText ||
            expense.description.toLowerCase().includes(searchText) ||
            expense.notes.toLowerCase().includes(searchText) ||
            expense.vendor.toLowerCase().includes(searchText);

        // فلتر السيارة
        const matchesCar = !carFilter || expense.carPlateNumber === carFilter;

        // فلتر النوع
        const matchesType = !typeFilter || expense.type === typeFilter;

        // فلتر الفترة الزمنية
        let matchesPeriod = true;
        if (periodFilter) {
            const expenseDate = new Date(expense.date);
            const today = new Date();

            switch (periodFilter) {
                case 'today':
                    matchesPeriod = expense.date === today.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    matchesPeriod = expenseDate >= weekAgo;
                    break;
                case 'month':
                    const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
                    matchesPeriod = expenseDate >= monthAgo;
                    break;
                case 'quarter':
                    const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
                    matchesPeriod = expenseDate >= quarterStart;
                    break;
                case 'year':
                    const yearStart = new Date(today.getFullYear(), 0, 1);
                    matchesPeriod = expenseDate >= yearStart;
                    break;
                case 'custom':
                    if (dateFrom && dateTo) {
                        const fromDate = new Date(dateFrom);
                        const toDate = new Date(dateTo);
                        matchesPeriod = expenseDate >= fromDate && expenseDate <= toDate;
                    }
                    break;
            }
        }

        return matchesText && matchesCar && matchesType && matchesPeriod;
    });

    loadExpenseListTable(filteredExpenses);
}

// مسح الفلاتر
function clearFilters() {
    document.getElementById('expenseSearchText').value = '';
    document.getElementById('expenseFilterCar').value = '';
    document.getElementById('expenseFilterType').value = '';
    document.getElementById('expenseFilterPeriod').value = '';
    document.getElementById('expenseFilterDateFrom').value = '';
    document.getElementById('expenseFilterDateTo').value = '';
    document.getElementById('customDateRange').classList.add('hidden');

    loadExpenseListTable();
}

// عرض المرفق
function viewAttachment(expenseId) {
    const expense = AppData.expenses.find(e => e.id === expenseId);
    if (!expense || !expense.attachment) {
        showErrorMessage('لا يوجد مرفق لهذا المصروف');
        return;
    }

    const attachment = expense.attachment;

    if (attachment.type.startsWith('image/')) {
        // عرض الصورة في نافذة منبثقة
        const modal = createModal(`مرفق المصروف: ${expense.description}`, `
            <div class="text-center">
                <img src="${attachment.data}" alt="${attachment.name}" class="max-w-full max-h-96 mx-auto rounded-lg">
                <p class="text-sm text-gray-600 mt-2">${attachment.name}</p>
                <p class="text-xs text-gray-500">الحجم: ${(attachment.size / 1024).toFixed(1)} كيلوبايت</p>
            </div>
        `, [
            {
                text: 'تحميل',
                class: 'btn-primary',
                onclick: `downloadAttachment('${expenseId}')`
            },
            {
                text: 'إغلاق',
                class: 'btn-secondary',
                onclick: 'closeModal()'
            }
        ]);
    } else {
        // للملفات الأخرى، عرض معلومات الملف مع خيار التحميل
        const modal = createModal(`مرفق المصروف: ${expense.description}`, `
            <div class="text-center">
                <i class="fas fa-file text-6xl text-gray-400 mb-4"></i>
                <p class="font-semibold text-gray-800">${attachment.name}</p>
                <p class="text-sm text-gray-600">النوع: ${attachment.type}</p>
                <p class="text-xs text-gray-500">الحجم: ${(attachment.size / 1024).toFixed(1)} كيلوبايت</p>
            </div>
        `, [
            {
                text: 'تحميل',
                class: 'btn-primary',
                onclick: `downloadAttachment('${expenseId}')`
            },
            {
                text: 'إغلاق',
                class: 'btn-secondary',
                onclick: 'closeModal()'
            }
        ]);
    }

    document.body.appendChild(modal);
}

// تحميل المرفق
function downloadAttachment(expenseId) {
    const expense = AppData.expenses.find(e => e.id === expenseId);
    if (!expense || !expense.attachment) {
        showErrorMessage('لا يوجد مرفق لهذا المصروف');
        return;
    }

    const attachment = expense.attachment;
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    link.click();

    closeModal();
    showSuccessMessage('تم تحميل المرفق بنجاح');
}

// تعديل مصروف
function editExpense(expenseId) {
    const expense = AppData.expenses.find(e => e.id === expenseId);
    if (!expense) {
        showErrorMessage('لم يتم العثور على المصروف');
        return;
    }

    // الانتقال إلى صفحة إدخال المصروفات
    showPage('expenses');

    // ملء النموذج بالبيانات الحالية
    setTimeout(() => {
        document.getElementById('expenseCarPlate').value = expense.carPlateNumber;
        fillCarDetails();
        document.getElementById('expenseType').value = expense.type;
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseDescription').value = expense.description;
        document.getElementById('expenseDate').value = expense.date;
        document.getElementById('expenseTime').value = expense.time || '';
        document.getElementById('expenseVendor').value = expense.vendor || '';
        document.getElementById('expensePaymentMethod').value = expense.paymentMethod || '';
        document.getElementById('expenseMileage').value = expense.mileage || '';
        document.getElementById('expenseNotes').value = expense.notes || '';

        // حذف المصروف القديم
        deleteExpense(expenseId, false);

        showInfoMessage('تم تحميل بيانات المصروف للتعديل');
    }, 100);
}

// حذف مصروف
function deleteExpense(expenseId, showConfirm = true) {
    if (showConfirm && !confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
        return;
    }

    const expenseIndex = AppData.expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) {
        showErrorMessage('لم يتم العثور على المصروف');
        return;
    }

    const expense = AppData.expenses[expenseIndex];

    // إزالة المصروف من البيانات
    AppData.expenses.splice(expenseIndex, 1);

    // إعادة المبلغ للخزينة
    AppData.treasury.balance += expense.amount;

    // إزالة معاملة الخصم من الخزينة
    const transactionIndex = AppData.treasury.transactions.findIndex(
        t => t.relatedExpenseId === expenseId
    );
    if (transactionIndex !== -1) {
        AppData.treasury.transactions.splice(transactionIndex, 1);
    }

    // حفظ البيانات
    saveData();

    // تحديث الواجهة
    updateExpenseListStats();
    populateExpenseFilters();
    loadExpenseListTable();

    if (showConfirm) {
        showSuccessMessage(`تم حذف المصروف بقيمة ${formatCurrency(expense.amount)} بنجاح`);
    }
}

// عرض تفاصيل المصروف
function viewExpenseDetails(expenseId) {
    const expense = AppData.expenses.find(e => e.id === expenseId);
    if (!expense) {
        showErrorMessage('لم يتم العثور على المصروف');
        return;
    }

    const modal = createModal(`تفاصيل المصروف: ${expense.description}`, `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">السيارة</label>
                    <p class="text-gray-900">${expense.carPlateNumber} - ${expense.carName}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">نوع المصروف</label>
                    <p class="text-gray-900">${expense.type}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">المبلغ</label>
                    <p class="text-gray-900 font-semibold text-red-600">${formatCurrency(expense.amount)}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">التاريخ والوقت</label>
                    <p class="text-gray-900">${formatDate(expense.date)} ${expense.time ? `- ${expense.time}` : ''}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">المورد</label>
                    <p class="text-gray-900">${expense.vendor || 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">طريقة الدفع</label>
                    <p class="text-gray-900">${expense.paymentMethod || 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">عداد الكيلومترات</label>
                    <p class="text-gray-900">${expense.mileage ? expense.mileage.toLocaleString() + ' كم' : 'غير محدد'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">المرفق</label>
                    <p class="text-gray-900">${expense.attachment ? expense.attachment.name : 'لا يوجد'}</p>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">الوصف</label>
                <p class="text-gray-900">${expense.description}</p>
            </div>
            ${expense.notes ? `
                <div>
                    <label class="block text-sm font-medium text-gray-700">الملاحظات</label>
                    <p class="text-gray-900">${expense.notes}</p>
                </div>
            ` : ''}
            <div>
                <label class="block text-sm font-medium text-gray-700">تاريخ الإضافة</label>
                <p class="text-gray-900">${new Date(expense.createdAt).toLocaleString('ar-SA')}</p>
            </div>
        </div>
    `, [
        {
            text: 'إغلاق',
            class: 'btn-secondary',
            onclick: 'closeModal()'
        }
    ]);

    document.body.appendChild(modal);
}

// تصدير المصروفات إلى Excel
function exportExpenses() {
    if (AppData.expenses.length === 0) {
        showErrorMessage('لا توجد مصروفات للتصدير');
        return;
    }

    // إعداد البيانات للتصدير
    const exportData = AppData.expenses.map(expense => ({
        'التاريخ': expense.date,
        'الوقت': expense.time || '',
        'السيارة': expense.carPlateNumber,
        'اسم السيارة': expense.carName,
        'نوع المصروف': expense.type,
        'الوصف': expense.description,
        'المبلغ': expense.amount,
        'المورد': expense.vendor || '',
        'طريقة الدفع': expense.paymentMethod || '',
        'عداد الكيلومترات': expense.mileage || '',
        'الملاحظات': expense.notes || '',
        'تاريخ الإضافة': new Date(expense.createdAt).toLocaleDateString('ar-SA')
    }));

    // إنشاء ملف Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المصروفات');

    // تحميل الملف
    XLSX.writeFile(wb, `expenses-${new Date().toISOString().split('T')[0]}.xlsx`);

    showSuccessMessage('تم تصدير بيانات المصروفات بنجاح');
}

// طباعة المصروفات
function printExpenses() {
    const printWindow = window.open('', '_blank');
    const expenses = AppData.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>قائمة المصروفات - RASHID INDUSTRIAL CO.</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .report-title { font-size: 18px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .total-row { background-color: #f0f8ff; font-weight: bold; }
                .print-date { text-align: left; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">RASHID INDUSTRIAL CO.</div>
                <div class="report-title">قائمة المصروفات</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>السيارة</th>
                        <th>النوع</th>
                        <th>الوصف</th>
                        <th>المبلغ</th>
                        <th>المورد</th>
                    </tr>
                </thead>
                <tbody>
                    ${expenses.map(expense => `
                        <tr>
                            <td>${formatDate(expense.date)}</td>
                            <td>${expense.carPlateNumber}</td>
                            <td>${expense.type}</td>
                            <td>${expense.description}</td>
                            <td>${formatCurrency(expense.amount)}</td>
                            <td>${expense.vendor || '-'}</td>
                        </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="4">الإجمالي</td>
                        <td>${formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}</td>
                        <td>-</td>
                    </tr>
                </tbody>
            </table>

            <div class="print-date">
                تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

function initReportsPage() {
    populateReportCarOptions();
    setupReportDateDefaults();
}

// ملء خيارات السيارات في التقارير
function populateReportCarOptions() {
    const carSelect = document.getElementById('reportSelectedCar');
    carSelect.innerHTML = '<option value="">اختر السيارة...</option>';

    AppData.cars.forEach(car => {
        const option = document.createElement('option');
        option.value = car.plateNumber;
        option.textContent = `${car.plateNumber} - ${car.name}`;
        carSelect.appendChild(option);
    });
}

// إعداد التواريخ الافتراضية
function setupReportDateDefaults() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    document.getElementById('reportDateFrom').value = firstDayOfMonth.toISOString().split('T')[0];
    document.getElementById('reportDateTo').value = today.toISOString().split('T')[0];
}

// توليد التقرير
function generateReport(reportType) {
    // إخفاء جميع الخيارات أولاً
    document.getElementById('reportDateRange').classList.add('hidden');
    document.getElementById('reportCarSelection').classList.add('hidden');

    let reportTitle = '';
    let reportContent = '';

    switch (reportType) {
        case 'totalExpensesByCar':
            reportTitle = 'تقرير إجمالي المصروفات لكل سيارة (تفصيلي)';
            reportContent = generateTotalExpensesByCarReport(true);
            break;

        case 'summaryExpensesByCar':
            reportTitle = 'تقرير إجمالي المصروفات لكل سيارة (مختصر)';
            reportContent = generateTotalExpensesByCarReport(false);
            break;

        case 'expensesByPeriod':
            document.getElementById('reportDateRange').classList.remove('hidden');
            reportTitle = 'تقرير المصروفات حسب الفترة الزمنية';
            reportContent = generateExpensesByPeriodReport();
            break;

        case 'specificCarReport':
            document.getElementById('reportDateRange').classList.remove('hidden');
            document.getElementById('reportCarSelection').classList.remove('hidden');
            reportTitle = 'تقرير سيارة محددة خلال فترة';
            reportContent = generateSpecificCarReport();
            break;

        case 'treasuryStatement':
            reportTitle = 'كشف حساب الخزينة';
            reportContent = generateTreasuryStatementReport();
            break;

        case 'treasuryAnalysis':
            reportTitle = 'تحليل الخزينة';
            reportContent = generateTreasuryAnalysisReport();
            break;

        case 'carsData':
            reportTitle = 'تقرير بيانات السيارات';
            reportContent = generateCarsDataReport();
            break;

        default:
            reportTitle = 'تقرير غير معروف';
            reportContent = '<p class="text-red-500">نوع التقرير غير مدعوم</p>';
    }

    // عرض التقرير
    document.getElementById('reportTitle').textContent = reportTitle;
    document.getElementById('reportContent').innerHTML = reportContent;

    // تفعيل أزرار الطباعة والتصدير
    document.getElementById('printReportBtn').disabled = false;
    document.getElementById('exportReportBtn').disabled = false;

    // حفظ نوع التقرير الحالي
    window.currentReportType = reportType;
    window.currentReportTitle = reportTitle;
}

// تقرير إجمالي المصروفات لكل سيارة
function generateTotalExpensesByCarReport(detailed = true) {
    const carExpenses = {};

    // تجميع المصروفات حسب السيارة
    AppData.expenses.forEach(expense => {
        const carKey = expense.carPlateNumber;
        if (!carExpenses[carKey]) {
            carExpenses[carKey] = {
                carName: expense.carName,
                plateNumber: expense.carPlateNumber,
                total: 0,
                expenses: []
            };
        }
        carExpenses[carKey].total += expense.amount;
        if (detailed) {
            carExpenses[carKey].expenses.push(expense);
        }
    });

    if (Object.keys(carExpenses).length === 0) {
        return '<p class="text-gray-500 text-center py-8">لا توجد مصروفات لعرضها</p>';
    }

    let html = `
        <div class="report-header mb-6">
            <h2 class="text-xl font-bold text-center mb-2">RASHID INDUSTRIAL CO.</h2>
            <h3 class="text-lg text-center text-gray-600 mb-4">${detailed ? 'تقرير إجمالي المصروفات لكل سيارة (تفصيلي)' : 'تقرير إجمالي المصروفات لكل سيارة (مختصر)'}</h3>
            <p class="text-sm text-gray-500 text-center">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
    `;

    const sortedCars = Object.values(carExpenses).sort((a, b) => b.total - a.total);

    sortedCars.forEach(car => {
        html += `
            <div class="car-section mb-6 border rounded-lg p-4">
                <div class="flex justify-between items-center mb-3 pb-3 border-b">
                    <h4 class="text-lg font-semibold">${car.plateNumber} - ${car.carName}</h4>
                    <span class="text-xl font-bold text-red-600">${formatCurrency(car.total)}</span>
                </div>
        `;

        if (detailed && car.expenses.length > 0) {
            html += `
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="p-2 text-right">التاريخ</th>
                            <th class="p-2 text-right">النوع</th>
                            <th class="p-2 text-right">الوصف</th>
                            <th class="p-2 text-right">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            car.expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(expense => {
                html += `
                    <tr class="border-b">
                        <td class="p-2">${formatDate(expense.date)}</td>
                        <td class="p-2">${expense.type}</td>
                        <td class="p-2">${expense.description}</td>
                        <td class="p-2 font-semibold text-red-600">${formatCurrency(expense.amount)}</td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
            `;
        }

        html += '</div>';
    });

    // إجمالي عام
    const grandTotal = sortedCars.reduce((sum, car) => sum + car.total, 0);
    html += `
        <div class="grand-total mt-6 p-4 bg-gray-100 rounded-lg">
            <div class="flex justify-between items-center">
                <span class="text-lg font-semibold">الإجمالي العام:</span>
                <span class="text-2xl font-bold text-red-600">${formatCurrency(grandTotal)}</span>
            </div>
        </div>
    `;

    return html;
}

// تقرير المصروفات حسب الفترة الزمنية
function generateExpensesByPeriodReport() {
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;

    if (!dateFrom || !dateTo) {
        return '<p class="text-yellow-500 text-center py-8">يرجى تحديد الفترة الزمنية</p>';
    }

    const filteredExpenses = AppData.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        return expenseDate >= fromDate && expenseDate <= toDate;
    });

    if (filteredExpenses.length === 0) {
        return '<p class="text-gray-500 text-center py-8">لا توجد مصروفات في هذه الفترة</p>';
    }

    let html = `
        <div class="report-header mb-6">
            <h2 class="text-xl font-bold text-center mb-2">RASHID INDUSTRIAL CO.</h2>
            <h3 class="text-lg text-center text-gray-600 mb-4">تقرير المصروفات حسب الفترة الزمنية</h3>
            <p class="text-sm text-gray-500 text-center">من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}</p>
        </div>

        <table class="w-full border-collapse border">
            <thead>
                <tr class="bg-gray-50">
                    <th class="border p-3 text-right">التاريخ</th>
                    <th class="border p-3 text-right">السيارة</th>
                    <th class="border p-3 text-right">النوع</th>
                    <th class="border p-3 text-right">الوصف</th>
                    <th class="border p-3 text-right">المبلغ</th>
                </tr>
            </thead>
            <tbody>
    `;

    const sortedExpenses = filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(expense => {
        html += `
            <tr>
                <td class="border p-3">${formatDate(expense.date)}</td>
                <td class="border p-3">${expense.carPlateNumber}</td>
                <td class="border p-3">${expense.type}</td>
                <td class="border p-3">${expense.description}</td>
                <td class="border p-3 font-semibold text-red-600">${formatCurrency(expense.amount)}</td>
            </tr>
        `;
    });

    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    html += `
            <tr class="bg-gray-100 font-bold">
                <td class="border p-3" colspan="4">الإجمالي</td>
                <td class="border p-3 text-red-600">${formatCurrency(total)}</td>
            </tr>
        </tbody>
    </table>
    `;

    return html;
}

// تقرير سيارة محددة
function generateSpecificCarReport() {
    const selectedCar = document.getElementById('reportSelectedCar').value;
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;

    if (!selectedCar) {
        return '<p class="text-yellow-500 text-center py-8">يرجى اختيار السيارة</p>';
    }

    if (!dateFrom || !dateTo) {
        return '<p class="text-yellow-500 text-center py-8">يرجى تحديد الفترة الزمنية</p>';
    }

    const car = AppData.cars.find(c => c.plateNumber === selectedCar);
    const filteredExpenses = AppData.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        return expense.carPlateNumber === selectedCar &&
               expenseDate >= fromDate &&
               expenseDate <= toDate;
    });

    if (filteredExpenses.length === 0) {
        return '<p class="text-gray-500 text-center py-8">لا توجد مصروفات لهذه السيارة في الفترة المحددة</p>';
    }

    let html = `
        <div class="report-header mb-6">
            <h2 class="text-xl font-bold text-center mb-2">RASHID INDUSTRIAL CO.</h2>
            <h3 class="text-lg text-center text-gray-600 mb-4">تقرير السيارة: ${selectedCar} - ${car ? car.name : ''}</h3>
            <p class="text-sm text-gray-500 text-center">من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}</p>
        </div>
    `;

    // معلومات السيارة
    if (car) {
        html += `
            <div class="car-info mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 class="font-semibold mb-2">معلومات السيارة</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><span class="font-medium">العلامة التجارية:</span> ${car.brand}</div>
                    <div><span class="font-medium">سنة الصنع:</span> ${car.year}</div>
                    <div><span class="font-medium">المالك:</span> ${car.owner}</div>
                    <div><span class="font-medium">السائق:</span> ${car.driver || 'غير محدد'}</div>
                </div>
            </div>
        `;
    }

    // تجميع المصروفات حسب النوع
    const expensesByType = {};
    filteredExpenses.forEach(expense => {
        if (!expensesByType[expense.type]) {
            expensesByType[expense.type] = [];
        }
        expensesByType[expense.type].push(expense);
    });

    html += '<div class="expenses-by-type">';

    Object.keys(expensesByType).forEach(type => {
        const typeExpenses = expensesByType[type];
        const typeTotal = typeExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        html += `
            <div class="type-section mb-6">
                <div class="flex justify-between items-center mb-3 p-3 bg-gray-100 rounded">
                    <h5 class="font-semibold">${type}</h5>
                    <span class="font-bold text-red-600">${formatCurrency(typeTotal)}</span>
                </div>

                <table class="w-full text-sm border-collapse border">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="border p-2 text-right">التاريخ</th>
                            <th class="border p-2 text-right">الوصف</th>
                            <th class="border p-2 text-right">المبلغ</th>
                            <th class="border p-2 text-right">المورد</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        typeExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(expense => {
            html += `
                <tr>
                    <td class="border p-2">${formatDate(expense.date)}</td>
                    <td class="border p-2">${expense.description}</td>
                    <td class="border p-2 font-semibold text-red-600">${formatCurrency(expense.amount)}</td>
                    <td class="border p-2">${expense.vendor || '-'}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    });

    html += '</div>';

    // الإجمالي العام
    const grandTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    html += `
        <div class="grand-total mt-6 p-4 bg-gray-100 rounded-lg">
            <div class="flex justify-between items-center">
                <span class="text-lg font-semibold">إجمالي مصروفات السيارة:</span>
                <span class="text-2xl font-bold text-red-600">${formatCurrency(grandTotal)}</span>
            </div>
        </div>
    `;

    return html;
}

// تقرير كشف حساب الخزينة
function generateTreasuryStatementReport() {
    const allTransactions = [
        ...AppData.treasury.transactions.map(t => ({...t, source: 'treasury'})),
        ...AppData.expenses.map(e => ({
            id: e.id,
            amount: -e.amount,
            source: 'expense',
            notes: `${e.type} - ${e.description}`,
            date: e.date,
            timestamp: e.createdAt,
            type: 'expense'
        }))
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (allTransactions.length === 0) {
        return '<p class="text-gray-500 text-center py-8">لا توجد معاملات في الخزينة</p>';
    }

    let html = `
        <div class="report-header mb-6">
            <h2 class="text-xl font-bold text-center mb-2">RASHID INDUSTRIAL CO.</h2>
            <h3 class="text-lg text-center text-gray-600 mb-4">كشف حساب الخزينة</h3>
            <p class="text-sm text-gray-500 text-center">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <table class="w-full border-collapse border">
            <thead>
                <tr class="bg-gray-50">
                    <th class="border p-3 text-right">التاريخ</th>
                    <th class="border p-3 text-right">البيان</th>
                    <th class="border p-3 text-right">مدين</th>
                    <th class="border p-3 text-right">دائن</th>
                    <th class="border p-3 text-right">الرصيد</th>
                </tr>
            </thead>
            <tbody>
    `;

    let runningBalance = 0;

    allTransactions.forEach(transaction => {
        runningBalance += transaction.amount;
        const isIncome = transaction.amount > 0;

        html += `
            <tr>
                <td class="border p-3">${formatDate(transaction.date)}</td>
                <td class="border p-3">${transaction.notes}</td>
                <td class="border p-3 ${isIncome ? 'font-semibold text-green-600' : ''}">${isIncome ? formatCurrency(transaction.amount) : '-'}</td>
                <td class="border p-3 ${!isIncome ? 'font-semibold text-red-600' : ''}">${!isIncome ? formatCurrency(Math.abs(transaction.amount)) : '-'}</td>
                <td class="border p-3 font-semibold ${runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(runningBalance)}</td>
            </tr>
        `;
    });

    html += `
        </tbody>
    </table>
    `;

    return html;
}

// تقرير تحليل الخزينة
function generateTreasuryAnalysisReport() {
    const totalIncome = AppData.treasury.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = AppData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const currentBalance = totalIncome - totalExpenses;

    // تحليل المصروفات حسب النوع
    const expensesByType = {};
    AppData.expenses.forEach(expense => {
        expensesByType[expense.type] = (expensesByType[expense.type] || 0) + expense.amount;
    });

    // تحليل المصروفات حسب الشهر
    const expensesByMonth = {};
    AppData.expenses.forEach(expense => {
        const monthKey = expense.date.substring(0, 7); // YYYY-MM
        expensesByMonth[monthKey] = (expensesByMonth[monthKey] || 0) + expense.amount;
    });

    let html = `
        <div class="report-header mb-6">
            <h2 class="text-xl font-bold text-center mb-2">RASHID INDUSTRIAL CO.</h2>
            <h3 class="text-lg text-center text-gray-600 mb-4">تحليل الخزينة</h3>
            <p class="text-sm text-gray-500 text-center">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <!-- الملخص العام -->
        <div class="summary-section mb-6">
            <h4 class="text-lg font-semibold mb-4">الملخص العام</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">${formatCurrency(totalIncome)}</div>
                        <div class="text-sm text-green-700">إجمالي الإيرادات</div>
                    </div>
                </div>
                <div class="bg-red-50 p-4 rounded-lg">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-red-600">${formatCurrency(totalExpenses)}</div>
                        <div class="text-sm text-red-700">إجمالي المصروفات</div>
                    </div>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-center">
                        <div class="text-2xl font-bold ${currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'}">${formatCurrency(currentBalance)}</div>
                        <div class="text-sm text-blue-700">الرصيد الحالي</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- تحليل المصروفات حسب النوع -->
        <div class="expenses-by-type-section mb-6">
            <h4 class="text-lg font-semibold mb-4">توزيع المصروفات حسب النوع</h4>
            <table class="w-full border-collapse border">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="border p-3 text-right">نوع المصروف</th>
                        <th class="border p-3 text-right">المبلغ</th>
                        <th class="border p-3 text-right">النسبة</th>
                    </tr>
                </thead>
                <tbody>
    `;

    Object.entries(expensesByType)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, amount]) => {
            const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100).toFixed(1) : 0;
            html += `
                <tr>
                    <td class="border p-3">${type}</td>
                    <td class="border p-3 font-semibold text-red-600">${formatCurrency(amount)}</td>
                    <td class="border p-3">${percentage}%</td>
                </tr>
            `;
        });

    html += `
                </tbody>
            </table>
        </div>

        <!-- تحليل المصروفات الشهرية -->
        <div class="monthly-expenses-section">
            <h4 class="text-lg font-semibold mb-4">المصروفات الشهرية</h4>
            <table class="w-full border-collapse border">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="border p-3 text-right">الشهر</th>
                        <th class="border p-3 text-right">المبلغ</th>
                    </tr>
                </thead>
                <tbody>
    `;

    Object.entries(expensesByMonth)
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([month, amount]) => {
            const monthName = new Date(month + '-01').toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
            html += `
                <tr>
                    <td class="border p-3">${monthName}</td>
                    <td class="border p-3 font-semibold text-red-600">${formatCurrency(amount)}</td>
                </tr>
            `;
        });

    html += `
                </tbody>
            </table>
        </div>
    `;

    return html;
}

// تقرير بيانات السيارات
function generateCarsDataReport() {
    if (AppData.cars.length === 0) {
        return '<p class="text-gray-500 text-center py-8">لا توجد سيارات مسجلة</p>';
    }

    let html = `
        <div class="report-header mb-6">
            <h2 class="text-xl font-bold text-center mb-2">RASHID INDUSTRIAL CO.</h2>
            <h3 class="text-lg text-center text-gray-600 mb-4">تقرير بيانات السيارات</h3>
            <p class="text-sm text-gray-500 text-center">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <table class="w-full border-collapse border text-sm">
            <thead>
                <tr class="bg-gray-50">
                    <th class="border p-2 text-right">لوحة الأرقام</th>
                    <th class="border p-2 text-right">اسم السيارة</th>
                    <th class="border p-2 text-right">العلامة التجارية</th>
                    <th class="border p-2 text-right">السنة</th>
                    <th class="border p-2 text-right">المالك</th>
                    <th class="border p-2 text-right">السائق</th>
                    <th class="border p-2 text-right">انتهاء التأمين</th>
                    <th class="border p-2 text-right">انتهاء الاستمارة</th>
                </tr>
            </thead>
            <tbody>
    `;

    AppData.cars.forEach(car => {
        const insuranceStatus = getInsuranceStatus(car.insuranceExpiry);
        const registrationStatus = getInsuranceStatus(car.registrationExpiry);

        html += `
            <tr>
                <td class="border p-2 font-semibold">${car.plateNumber}</td>
                <td class="border p-2">${car.name}</td>
                <td class="border p-2">${car.brand}</td>
                <td class="border p-2">${car.year}</td>
                <td class="border p-2">${car.owner}</td>
                <td class="border p-2">${car.driver || '-'}</td>
                <td class="border p-2 ${insuranceStatus.class.replace('bg-', 'text-').replace('-100', '-600')}">${car.insuranceExpiry ? formatDate(car.insuranceExpiry) : 'غير محدد'}</td>
                <td class="border p-2 ${registrationStatus.class.replace('bg-', 'text-').replace('-100', '-600')}">${car.registrationExpiry ? formatDate(car.registrationExpiry) : 'غير محدد'}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>

        <div class="summary mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 class="font-semibold mb-2">ملخص</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span class="font-medium">إجمالي السيارات:</span> ${AppData.cars.length}</div>
                <div><span class="font-medium">تأمين ساري:</span> ${AppData.cars.filter(c => c.insuranceExpiry && new Date(c.insuranceExpiry) >= new Date()).length}</div>
                <div><span class="font-medium">تأمين منتهي:</span> ${AppData.cars.filter(c => c.insuranceExpiry && new Date(c.insuranceExpiry) < new Date()).length}</div>
                <div><span class="font-medium">بدون تأمين:</span> ${AppData.cars.filter(c => !c.insuranceExpiry).length}</div>
            </div>
        </div>
    `;

    return html;
}

// طباعة التقرير
function printReport() {
    const reportTitle = window.currentReportTitle || 'تقرير';
    const reportContent = document.getElementById('reportContent').innerHTML;

    if (!reportContent || reportContent.includes('اختر نوع التقرير')) {
        showErrorMessage('لا يوجد تقرير للطباعة');
        return;
    }

    const printWindow = window.open('', '_blank');
    const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>${reportTitle} - RASHID INDUSTRIAL CO.</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    line-height: 1.6;
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    font-size: 12px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: right;
                }
                th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                }
                .car-section {
                    margin: 20px 0;
                    border: 1px solid #ddd;
                    padding: 15px;
                    border-radius: 5px;
                }
                .grand-total, .summary {
                    background-color: #f0f8ff;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .text-red-600 { color: #dc2626; }
                .text-green-600 { color: #16a34a; }
                .text-blue-600 { color: #2563eb; }
                .font-bold { font-weight: bold; }
                .font-semibold { font-weight: 600; }
                .text-center { text-align: center; }
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
                .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                .gap-4 { gap: 1rem; }
                .bg-gray-50, .bg-gray-100 { background-color: #f9fafb; }
                .bg-blue-50 { background-color: #eff6ff; }
                .bg-green-50 { background-color: #f0fdf4; }
                .bg-red-50 { background-color: #fef2f2; }
                .print-date {
                    text-align: left;
                    margin-top: 30px;
                    font-size: 10px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                }
                @media print {
                    body { margin: 0; }
                    .car-section { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            ${reportContent}
            <div class="print-date">
                تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

// تصدير التقرير إلى Excel
function exportReportToExcel() {
    const reportType = window.currentReportType;
    const reportTitle = window.currentReportTitle || 'تقرير';

    if (!reportType) {
        showErrorMessage('لا يوجد تقرير للتصدير');
        return;
    }

    let exportData = [];

    switch (reportType) {
        case 'totalExpensesByCar':
        case 'summaryExpensesByCar':
            exportData = generateExcelDataForCarExpenses();
            break;

        case 'expensesByPeriod':
            exportData = generateExcelDataForPeriodExpenses();
            break;

        case 'specificCarReport':
            exportData = generateExcelDataForSpecificCar();
            break;

        case 'treasuryStatement':
            exportData = generateExcelDataForTreasuryStatement();
            break;

        case 'treasuryAnalysis':
            exportData = generateExcelDataForTreasuryAnalysis();
            break;

        case 'carsData':
            exportData = generateExcelDataForCarsData();
            break;

        default:
            showErrorMessage('نوع التقرير غير مدعوم للتصدير');
            return;
    }

    if (exportData.length === 0) {
        showErrorMessage('لا توجد بيانات للتصدير');
        return;
    }

    // إنشاء ملف Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير');

    // تحميل الملف
    const fileName = `${reportTitle.replace(/[^\w\s]/gi, '')}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    showSuccessMessage('تم تصدير التقرير بنجاح');
}

// توليد بيانات Excel لتقرير مصروفات السيارات
function generateExcelDataForCarExpenses() {
    const carExpenses = {};

    AppData.expenses.forEach(expense => {
        const carKey = expense.carPlateNumber;
        if (!carExpenses[carKey]) {
            carExpenses[carKey] = {
                carName: expense.carName,
                plateNumber: expense.carPlateNumber,
                total: 0,
                expenses: []
            };
        }
        carExpenses[carKey].total += expense.amount;
        carExpenses[carKey].expenses.push(expense);
    });

    const exportData = [];

    Object.values(carExpenses).forEach(car => {
        exportData.push({
            'لوحة الأرقام': car.plateNumber,
            'اسم السيارة': car.carName,
            'إجمالي المصروفات': car.total,
            'عدد المصروفات': car.expenses.length
        });
    });

    return exportData;
}

// توليد بيانات Excel لتقرير الفترة الزمنية
function generateExcelDataForPeriodExpenses() {
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;

    const filteredExpenses = AppData.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        return expenseDate >= fromDate && expenseDate <= toDate;
    });

    return filteredExpenses.map(expense => ({
        'التاريخ': expense.date,
        'السيارة': expense.carPlateNumber,
        'اسم السيارة': expense.carName,
        'النوع': expense.type,
        'الوصف': expense.description,
        'المبلغ': expense.amount,
        'المورد': expense.vendor || ''
    }));
}

// توليد بيانات Excel لباقي التقارير
function generateExcelDataForSpecificCar() {
    const selectedCar = document.getElementById('reportSelectedCar').value;
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;

    const filteredExpenses = AppData.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        return expense.carPlateNumber === selectedCar &&
               expenseDate >= fromDate &&
               expenseDate <= toDate;
    });

    return filteredExpenses.map(expense => ({
        'التاريخ': expense.date,
        'النوع': expense.type,
        'الوصف': expense.description,
        'المبلغ': expense.amount,
        'المورد': expense.vendor || '',
        'الملاحظات': expense.notes || ''
    }));
}

function generateExcelDataForTreasuryStatement() {
    const allTransactions = [
        ...AppData.treasury.transactions.map(t => ({
            'التاريخ': t.date,
            'البيان': t.notes,
            'مدين': t.amount > 0 ? t.amount : '',
            'دائن': t.amount < 0 ? Math.abs(t.amount) : ''
        })),
        ...AppData.expenses.map(e => ({
            'التاريخ': e.date,
            'البيان': `${e.type} - ${e.description}`,
            'مدين': '',
            'دائن': e.amount
        }))
    ];

    return allTransactions.sort((a, b) => new Date(a['التاريخ']) - new Date(b['التاريخ']));
}

function generateExcelDataForTreasuryAnalysis() {
    const expensesByType = {};
    AppData.expenses.forEach(expense => {
        expensesByType[expense.type] = (expensesByType[expense.type] || 0) + expense.amount;
    });

    return Object.entries(expensesByType).map(([type, amount]) => ({
        'نوع المصروف': type,
        'المبلغ': amount,
        'النسبة': ((amount / AppData.expenses.reduce((sum, e) => sum + e.amount, 0)) * 100).toFixed(1) + '%'
    }));
}

function generateExcelDataForCarsData() {
    return AppData.cars.map(car => ({
        'لوحة الأرقام': car.plateNumber,
        'اسم السيارة': car.name,
        'العلامة التجارية': car.brand,
        'سنة الصنع': car.year,
        'النوع': car.type,
        'المالك': car.owner,
        'السائق': car.driver || '',
        'اللون': car.color || '',
        'انتهاء التأمين': car.insuranceExpiry || '',
        'انتهاء الاستمارة': car.registrationExpiry || '',
        'عداد الكيلومترات': car.mileage || ''
    }));
}

function initAIAnalysisPage() {
    populateAIAnalysisCarOptions();
    loadPreviousAnalyses();
    setupAIAnalysisForm();
    loadSavedApiKey();
}

// ملء خيارات السيارات في صفحة التحليل
function populateAIAnalysisCarOptions() {
    const carSelect = document.getElementById('aiAnalysisCar');
    carSelect.innerHTML = '<option value="">اختر السيارة...</option>';

    AppData.cars.forEach(car => {
        const option = document.createElement('option');
        option.value = car.plateNumber;
        option.textContent = `${car.plateNumber} - ${car.name}`;
        option.dataset.carData = JSON.stringify(car);
        carSelect.appendChild(option);
    });
}

// إعداد نموذج التحليل
function setupAIAnalysisForm() {
    const form = document.getElementById('aiAnalysisForm');
    form.addEventListener('submit', handleAIAnalysisSubmit);
}

// تحميل بيانات السيارة للتحليل
function loadCarAnalysisData() {
    const carSelect = document.getElementById('aiAnalysisCar');
    const selectedOption = carSelect.options[carSelect.selectedIndex];

    if (selectedOption && selectedOption.value) {
        const carData = JSON.parse(selectedOption.dataset.carData);

        document.getElementById('carAnalysisName').textContent = carData.name;
        document.getElementById('carAnalysisBrand').textContent = carData.brand;
        document.getElementById('carAnalysisYear').textContent = carData.year;
        document.getElementById('carAnalysisMileage').textContent = carData.mileage ? carData.mileage.toLocaleString() + ' كم' : 'غير محدد';

        document.getElementById('carAnalysisInfo').classList.remove('hidden');
    } else {
        document.getElementById('carAnalysisInfo').classList.add('hidden');
    }
}

// تحميل مفتاح API المحفوظ
function loadSavedApiKey() {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
        document.getElementById('geminiApiKey').value = savedKey;
    }
}

// حفظ مفتاح API
function saveApiKey() {
    const apiKey = document.getElementById('geminiApiKey').value;
    if (apiKey) {
        localStorage.setItem('geminiApiKey', apiKey);
    }
}

// معالجة إرسال نموذج التحليل
async function handleAIAnalysisSubmit(event) {
    event.preventDefault();

    const carPlateNumber = document.getElementById('aiAnalysisCar').value;
    const analysisType = document.getElementById('analysisType').value;
    const currentIssues = document.getElementById('currentIssues').value;
    const additionalInfo = document.getElementById('additionalInfo').value;
    const apiKey = document.getElementById('geminiApiKey').value;

    if (!apiKey) {
        showErrorMessage('يرجى إدخال مفتاح Gemini API');
        return;
    }

    // حفظ مفتاح API
    saveApiKey();

    // إظهار حالة التحميل
    document.getElementById('analysisResults').classList.add('hidden');
    document.getElementById('analysisLoading').classList.remove('hidden');

    try {
        // جمع بيانات السيارة والمصروفات
        const carData = AppData.cars.find(c => c.plateNumber === carPlateNumber);
        const carExpenses = AppData.expenses.filter(e => e.carPlateNumber === carPlateNumber);

        // إنشاء prompt للذكاء الاصطناعي
        const prompt = createAnalysisPrompt(carData, carExpenses, analysisType, currentIssues, additionalInfo);

        // استدعاء Gemini API
        const analysis = await callGeminiAPI(prompt, apiKey);

        // عرض النتائج
        displayAnalysisResults(analysis, carData, analysisType);

        // حفظ التحليل
        saveAnalysisToHistory(carData, analysisType, analysis);

        // تحديث قائمة التحليلات السابقة
        loadPreviousAnalyses();

    } catch (error) {
        console.error('خطأ في التحليل:', error);
        showErrorMessage('حدث خطأ أثناء التحليل. يرجى التحقق من مفتاح API والمحاولة مرة أخرى.');

        // إخفاء حالة التحميل
        document.getElementById('analysisLoading').classList.add('hidden');
        document.getElementById('analysisResults').classList.remove('hidden');
    }
}

// إنشاء prompt للذكاء الاصطناعي
function createAnalysisPrompt(carData, carExpenses, analysisType, currentIssues, additionalInfo) {
    let prompt = `أنت خبير في صيانة السيارات. قم بتحليل البيانات التالية وقدم توصيات مفصلة باللغة العربية.

معلومات السيارة:
- الاسم: ${carData.name}
- العلامة التجارية: ${carData.brand}
- سنة الصنع: ${carData.year}
- النوع: ${carData.type}
- عداد الكيلومترات: ${carData.mileage || 'غير محدد'}
- آخر فحص دوري: ${carData.lastInspection || 'غير محدد'}
- انتهاء التأمين: ${carData.insuranceExpiry || 'غير محدد'}

سجل المصروفات (آخر 12 شهر):
`;

    // إضافة المصروفات
    if (carExpenses.length > 0) {
        const recentExpenses = carExpenses
            .filter(e => {
                const expenseDate = new Date(e.date);
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                return expenseDate >= oneYearAgo;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        recentExpenses.forEach(expense => {
            prompt += `- ${expense.date}: ${expense.type} - ${expense.description} (${expense.amount} ريال)\n`;
        });
    } else {
        prompt += "- لا توجد مصروفات مسجلة\n";
    }

    if (currentIssues) {
        prompt += `\nالأعراض أو المشاكل الحالية:\n${currentIssues}\n`;
    }

    if (additionalInfo) {
        prompt += `\nمعلومات إضافية:\n${additionalInfo}\n`;
    }

    // إضافة نوع التحليل المطلوب
    switch (analysisType) {
        case 'general':
            prompt += `\nالمطلوب: تحليل عام شامل لحالة السيارة مع توصيات الصيانة العامة.`;
            break;
        case 'maintenance':
            prompt += `\nالمطلوب: تحليل مفصل للصيانة الدورية المطلوبة بناءً على الكيلومترات والوقت.`;
            break;
        case 'cost':
            prompt += `\nالمطلوب: تحليل التكاليف وتقييم كفاءة الإنفاق على الصيانة.`;
            break;
        case 'prediction':
            prompt += `\nالمطلوب: توقع الأعطال المحتملة والصيانة الوقائية المطلوبة.`;
            break;
        case 'efficiency':
            prompt += `\nالمطلوب: تحليل كفاءة السيارة وتوصيات لتحسين الأداء وتوفير الوقود.`;
            break;
    }

    prompt += `\n\nيرجى تقديم التحليل في شكل منظم يتضمن:
1. تقييم الحالة العامة
2. التوصيات الفورية
3. خطة الصيانة المقترحة
4. التكاليف المتوقعة
5. نصائح للحفاظ على السيارة

استخدم تنسيق واضح ومنظم مع استخدام النقاط والعناوين.`;

    return prompt;
}

// استدعاء Gemini API
async function callGeminiAPI(prompt, apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error('لم يتم الحصول على استجابة صالحة من API');
    }
}

// عرض نتائج التحليل
function displayAnalysisResults(analysis, carData, analysisType) {
    // إخفاء حالة التحميل
    document.getElementById('analysisLoading').classList.add('hidden');
    document.getElementById('analysisResults').classList.remove('hidden');

    // تنسيق النص
    const formattedAnalysis = formatAnalysisText(analysis);

    const analysisTypeNames = {
        'general': 'تحليل عام للحالة',
        'maintenance': 'تحليل الصيانة الدورية',
        'cost': 'تحليل التكاليف',
        'prediction': 'توقع الأعطال',
        'efficiency': 'تحليل الكفاءة'
    };

    const html = `
        <div class="analysis-report">
            <div class="report-header mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">تقرير التحليل الذكي</h2>
                        <p class="text-sm text-gray-600">${analysisTypeNames[analysisType]} - ${carData.plateNumber}</p>
                    </div>
                    <div class="text-right text-sm text-gray-500">
                        <div>${new Date().toLocaleDateString('ar-SA')}</div>
                        <div>${new Date().toLocaleTimeString('ar-SA')}</div>
                    </div>
                </div>
            </div>

            <div class="car-summary mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 class="font-semibold text-blue-800 mb-2">ملخص السيارة</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span class="font-medium">السيارة:</span> ${carData.name}</div>
                    <div><span class="font-medium">العلامة:</span> ${carData.brand}</div>
                    <div><span class="font-medium">السنة:</span> ${carData.year}</div>
                    <div><span class="font-medium">الكيلومترات:</span> ${carData.mileage ? carData.mileage.toLocaleString() + ' كم' : 'غير محدد'}</div>
                </div>
            </div>

            <div class="analysis-content bg-white border rounded-lg p-6">
                ${formattedAnalysis}
            </div>

            <div class="analysis-footer mt-6 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
                <p><i class="fas fa-robot ml-1"></i> تم إنشاء هذا التقرير بواسطة الذكاء الاصطناعي</p>
                <p class="mt-1">يرجى استشارة فني مختص قبل اتخاذ أي قرارات صيانة مهمة</p>
                <p class="mt-2 text-xs text-gray-500">مطور البرنامج: محمد مبروك عطية - Mohamed Mabrouk Attia</p>
            </div>
        </div>
    `;

    document.getElementById('analysisResults').innerHTML = html;

    // تفعيل أزرار الحفظ والطباعة
    document.getElementById('saveAnalysisBtn').disabled = false;
    document.getElementById('printAnalysisBtn').disabled = false;

    // حفظ التحليل الحالي للطباعة
    window.currentAnalysis = {
        carData: carData,
        analysisType: analysisType,
        analysis: analysis,
        timestamp: new Date().toISOString()
    };
}

// تنسيق نص التحليل
function formatAnalysisText(text) {
    // تحويل النص إلى HTML منسق
    let formatted = text
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^\d+\./gm, '<strong>$&</strong>')
        .replace(/^-/gm, '•')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

    // إضافة فقرات
    formatted = '<p>' + formatted + '</p>';

    // تحسين التنسيق للعناوين
    formatted = formatted.replace(/<p><strong>(\d+\..*?)<\/strong>/g, '<h4 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h4><p>');

    return formatted;
}

// حفظ التحليل في السجل
function saveAnalysisToHistory(carData, analysisType, analysis) {
    if (!AppData.aiAnalyses) {
        AppData.aiAnalyses = [];
    }

    const analysisRecord = {
        id: Date.now().toString(),
        carPlateNumber: carData.plateNumber,
        carName: carData.name,
        analysisType: analysisType,
        analysis: analysis,
        timestamp: new Date().toISOString()
    };

    AppData.aiAnalyses.unshift(analysisRecord); // إضافة في المقدمة

    // الاحتفاظ بآخر 50 تحليل فقط
    if (AppData.aiAnalyses.length > 50) {
        AppData.aiAnalyses = AppData.aiAnalyses.slice(0, 50);
    }

    saveData();
}

// تحميل التحليلات السابقة
function loadPreviousAnalyses() {
    const container = document.getElementById('previousAnalyses');
    const noDataDiv = document.getElementById('noPreviousAnalyses');

    if (!AppData.aiAnalyses || AppData.aiAnalyses.length === 0) {
        container.innerHTML = '';
        noDataDiv.classList.remove('hidden');
        return;
    }

    noDataDiv.classList.add('hidden');

    const analysisTypeNames = {
        'general': 'تحليل عام',
        'maintenance': 'تحليل الصيانة',
        'cost': 'تحليل التكاليف',
        'prediction': 'توقع الأعطال',
        'efficiency': 'تحليل الكفاءة'
    };

    // عرض آخر 10 تحليلات
    const recentAnalyses = AppData.aiAnalyses.slice(0, 10);

    container.innerHTML = recentAnalyses.map(analysis => `
        <div class="bg-gray-50 rounded-lg p-4 border">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-car text-blue-500 ml-2"></i>
                        <span class="font-semibold">${analysis.carPlateNumber} - ${analysis.carName}</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-1">
                        <span class="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                            ${analysisTypeNames[analysis.analysisType]}
                        </span>
                    </div>
                    <div class="text-xs text-gray-500">
                        ${new Date(analysis.timestamp).toLocaleString('ar-SA')}
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="viewPreviousAnalysis('${analysis.id}')"
                            class="btn-secondary text-xs p-2" title="عرض">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="deletePreviousAnalysis('${analysis.id}')"
                            class="btn-danger text-xs p-2" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// عرض تحليل سابق
function viewPreviousAnalysis(analysisId) {
    const analysis = AppData.aiAnalyses.find(a => a.id === analysisId);
    if (!analysis) {
        showErrorMessage('لم يتم العثور على التحليل');
        return;
    }

    const carData = AppData.cars.find(c => c.plateNumber === analysis.carPlateNumber) || {
        plateNumber: analysis.carPlateNumber,
        name: analysis.carName,
        brand: 'غير محدد',
        year: 'غير محدد',
        mileage: 'غير محدد'
    };

    displayAnalysisResults(analysis.analysis, carData, analysis.analysisType);

    // تحديث التحليل الحالي
    window.currentAnalysis = {
        carData: carData,
        analysisType: analysis.analysisType,
        analysis: analysis.analysis,
        timestamp: analysis.timestamp
    };
}

// حذف تحليل سابق
function deletePreviousAnalysis(analysisId) {
    if (!confirm('هل أنت متأكد من حذف هذا التحليل؟')) {
        return;
    }

    const analysisIndex = AppData.aiAnalyses.findIndex(a => a.id === analysisId);
    if (analysisIndex === -1) {
        showErrorMessage('لم يتم العثور على التحليل');
        return;
    }

    AppData.aiAnalyses.splice(analysisIndex, 1);
    saveData();
    loadPreviousAnalyses();

    showSuccessMessage('تم حذف التحليل بنجاح');
}

// حفظ تقرير التحليل
function saveAnalysisReport() {
    if (!window.currentAnalysis) {
        showErrorMessage('لا يوجد تحليل لحفظه');
        return;
    }

    const analysis = window.currentAnalysis;
    const analysisTypeNames = {
        'general': 'تحليل-عام',
        'maintenance': 'تحليل-الصيانة',
        'cost': 'تحليل-التكاليف',
        'prediction': 'توقع-الأعطال',
        'efficiency': 'تحليل-الكفاءة'
    };

    const reportContent = `
تقرير التحليل الذكي - RASHID INDUSTRIAL CO.
=============================================

معلومات السيارة:
- لوحة الأرقام: ${analysis.carData.plateNumber}
- اسم السيارة: ${analysis.carData.name}
- العلامة التجارية: ${analysis.carData.brand}
- سنة الصنع: ${analysis.carData.year}
- عداد الكيلومترات: ${analysis.carData.mileage ? analysis.carData.mileage.toLocaleString() + ' كم' : 'غير محدد'}

نوع التحليل: ${analysisTypeNames[analysis.analysisType]}
تاريخ التحليل: ${new Date(analysis.timestamp).toLocaleString('ar-SA')}

نتائج التحليل:
===============

${analysis.analysis}

---
تم إنشاء هذا التقرير بواسطة نظام التحليل الذكي
يرجى استشارة فني مختص قبل اتخاذ أي قرارات صيانة مهمة
    `;

    // إنشاء ملف نصي للتحميل
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تحليل-${analysis.carData.plateNumber}-${analysisTypeNames[analysis.analysisType]}-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();

    showSuccessMessage('تم حفظ تقرير التحليل بنجاح');
}

// طباعة تقرير التحليل
function printAnalysisReport() {
    if (!window.currentAnalysis) {
        showErrorMessage('لا يوجد تحليل للطباعة');
        return;
    }

    const analysis = window.currentAnalysis;
    const analysisTypeNames = {
        'general': 'تحليل عام للحالة',
        'maintenance': 'تحليل الصيانة الدورية',
        'cost': 'تحليل التكاليف',
        'prediction': 'توقع الأعطال',
        'efficiency': 'تحليل الكفاءة'
    };

    const printWindow = window.open('', '_blank');
    const formattedAnalysis = formatAnalysisText(analysis.analysis);

    const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>تقرير التحليل الذكي - ${analysis.carData.plateNumber}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    line-height: 1.6;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #667eea;
                    padding-bottom: 20px;
                }
                .company-name {
                    font-size: 24px;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 10px;
                }
                .report-title {
                    font-size: 18px;
                    color: #666;
                    margin-bottom: 5px;
                }
                .car-info {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #667eea;
                }
                .car-info h3 {
                    margin-top: 0;
                    color: #667eea;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-top: 10px;
                }
                .analysis-content {
                    margin: 20px 0;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                }
                .analysis-content h4 {
                    color: #667eea;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
                .ai-notice {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 5px;
                    padding: 10px;
                    margin: 20px 0;
                    text-align: center;
                    font-size: 14px;
                }
                @media print {
                    body { margin: 0; }
                    .header { break-after: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">RASHID INDUSTRIAL CO.</div>
                <div class="report-title">تقرير التحليل الذكي للسيارات</div>
                <div style="font-size: 14px; color: #888;">
                    ${analysisTypeNames[analysis.analysisType]}
                </div>
            </div>

            <div class="car-info">
                <h3>معلومات السيارة</h3>
                <div class="info-grid">
                    <div><strong>لوحة الأرقام:</strong> ${analysis.carData.plateNumber}</div>
                    <div><strong>اسم السيارة:</strong> ${analysis.carData.name}</div>
                    <div><strong>العلامة التجارية:</strong> ${analysis.carData.brand}</div>
                    <div><strong>سنة الصنع:</strong> ${analysis.carData.year}</div>
                    <div><strong>عداد الكيلومترات:</strong> ${analysis.carData.mileage ? analysis.carData.mileage.toLocaleString() + ' كم' : 'غير محدد'}</div>
                    <div><strong>تاريخ التحليل:</strong> ${new Date(analysis.timestamp).toLocaleString('ar-SA')}</div>
                </div>
            </div>

            <div class="analysis-content">
                <h3 style="color: #667eea; margin-top: 0;">نتائج التحليل</h3>
                ${formattedAnalysis}
            </div>

            <div class="ai-notice">
                <strong>تنبيه:</strong> تم إنشاء هذا التقرير بواسطة الذكاء الاصطناعي.
                يرجى استشارة فني مختص قبل اتخاذ أي قرارات صيانة مهمة.
            </div>

            <div class="footer">
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
                <p>نظام إدارة مصروفات السيارات - RASHID INDUSTRIAL CO.</p>
                <p>مطور البرنامج: محمد مبروك عطية - Mohamed Mabrouk Attia</p>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

// وظائف النسخ الاحتياطي والاستعادة
function createBackup() {
    const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: AppData
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup-car-expense-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    showSuccessMessage('تم إنشاء النسخة الاحتياطية بنجاح');
}

function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);

            if (backupData.version && backupData.data) {
                if (confirm('هل أنت متأكد من استعادة النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
                    Object.assign(AppData, backupData.data);
                    saveData();

                    showSuccessMessage('تم استعادة النسخة الاحتياطية بنجاح');

                    // إعادة تحميل الصفحة لتحديث جميع البيانات
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                }
            } else {
                showErrorMessage('ملف النسخة الاحتياطية غير صالح');
            }
        } catch (error) {
            console.error('خطأ في استعادة النسخة الاحتياطية:', error);
            showErrorMessage('حدث خطأ في قراءة ملف النسخة الاحتياطية');
        }
    };

    reader.readAsText(file);
    event.target.value = ''; // إعادة تعيين input
}

// إعدادات التخزين السحابي
const CloudStorage = {
    googleDrive: {
        clientId: '', // سيتم إدخاله من المستخدم
        apiKey: '',   // سيتم إدخاله من المستخدم
        discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        scopes: 'https://www.googleapis.com/auth/drive.file',
        isInitialized: false,
        isSignedIn: false
    }
};

// تهيئة Google Drive API
async function initGoogleDrive() {
    const clientId = localStorage.getItem('googleDriveClientId');
    const apiKey = localStorage.getItem('googleDriveApiKey');

    if (!clientId || !apiKey) {
        showErrorMessage('يرجى إدخال معرف العميل ومفتاح API لـ Google Drive في الإعدادات');
        return false;
    }

    try {
        await gapi.load('auth2', () => {
            gapi.auth2.init({
                client_id: clientId
            });
        });

        await gapi.load('client', async () => {
            await gapi.client.init({
                apiKey: apiKey,
                clientId: clientId,
                discoveryDocs: [CloudStorage.googleDrive.discoveryDoc],
                scope: CloudStorage.googleDrive.scopes
            });
        });

        CloudStorage.googleDrive.isInitialized = true;
        CloudStorage.googleDrive.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();

        return true;
    } catch (error) {
        console.error('خطأ في تهيئة Google Drive:', error);
        showErrorMessage('فشل في تهيئة Google Drive API');
        return false;
    }
}

// تسجيل الدخول إلى Google Drive
async function signInGoogleDrive() {
    if (!CloudStorage.googleDrive.isInitialized) {
        const initialized = await initGoogleDrive();
        if (!initialized) return false;
    }

    try {
        const authInstance = gapi.auth2.getAuthInstance();
        await authInstance.signIn();
        CloudStorage.googleDrive.isSignedIn = true;
        showSuccessMessage('تم تسجيل الدخول إلى Google Drive بنجاح');
        return true;
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showErrorMessage('فشل في تسجيل الدخول إلى Google Drive');
        return false;
    }
}

// رفع نسخة احتياطية إلى Google Drive
async function uploadToGoogleDrive() {
    if (!CloudStorage.googleDrive.isSignedIn) {
        const signedIn = await signInGoogleDrive();
        if (!signedIn) return;
    }

    try {
        const backupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: AppData
        };

        const fileMetadata = {
            name: `car-expense-backup-${new Date().toISOString().split('T')[0]}.json`,
            parents: ['appDataFolder'] // مجلد خاص بالتطبيق
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
        form.append('file', new Blob([JSON.stringify(backupData, null, 2)], {type: 'application/json'}));

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({
                'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
            }),
            body: form
        });

        if (response.ok) {
            showSuccessMessage('تم رفع النسخة الاحتياطية إلى Google Drive بنجاح');
        } else {
            throw new Error('فشل في رفع الملف');
        }
    } catch (error) {
        console.error('خطأ في رفع النسخة الاحتياطية:', error);
        showErrorMessage('فشل في رفع النسخة الاحتياطية إلى Google Drive');
    }
}

// تحميل نسخة احتياطية من Google Drive
async function downloadFromGoogleDrive() {
    if (!CloudStorage.googleDrive.isSignedIn) {
        const signedIn = await signInGoogleDrive();
        if (!signedIn) return;
    }

    try {
        // البحث عن ملفات النسخ الاحتياطية
        const response = await gapi.client.drive.files.list({
            q: "name contains 'car-expense-backup' and parents in 'appDataFolder'",
            orderBy: 'createdTime desc',
            pageSize: 10
        });

        const files = response.result.files;
        if (files.length === 0) {
            showInfoMessage('لا توجد نسخ احتياطية في Google Drive');
            return;
        }

        // عرض قائمة الملفات للاختيار
        showGoogleDriveFilesList(files);

    } catch (error) {
        console.error('خطأ في تحميل قائمة الملفات:', error);
        showErrorMessage('فشل في الوصول إلى ملفات Google Drive');
    }
}

// عرض قائمة ملفات Google Drive
function showGoogleDriveFilesList(files) {
    const filesList = files.map(file => `
        <div class="flex justify-between items-center p-3 border rounded mb-2">
            <div>
                <div class="font-medium">${file.name}</div>
                <div class="text-sm text-gray-500">${new Date(file.createdTime).toLocaleString('ar-SA')}</div>
            </div>
            <button onclick="restoreFromGoogleDrive('${file.id}')" class="btn-primary text-sm">
                استعادة
            </button>
        </div>
    `).join('');

    const modal = createModal('النسخ الاحتياطية في Google Drive', `
        <div class="space-y-4">
            <p class="text-sm text-gray-600">اختر النسخة الاحتياطية التي تريد استعادتها:</p>
            <div class="max-h-64 overflow-y-auto">
                ${filesList}
            </div>
        </div>
    `, [
        {
            text: 'إلغاء',
            class: 'btn-secondary',
            onclick: 'closeModal()'
        }
    ]);

    document.body.appendChild(modal);
}

// استعادة نسخة احتياطية من Google Drive
async function restoreFromGoogleDrive(fileId) {
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });

        const backupData = JSON.parse(response.body);

        if (backupData.version && backupData.data) {
            if (confirm('هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
                Object.assign(AppData, backupData.data);
                saveData();

                showSuccessMessage('تم استعادة النسخة الاحتياطية من Google Drive بنجاح');
                closeModal();

                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        } else {
            showErrorMessage('ملف النسخة الاحتياطية غير صالح');
        }
    } catch (error) {
        console.error('خطأ في استعادة النسخة الاحتياطية:', error);
        showErrorMessage('فشل في استعادة النسخة الاحتياطية');
    }
}

// إعدادات Google Drive
function showGoogleDriveSettings() {
    const currentClientId = localStorage.getItem('googleDriveClientId') || '';
    const currentApiKey = localStorage.getItem('googleDriveApiKey') || '';

    const modal = createModal('إعدادات Google Drive', `
        <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold text-blue-800 mb-2">كيفية الحصول على المفاتيح:</h4>
                <ol class="text-sm text-blue-700 space-y-1">
                    <li>1. اذهب إلى <a href="https://console.cloud.google.com/" target="_blank" class="underline">Google Cloud Console</a></li>
                    <li>2. أنشئ مشروع جديد أو اختر مشروع موجود</li>
                    <li>3. فعل Google Drive API</li>
                    <li>4. أنشئ بيانات اعتماد (OAuth 2.0 Client ID)</li>
                    <li>5. أنشئ مفتاح API</li>
                </ol>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
                <input type="text" id="googleDriveClientId" class="form-input w-full"
                       value="${currentClientId}" placeholder="أدخل Client ID">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <input type="text" id="googleDriveApiKey" class="form-input w-full"
                       value="${currentApiKey}" placeholder="أدخل API Key">
            </div>

            <div class="bg-yellow-50 p-3 rounded">
                <p class="text-sm text-yellow-700">
                    <i class="fas fa-info-circle ml-1"></i>
                    هذه المعلومات آمنة ومحفوظة محلياً في متصفحك فقط
                </p>
            </div>
        </div>
    `, [
        {
            text: 'حفظ',
            class: 'btn-primary',
            onclick: 'saveGoogleDriveSettings()'
        },
        {
            text: 'إلغاء',
            class: 'btn-secondary',
            onclick: 'closeModal()'
        }
    ]);

    document.body.appendChild(modal);
}

// حفظ إعدادات Google Drive
function saveGoogleDriveSettings() {
    const clientId = document.getElementById('googleDriveClientId').value.trim();
    const apiKey = document.getElementById('googleDriveApiKey').value.trim();

    if (!clientId || !apiKey) {
        showErrorMessage('يرجى إدخال جميع المعلومات المطلوبة');
        return;
    }

    localStorage.setItem('googleDriveClientId', clientId);
    localStorage.setItem('googleDriveApiKey', apiKey);

    showSuccessMessage('تم حفظ إعدادات Google Drive بنجاح');
    closeModal();
}

// إضافة وظائف النسخ الاحتياطي لقائمة الإعدادات
function showAdvancedSettings() {
    const modal = createModal('الإعدادات المتقدمة', `
        <div class="space-y-6">
            <div>
                <h4 class="font-semibold text-gray-800 mb-3">النسخ الاحتياطي المحلي</h4>
                <div class="space-y-3">
                    <button onclick="createBackup(); closeModal();" class="btn-success w-full">
                        <i class="fas fa-download ml-2"></i>
                        إنشاء نسخة احتياطية محلية
                    </button>

                    <div class="relative">
                        <input type="file" id="restoreBackupFile" accept=".json" class="hidden" onchange="restoreBackup(event)">
                        <button onclick="document.getElementById('restoreBackupFile').click()" class="btn-primary w-full">
                            <i class="fas fa-upload ml-2"></i>
                            استعادة نسخة احتياطية محلية
                        </button>
                    </div>
                </div>
            </div>

            <div class="border-t pt-4">
                <h4 class="font-semibold text-gray-800 mb-3">التخزين السحابي</h4>
                <div class="space-y-3">
                    <button onclick="showGoogleDriveSettings()" class="btn-secondary w-full">
                        <i class="fab fa-google-drive ml-2"></i>
                        إعدادات Google Drive
                    </button>

                    <button onclick="uploadToGoogleDrive()" class="btn-success w-full">
                        <i class="fas fa-cloud-upload-alt ml-2"></i>
                        رفع نسخة احتياطية إلى Google Drive
                    </button>

                    <button onclick="downloadFromGoogleDrive()" class="btn-primary w-full">
                        <i class="fas fa-cloud-download-alt ml-2"></i>
                        استعادة من Google Drive
                    </button>

                    <div class="bg-blue-50 p-3 rounded text-sm">
                        <p class="text-blue-700">
                            <i class="fas fa-info-circle ml-1"></i>
                            يتطلب إعداد Google Drive API مرة واحدة فقط
                        </p>
                    </div>
                </div>
            </div>

            <div class="border-t pt-4">
                <h4 class="font-semibold text-gray-800 mb-3">إعادة تعيين البيانات</h4>
                <button onclick="resetAllData()" class="btn-danger w-full">
                    <i class="fas fa-trash-alt ml-2"></i>
                    مسح جميع البيانات
                </button>
                <p class="text-xs text-gray-500 mt-2">تحذير: هذا الإجراء لا يمكن التراجع عنه</p>
            </div>

            <div class="border-t pt-4">
                <h4 class="font-semibold text-gray-800 mb-3">معلومات النظام</h4>
                <div class="text-sm space-y-1">
                    <div><span class="font-medium">الإصدار:</span> 1.0</div>
                    <div><span class="font-medium">المطور:</span> محمد مبروك عطية</div>
                    <div><span class="font-medium">Developer:</span> Mohamed Mabrouk Attia</div>
                    <div><span class="font-medium">آخر حفظ:</span> ${AppData.settings.lastLogin ? new Date(AppData.settings.lastLogin).toLocaleString('ar-SA') : 'غير محدد'}</div>
                    <div><span class="font-medium">عدد السيارات:</span> ${AppData.cars.length}</div>
                    <div><span class="font-medium">عدد المصروفات:</span> ${AppData.expenses.length}</div>
                    <div><span class="font-medium">عدد الموظفين:</span> ${AppData.employees.length}</div>
                </div>
            </div>

            <div class="border-t pt-4">
                <h4 class="font-semibold text-gray-800 mb-3">معلومات التخزين</h4>
                <div class="text-sm space-y-1" id="storageInfo">
                    <!-- سيتم ملؤها بـ JavaScript -->
                </div>
                <button onclick="showStorageDetails()" class="btn-secondary w-full mt-3">
                    <i class="fas fa-info-circle ml-2"></i>
                    تفاصيل التخزين
                </button>
            </div>
        </div>
    `, [
        {
            text: 'إغلاق',
            class: 'btn-secondary',
            onclick: 'closeModal()'
        }
    ]);

    document.body.appendChild(modal);
}

// عرض معلومات التخزين
function getStorageInfo() {
    try {
        // حساب حجم البيانات المحفوظة
        const dataString = localStorage.getItem('carExpenseApp');
        const dataSize = dataString ? (dataString.length / 1024).toFixed(2) : '0';

        // حساب عدد المرفقات
        const attachmentCount = AppData.expenses.filter(e => e.attachment).length;

        // حساب حجم المرفقات التقريبي
        let attachmentSize = 0;
        AppData.expenses.forEach(expense => {
            if (expense.attachment && expense.attachment.data) {
                attachmentSize += expense.attachment.data.length;
            }
        });
        attachmentSize = (attachmentSize / 1024).toFixed(2);

        // حساب المساحة المتاحة التقريبية (localStorage عادة 5-10 ميجا)
        const estimatedLimit = 5120; // 5 ميجا بالكيلوبايت
        const usagePercentage = ((parseFloat(dataSize) / estimatedLimit) * 100).toFixed(1);

        return {
            totalSize: dataSize,
            attachmentCount: attachmentCount,
            attachmentSize: attachmentSize,
            usagePercentage: usagePercentage,
            estimatedLimit: estimatedLimit
        };
    } catch (error) {
        console.error('خطأ في حساب معلومات التخزين:', error);
        return null;
    }
}

// تنظيف المرفقات القديمة
function cleanupOldAttachments() {
    if (!confirm('هل تريد حذف المرفقات الأقدم من 6 أشهر لتوفير مساحة التخزين؟')) {
        return;
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let cleanedCount = 0;
    AppData.expenses.forEach(expense => {
        if (expense.attachment && new Date(expense.date) < sixMonthsAgo) {
            expense.attachment = { name: expense.attachment.name, hasAttachment: true, cleaned: true };
            cleanedCount++;
        }
    });

    if (cleanedCount > 0) {
        saveData();
        showSuccessMessage(`تم تنظيف ${cleanedCount} مرفق قديم`);
    } else {
        showInfoMessage('لا توجد مرفقات قديمة للتنظيف');
    }
}

// إعادة تعيين جميع البيانات
function resetAllData() {
    if (!confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        return;
    }

    if (!confirm('تأكيد أخير: سيتم مسح جميع البيانات نهائياً. هل تريد المتابعة؟')) {
        return;
    }

    // إعادة تعيين جميع البيانات
    AppData.treasury = { balance: 0, transactions: [] };
    AppData.employees = [];
    AppData.cars = [];
    AppData.expenses = [];
    AppData.aiAnalyses = [];
    AppData.settings = {
        currency: 'ريال',
        lastLogin: null
    };

    // حفظ البيانات الفارغة
    saveData();

    // إعادة تحميل الصفحة
    showSuccessMessage('تم مسح جميع البيانات بنجاح');
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// تحسين وظيفة الإعدادات الأساسية
function showSettings() {
    const modal = createModal('الإعدادات', `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الحالية</label>
                <input type="password" id="currentPassword" class="form-input" placeholder="أدخل كلمة المرور الحالية">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الجديدة</label>
                <input type="password" id="newPassword" class="form-input" placeholder="أدخل كلمة المرور الجديدة">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">تأكيد كلمة المرور الجديدة</label>
                <input type="password" id="confirmPassword" class="form-input" placeholder="أعد إدخال كلمة المرور الجديدة">
            </div>

            <div class="border-t pt-4">
                <h4 class="font-medium text-gray-700 mb-2">إعدادات أخرى</h4>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="checkbox" id="autoSave" class="ml-2" checked>
                        <span class="text-sm">حفظ تلقائي للبيانات</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="showNotifications" class="ml-2" checked>
                        <span class="text-sm">إظهار الإشعارات</span>
                    </label>
                </div>
            </div>

            <div class="border-t pt-4">
                <button onclick="showAdvancedSettings(); closeModal();" class="btn-secondary w-full">
                    <i class="fas fa-cogs ml-2"></i>
                    الإعدادات المتقدمة
                </button>
            </div>
        </div>
    `, [
        {
            text: 'حفظ التغييرات',
            class: 'btn-primary',
            onclick: 'saveSettings()'
        },
        {
            text: 'إلغاء',
            class: 'btn-secondary',
            onclick: 'closeModal()'
        }
    ]);

    document.body.appendChild(modal);

    // تحديث معلومات التخزين
    updateStorageInfo();
}

// تحديث معلومات التخزين في الإعدادات
function updateStorageInfo() {
    const storageInfo = getStorageInfo();
    const container = document.getElementById('storageInfo');

    if (storageInfo && container) {
        const warningClass = parseFloat(storageInfo.usagePercentage) > 80 ? 'text-red-600' :
                           parseFloat(storageInfo.usagePercentage) > 60 ? 'text-yellow-600' : 'text-green-600';

        container.innerHTML = `
            <div><span class="font-medium">حجم البيانات:</span> ${storageInfo.totalSize} كيلوبايت</div>
            <div><span class="font-medium">عدد المرفقات:</span> ${storageInfo.attachmentCount}</div>
            <div><span class="font-medium">حجم المرفقات:</span> ${storageInfo.attachmentSize} كيلوبايت</div>
            <div><span class="font-medium">الاستخدام:</span> <span class="${warningClass}">${storageInfo.usagePercentage}%</span></div>
        `;
    }
}

// عرض تفاصيل التخزين
function showStorageDetails() {
    const storageInfo = getStorageInfo();

    if (!storageInfo) {
        showErrorMessage('لا يمكن الحصول على معلومات التخزين');
        return;
    }

    const warningMessage = parseFloat(storageInfo.usagePercentage) > 80 ?
        '<div class="bg-red-50 border border-red-200 rounded p-3 mb-4"><p class="text-red-700 text-sm"><i class="fas fa-exclamation-triangle ml-1"></i> تحذير: مساحة التخزين تقترب من الامتلاء!</p></div>' :
        parseFloat(storageInfo.usagePercentage) > 60 ?
        '<div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4"><p class="text-yellow-700 text-sm"><i class="fas fa-info-circle ml-1"></i> تنبيه: مساحة التخزين تتجاوز 60%</p></div>' : '';

    const modal = createModal('تفاصيل التخزين', `
        ${warningMessage}

        <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold text-blue-800 mb-2">معلومات التخزين</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><span class="font-medium">إجمالي البيانات:</span> ${storageInfo.totalSize} كيلوبايت</div>
                    <div><span class="font-medium">عدد المرفقات:</span> ${storageInfo.attachmentCount}</div>
                    <div><span class="font-medium">حجم المرفقات:</span> ${storageInfo.attachmentSize} كيلوبايت</div>
                    <div><span class="font-medium">نسبة الاستخدام:</span> ${storageInfo.usagePercentage}%</div>
                </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-2">نصائح لتوفير المساحة</h4>
                <ul class="text-sm space-y-1">
                    <li>• احذف المرفقات غير الضرورية</li>
                    <li>• أنشئ نسخة احتياطية وامسح البيانات القديمة</li>
                    <li>• ضغط الصور قبل رفعها</li>
                    <li>• استخدم ملفات PDF بدلاً من الصور للمستندات</li>
                </ul>
            </div>

            <div class="space-y-2">
                <button onclick="cleanupOldAttachments(); closeModal();" class="btn-warning w-full">
                    <i class="fas fa-broom ml-2"></i>
                    تنظيف المرفقات القديمة (أقدم من 6 أشهر)
                </button>

                <button onclick="createBackup(); closeModal();" class="btn-success w-full">
                    <i class="fas fa-download ml-2"></i>
                    إنشاء نسخة احتياطية
                </button>
            </div>
        </div>
    `, [
        {
            text: 'إغلاق',
            class: 'btn-secondary',
            onclick: 'closeModal()'
        }
    ]);

    document.body.appendChild(modal);
}

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);
