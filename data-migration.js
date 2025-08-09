// نظام ترحيل البيانات من Local Storage إلى Supabase
class DataMigration {
    constructor() {
        this.migrationStatus = {
            cars: false,
            employees: false,
            expenses: false,
            treasury: false,
            completed: false
        };
        this.migrationLog = [];
    }

    // بدء عملية الترحيل
    async startMigration() {
        if (!authManager.isUserAuthenticated()) {
            showNotification('يجب تسجيل الدخول أولاً لبدء الترحيل', 'error');
            return false;
        }

        try {
            this.showMigrationDialog();
            return true;
        } catch (error) {
            console.error('خطأ في بدء الترحيل:', error);
            showNotification('خطأ في بدء عملية الترحيل', 'error');
            return false;
        }
    }

    // عرض نافذة الترحيل
    showMigrationDialog() {
        const localData = this.analyzeLocalData();
        
        if (localData.totalItems === 0) {
            showNotification('لا توجد بيانات محلية للترحيل', 'info');
            return;
        }

        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-cloud-upload-alt text-blue-500 ml-2"></i>
                    ترحيل البيانات إلى السحابة
                </h3>
                
                <div class="mb-4">
                    <p class="text-gray-600 mb-3">تم العثور على البيانات التالية في التخزين المحلي:</p>
                    
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>السيارات:</span>
                            <span class="font-semibold">${localData.cars} عنصر</span>
                        </div>
                        <div class="flex justify-between">
                            <span>الموظفين:</span>
                            <span class="font-semibold">${localData.employees} عنصر</span>
                        </div>
                        <div class="flex justify-between">
                            <span>المصروفات:</span>
                            <span class="font-semibold">${localData.expenses} عنصر</span>
                        </div>
                        <div class="flex justify-between">
                            <span>معاملات الخزينة:</span>
                            <span class="font-semibold">${localData.treasury} عنصر</span>
                        </div>
                    </div>
                    
                    <div class="mt-3 p-3 bg-yellow-50 rounded-lg">
                        <div class="flex items-start">
                            <i class="fas fa-exclamation-triangle text-yellow-500 ml-2 mt-1"></i>
                            <div class="text-sm text-yellow-700">
                                <p class="font-medium">تنبيه مهم:</p>
                                <p>سيتم نقل جميع البيانات إلى السحابة. هذه العملية لا يمكن التراجع عنها.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="migrationProgress" class="hidden mb-4">
                    <div class="bg-gray-200 rounded-full h-2 mb-2">
                        <div id="progressBar" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <p id="progressText" class="text-sm text-gray-600 text-center">جاري التحضير...</p>
                </div>

                <div id="migrationLog" class="hidden mb-4 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded text-sm">
                    <!-- سيتم ملء سجل الترحيل هنا -->
                </div>

                <div class="flex space-x-2">
                    <button id="startMigrationBtn" onclick="dataMigration.performMigration()" class="btn-primary flex-1">
                        <i class="fas fa-upload ml-2"></i>
                        بدء الترحيل
                    </button>
                    <button onclick="dataMigration.closeMigrationDialog()" class="btn-secondary">
                        إلغاء
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        this.migrationDialog = dialog;
    }

    // تحليل البيانات المحلية
    analyzeLocalData() {
        const cars = JSON.parse(localStorage.getItem('cars') || '[]');
        const employees = JSON.parse(localStorage.getItem('employees') || '[]');
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        const treasury = JSON.parse(localStorage.getItem('treasuryTransactions') || '[]');

        return {
            cars: cars.length,
            employees: employees.length,
            expenses: expenses.length,
            treasury: treasury.length,
            totalItems: cars.length + employees.length + expenses.length + treasury.length
        };
    }

