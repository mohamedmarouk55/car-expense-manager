// إدارة الملف الشخصي والإعدادات
class UserProfile {
    constructor() {
        this.currentUser = null;
        this.userStats = {
            carsCount: 0,
            employeesCount: 0,
            expensesCount: 0,
            totalExpenses: 0
        };
        this.init();
    }

    // تهيئة الملف الشخصي
    async init() {
        if (authManager.isUserAuthenticated()) {
            this.currentUser = authManager.getCurrentUser();
            await this.loadUserProfile();
            await this.loadUserStatistics();
        }
    }

    // تحميل بيانات المستخدم
    async loadUserProfile() {
        if (!this.currentUser) return;

        try {
            // تحديث معلومات المستخدم في الواجهة
            this.updateUserDisplay();
            
            // تحديث حالة المزامنة
            this.updateSyncStatus();

        } catch (error) {
            console.error('خطأ في تحميل الملف الشخصي:', error);
        }
    }

    // تحديث عرض معلومات المستخدم
    updateUserDisplay() {
        const userDisplayName = document.getElementById('userDisplayName');
        const userEmail = document.getElementById('userEmail');
        const userJoinDate = document.getElementById('userJoinDate');
        const userLastLogin = document.getElementById('userLastLogin');

        if (userDisplayName) {
            userDisplayName.textContent = this.currentUser.user_metadata?.full_name || 
                                         this.currentUser.email.split('@')[0];
        }

        if (userEmail) {
            userEmail.textContent = this.currentUser.email;
        }

        if (userJoinDate) {
            const joinDate = new Date(this.currentUser.created_at);
            userJoinDate.textContent = joinDate.toLocaleDateString('ar-SA');
        }

        if (userLastLogin) {
            const lastLogin = new Date(this.currentUser.last_sign_in_at || this.currentUser.created_at);
            userLastLogin.textContent = lastLogin.toLocaleDateString('ar-SA');
        }
    }

    // تحديث حالة المزامنة
    updateSyncStatus() {
        const syncStatus = document.getElementById('syncStatus');
        if (!syncStatus) return;

        if (realtimeSync && realtimeSync.getConnectionStatus().isConnected) {
            syncStatus.textContent = 'متصل';
            syncStatus.className = 'text-sm font-medium text-green-600';
        } else {
            syncStatus.textContent = 'غير متصل';
            syncStatus.className = 'text-sm font-medium text-red-600';
        }
    }

    // تحميل إحصائيات المستخدم
    async loadUserStatistics() {
        try {
            // الحصول على إحصائيات من قاعدة البيانات
            const stats = await dbAPI.getStatistics();
            
            if (stats.success) {
                this.userStats = stats.data;
                this.updateStatisticsDisplay();
            }

        } catch (error) {
            console.error('خطأ في تحميل الإحصائيات:', error);
        }
    }

    // تحديث عرض الإحصائيات
    updateStatisticsDisplay() {
        const userCarsCount = document.getElementById('userCarsCount');
        const userEmployeesCount = document.getElementById('userEmployeesCount');
        const userExpensesCount = document.getElementById('userExpensesCount');
        const userTotalExpenses = document.getElementById('userTotalExpenses');

        if (userCarsCount) {
            userCarsCount.textContent = this.userStats.carsCount || 0;
        }

        if (userEmployeesCount) {
            userEmployeesCount.textContent = this.userStats.employeesCount || 0;
        }

        if (userExpensesCount) {
            userExpensesCount.textContent = this.userStats.expenseCount || 0;
        }

        if (userTotalExpenses) {
            const total = this.userStats.totalExpenses || 0;
            userTotalExpenses.textContent = this.formatCurrency(total);
        }
    }