    // تنفيذ عملية الترحيل
    async performMigration() {
        const startBtn = document.getElementById('startMigrationBtn');
        const progressDiv = document.getElementById('migrationProgress');
        const logDiv = document.getElementById('migrationLog');

        // إخفاء الزر وإظهار شريط التقدم
        startBtn.style.display = 'none';
        progressDiv.classList.remove('hidden');
        logDiv.classList.remove('hidden');

        try {
            // ترحيل السيارات
            await this.migrateCars();
            this.updateProgress(25, 'تم ترحيل السيارات بنجاح');

            // ترحيل الموظفين
            await this.migrateEmployees();
            this.updateProgress(50, 'تم ترحيل الموظفين بنجاح');

            // ترحيل المصروفات
            await this.migrateExpenses();
            this.updateProgress(75, 'تم ترحيل المصروفات بنجاح');

            // ترحيل معاملات الخزينة
            await this.migrateTreasury();
            this.updateProgress(100, 'تم الانتهاء من الترحيل بنجاح!');

            // إنهاء الترحيل
            this.completeMigration();

        } catch (error) {
            console.error('خطأ في الترحيل:', error);
            this.addToLog('❌ خطأ في الترحيل: ' + error.message, 'error');
            this.updateProgress(0, 'فشل في الترحيل');
            
            // إظهار زر إعادة المحاولة
            startBtn.textContent = 'إعادة المحاولة';
            startBtn.style.display = 'block';
        }
    }

    // ترحيل السيارات
    async migrateCars() {
        const cars = JSON.parse(localStorage.getItem('cars') || '[]');
        this.addToLog(`🚗 بدء ترحيل ${cars.length} سيارة...`);

        for (const car of cars) {
            try {
                const carData = {
                    name: car.name,
                    model: car.brand || car.model,
                    year: car.year,
                    licensePlate: car.licensePlate,
                    color: car.color,
                    notes: car.notes
                };

                const result = await dbAPI.addCar(carData);
                if (result.success) {
                    this.addToLog(`✅ تم ترحيل السيارة: ${car.name}`);
                } else {
                    throw new Error(result.error.message);
                }
            } catch (error) {
                this.addToLog(`❌ فشل ترحيل السيارة ${car.name}: ${error.message}`, 'error');
            }
        }

        this.migrationStatus.cars = true;
    }

    // ترحيل الموظفين
    async migrateEmployees() {
        const employees = JSON.parse(localStorage.getItem('employees') || '[]');
        this.addToLog(`👥 بدء ترحيل ${employees.length} موظف...`);

        for (const employee of employees) {
            try {
                const employeeData = {
                    name: employee.name,
                    phone: employee.phone,
                    email: employee.email,
                    position: employee.position,
                    salary: employee.salary,
                    hireDate: employee.hireDate,
                    notes: employee.notes
                };

                const result = await dbAPI.addEmployee(employeeData);
                if (result.success) {
                    this.addToLog(`✅ تم ترحيل الموظف: ${employee.name}`);
                } else {
                    throw new Error(result.error.message);
                }
            } catch (error) {
                this.addToLog(`❌ فشل ترحيل الموظف ${employee.name}: ${error.message}`, 'error');
            }
        }

        this.migrationStatus.employees = true;
    }

    // ترحيل المصروفات
    async migrateExpenses() {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        this.addToLog(`💰 بدء ترحيل ${expenses.length} مصروف...`);

        // الحصول على السيارات المرحلة لربطها
        const carsResult = await dbAPI.getCars();
        const cars = carsResult.success ? carsResult.data : [];

        for (const expense of expenses) {
            try {
                // البحث عن السيارة المطابقة
                const matchingCar = cars.find(car => 
                    car.license_plate === expense.carPlate || 
                    car.name === expense.carName
                );

                const expenseData = {
                    carId: matchingCar?.id || null,
                    type: expense.type,
                    amount: expense.amount,
                    description: expense.description,
                    date: expense.date,
                    vendor: expense.vendor,
                    paymentMethod: expense.paymentMethod || 'cash'
                };

                const result = await dbAPI.addExpense(expenseData);
                if (result.success) {
                    this.addToLog(`✅ تم ترحيل المصروف: ${expense.description}`);
                } else {
                    throw new Error(result.error.message);
                }
            } catch (error) {
                this.addToLog(`❌ فشل ترحيل المصروف ${expense.description}: ${error.message}`, 'error');
            }
        }

        this.migrationStatus.expenses = true;
    }

    // ترحيل معاملات الخزينة
    async migrateTreasury() {
        const treasury = JSON.parse(localStorage.getItem('treasuryTransactions') || '[]');
        this.addToLog(`🏦 بدء ترحيل ${treasury.length} معاملة خزينة...`);

        // ملاحظة: معاملات الخزينة ستكون جزءاً من المصروفات في النظام الجديد
        // أو يمكن إنشاء جدول منفصل لها حسب الحاجة

        for (const transaction of treasury) {
            try {
                if (transaction.type === 'expense') {
                    // تحويل معاملة الخزينة إلى مصروف
                    const expenseData = {
                        type: 'أخرى',
                        amount: Math.abs(transaction.amount),
                        description: transaction.description || 'معاملة خزينة مرحلة',
                        date: transaction.date,
                        paymentMethod: 'cash'
                    };

                    const result = await dbAPI.addExpense(expenseData);
                    if (result.success) {
                        this.addToLog(`✅ تم ترحيل معاملة الخزينة: ${transaction.description}`);
                    } else {
                        throw new Error(result.error.message);
                    }
                }
            } catch (error) {
                this.addToLog(`❌ فشل ترحيل معاملة الخزينة: ${error.message}`, 'error');
            }
        }

        this.migrationStatus.treasury = true;
    }

    // تحديث شريط التقدم
    updateProgress(percentage, message) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }

        if (progressText) {
            progressText.textContent = message;
        }
    }

    // إضافة إلى سجل الترحيل
    addToLog(message, type = 'info') {
        const logDiv = document.getElementById('migrationLog');
        if (!logDiv) return;

        const timestamp = new Date().toLocaleTimeString('ar-SA');
        const logEntry = document.createElement('div');
        logEntry.className = type === 'error' ? 'text-red-600' : 'text-gray-700';
        logEntry.textContent = `[${timestamp}] ${message}`;

        logDiv.appendChild(logEntry);
        logDiv.scrollTop = logDiv.scrollHeight;

        // حفظ في السجل
        this.migrationLog.push({ timestamp, message, type });
    }

    // إنهاء الترحيل
    completeMigration() {
        this.migrationStatus.completed = true;
        
        // إنشاء نسخة احتياطية من البيانات المحلية
        this.createLocalBackup();

        // عرض رسالة النجاح
        setTimeout(() => {
            this.showCompletionDialog();
        }, 2000);
    }

    // إنشاء نسخة احتياطية
    createLocalBackup() {
        const backupData = {
            cars: JSON.parse(localStorage.getItem('cars') || '[]'),
            employees: JSON.parse(localStorage.getItem('employees') || '[]'),
            expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
            treasury: JSON.parse(localStorage.getItem('treasuryTransactions') || '[]'),
            migrationDate: new Date().toISOString(),
            migrationLog: this.migrationLog
        };

        localStorage.setItem('dataBackup_' + Date.now(), JSON.stringify(backupData));
        this.addToLog('✅ تم إنشاء نسخة احتياطية من البيانات المحلية');
    }

    // عرض نافذة الإنجاز
    showCompletionDialog() {
        this.closeMigrationDialog();

        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="text-center">
                    <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">تم الترحيل بنجاح!</h3>
                    <p class="text-gray-600 mb-4">تم نقل جميع بياناتك إلى السحابة بنجاح</p>
                    
                    <div class="bg-green-50 p-4 rounded-lg mb-4">
                        <p class="text-sm text-green-700">
                            <i class="fas fa-info-circle ml-1"></i>
                            يمكنك الآن الوصول لبياناتك من أي جهاز والاستفادة من المزامنة الفورية
                        </p>
                    </div>

                    <button onclick="dataMigration.closeCompletionDialog(); location.reload();" class="btn-primary w-full">
                        <i class="fas fa-rocket ml-2"></i>
                        بدء استخدام النظام السحابي
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        this.completionDialog = dialog;
    }

    // إغلاق نافذة الترحيل
    closeMigrationDialog() {
        if (this.migrationDialog) {
            this.migrationDialog.remove();
            this.migrationDialog = null;
        }
    }

    // إغلاق نافذة الإنجاز
    closeCompletionDialog() {
        if (this.completionDialog) {
            this.completionDialog.remove();
            this.completionDialog = null;
        }
    }

    // التحقق من وجود بيانات محلية
    hasLocalData() {
        const localData = this.analyzeLocalData();
        return localData.totalItems > 0;
    }

    // الحصول على حالة الترحيل
    getMigrationStatus() {
        return this.migrationStatus;
    }
}

// إنشاء مثيل من نظام الترحيل
const dataMigration = new DataMigration();

// فحص البيانات المحلية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (authManager.isUserAuthenticated() && dataMigration.hasLocalData()) {
            // عرض إشعار بوجود بيانات محلية
            showNotification('تم العثور على بيانات محلية. هل تريد ترحيلها إلى السحابة؟', 'info');
            
            // يمكن إضافة زر في الواجهة لبدء الترحيل
            console.log('💾 تم العثور على بيانات محلية قابلة للترحيل');
        }
    }, 3000);
});