    // تنسيق العملة
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }

    // تصدير جميع البيانات
    async exportAllData() {
        try {
            showNotification('جاري تحضير البيانات للتصدير...', 'info');

            // الحصول على جميع البيانات
            const [carsResult, employeesResult, expensesResult] = await Promise.all([
                dbAPI.getCars(),
                dbAPI.getEmployees(),
                dbAPI.getExpenses()
            ]);

            const exportData = {
                exportDate: new Date().toISOString(),
                user: {
                    email: this.currentUser.email,
                    name: this.currentUser.user_metadata?.full_name
                },
                cars: carsResult.success ? carsResult.data : [],
                employees: employeesResult.success ? employeesResult.data : [],
                expenses: expensesResult.success ? expensesResult.data : [],
                statistics: this.userStats
            };

            // تحويل إلى JSON وتنزيل
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `car-management-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            showNotification('تم تصدير البيانات بنجاح!', 'success');

        } catch (error) {
            console.error('خطأ في تصدير البيانات:', error);
            showNotification('خطأ في تصدير البيانات: ' + error.message, 'error');
        }
    }

    // عرض نافذة استيراد البيانات
    showImportDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-upload text-blue-500 ml-2"></i>
                    استيراد البيانات
                </h3>
                
                <div class="mb-4">
                    <p class="text-gray-600 mb-3">اختر ملف النسخة الاحتياطية لاستيراد البيانات:</p>
                    
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input type="file" id="importFile" accept=".json" class="hidden" onchange="userProfile.handleImportFile(event)">
                        <i class="fas fa-file-upload text-3xl text-gray-400 mb-2"></i>
                        <p class="text-gray-600">انقر لاختيار ملف JSON</p>
                        <button onclick="document.getElementById('importFile').click()" class="mt-2 btn-secondary">
                            اختيار ملف
                        </button>
                    </div>
                    
                    <div class="mt-3 p-3 bg-yellow-50 rounded-lg">
                        <div class="flex items-start">
                            <i class="fas fa-exclamation-triangle text-yellow-500 ml-2 mt-1"></i>
                            <div class="text-sm text-yellow-700">
                                <p class="font-medium">تحذير:</p>
                                <p>سيتم دمج البيانات المستوردة مع البيانات الحالية. تأكد من صحة الملف قبل الاستيراد.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex space-x-2">
                    <button onclick="userProfile.closeImportDialog()" class="btn-secondary flex-1">
                        إلغاء
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        this.importDialog = dialog;
    }

    // معالجة ملف الاستيراد
    async handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // التحقق من صحة البيانات
            if (!this.validateImportData(data)) {
                showNotification('ملف البيانات غير صحيح أو تالف', 'error');
                return;
            }

            // تأكيد الاستيراد
            if (confirm('هل أنت متأكد من استيراد هذه البيانات؟')) {
                await this.importData(data);
            }

        } catch (error) {
            console.error('خطأ في قراءة الملف:', error);
            showNotification('خطأ في قراءة الملف: ' + error.message, 'error');
        }
    }

    // التحقق من صحة بيانات الاستيراد
    validateImportData(data) {
        return data && 
               typeof data === 'object' && 
               Array.isArray(data.cars) && 
               Array.isArray(data.employees) && 
               Array.isArray(data.expenses);
    }

    // استيراد البيانات
    async importData(data) {
        try {
            showNotification('جاري استيراد البيانات...', 'info');

            let importedCount = 0;

            // استيراد السيارات
            for (const car of data.cars) {
                const result = await dbAPI.addCar({
                    name: car.name,
                    model: car.model,
                    year: car.year,
                    licensePlate: car.license_plate,
                    color: car.color,
                    notes: car.notes
                });
                if (result.success) importedCount++;
            }

            // استيراد الموظفين
            for (const employee of data.employees) {
                const result = await dbAPI.addEmployee({
                    name: employee.name,
                    phone: employee.phone,
                    email: employee.email,
                    position: employee.position,
                    salary: employee.salary,
                    hireDate: employee.hire_date,
                    notes: employee.notes
                });
                if (result.success) importedCount++;
            }

            // استيراد المصروفات
            for (const expense of data.expenses) {
                const result = await dbAPI.addExpense({
                    carId: expense.car_id,
                    employeeId: expense.employee_id,
                    type: expense.type,
                    amount: expense.amount,
                    description: expense.description,
                    date: expense.date,
                    vendor: expense.vendor,
                    paymentMethod: expense.payment_method
                });
                if (result.success) importedCount++;
            }

            this.closeImportDialog();
            showNotification(`تم استيراد ${importedCount} عنصر بنجاح!`, 'success');

            // إعادة تحميل الإحصائيات
            await this.loadUserStatistics();

        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            showNotification('خطأ في استيراد البيانات: ' + error.message, 'error');
        }
    }

    // إغلاق نافذة الاستيراد
    closeImportDialog() {
        if (this.importDialog) {
            this.importDialog.remove();
            this.importDialog = null;
        }
    }

    // تحديث الملف الشخصي
    async updateProfile(profileData) {
        try {
            // يمكن إضافة تحديث بيانات المستخدم هنا
            showNotification('تم تحديث الملف الشخصي بنجاح!', 'success');
        } catch (error) {
            console.error('خطأ في تحديث الملف الشخصي:', error);
            showNotification('خطأ في تحديث الملف الشخصي: ' + error.message, 'error');
        }
    }

    // تحديث الإعدادات
    updateSettings(settings) {
        // حفظ الإعدادات في localStorage
        localStorage.setItem('userSettings', JSON.stringify(settings));
        showNotification('تم حفظ الإعدادات بنجاح!', 'success');
    }

    // الحصول على الإعدادات
    getSettings() {
        const defaultSettings = {
            language: 'ar',
            currency: 'SAR',
            notifications: true,
            autoSync: true,
            darkMode: false
        };

        const savedSettings = localStorage.getItem('userSettings');
        return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    }
}

// إنشاء مثيل من إدارة الملف الشخصي
const userProfile = new UserProfile();

// وظائف مساعدة عامة
function exportAllData() {
    userProfile.exportAllData();
}

function showImportDialog() {
    userProfile.showImportDialog();
}

// تحديث الملف الشخصي عند تغيير الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // مراقبة تغيير الصفحات
    const originalShowPage = window.showPage;
    window.showPage = function(pageId) {
        if (originalShowPage) {
            originalShowPage(pageId);
        }
        
        // إذا كانت صفحة الملف الشخصي، تحديث البيانات
        if (pageId === 'userProfile') {
            setTimeout(() => {
                userProfile.loadUserProfile();
                userProfile.loadUserStatistics();
            }, 100);
        }
    };
});
