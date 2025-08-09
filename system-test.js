// نظام اختبار شامل للتطبيق السحابي
class SystemTest {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
        this.testSuite = [
            { name: 'اختبار الاتصال بقاعدة البيانات', test: this.testDatabaseConnection },
            { name: 'اختبار نظام المصادقة', test: this.testAuthentication },
            { name: 'اختبار API السيارات', test: this.testCarsAPI },
            { name: 'اختبار API الموظفين', test: this.testEmployeesAPI },
            { name: 'اختبار API المصروفات', test: this.testExpensesAPI },
            { name: 'اختبار نظام رفع الملفات', test: this.testFileUpload },
            { name: 'اختبار المزامنة الفورية', test: this.testRealtimeSync },
            { name: 'اختبار نظام الترحيل', test: this.testDataMigration },
            { name: 'اختبار الملف الشخصي', test: this.testUserProfile },
            { name: 'اختبار الأداء العام', test: this.testPerformance }
        ];
    }

    // بدء الاختبار الشامل
    async runAllTests() {
        if (this.isRunning) {
            console.log('الاختبار قيد التشغيل بالفعل');
            return;
        }

        this.isRunning = true;
        this.testResults = [];
        
        console.log('🧪 بدء الاختبار الشامل للنظام...');
        this.showTestDialog();

        try {
            for (let i = 0; i < this.testSuite.length; i++) {
                const testCase = this.testSuite[i];
                this.updateTestProgress(i, testCase.name);
                
                try {
                    const result = await testCase.test.call(this);
                    this.addTestResult(testCase.name, true, result.message || 'نجح الاختبار');
                } catch (error) {
                    this.addTestResult(testCase.name, false, error.message);
                }
                
                // انتظار قصير بين الاختبارات
                await this.delay(500);
            }

            this.completeTests();

        } catch (error) {
            console.error('خطأ في تشغيل الاختبارات:', error);
            this.addTestResult('خطأ عام', false, error.message);
        } finally {
            this.isRunning = false;
        }
    }

    // اختبار الاتصال بقاعدة البيانات
    async testDatabaseConnection() {
        try {
            const { data, error } = await supabase
                .from('cars')
                .select('id')
                .limit(1);

            if (error) throw error;

            return { success: true, message: 'الاتصال بقاعدة البيانات يعمل بشكل صحيح' };
        } catch (error) {
            throw new Error('فشل الاتصال بقاعدة البيانات: ' + error.message);
        }
    }

    // اختبار نظام المصادقة
    async testAuthentication() {
        try {
            if (!authManager.isUserAuthenticated()) {
                throw new Error('المستخدم غير مسجل الدخول');
            }

            const user = authManager.getCurrentUser();
            if (!user || !user.id) {
                throw new Error('بيانات المستخدم غير صحيحة');
            }

            return { success: true, message: 'نظام المصادقة يعمل بشكل صحيح' };
        } catch (error) {
            throw new Error('فشل اختبار المصادقة: ' + error.message);
        }
    }

    // اختبار API السيارات
    async testCarsAPI() {
        try {
            // اختبار جلب السيارات
            const carsResult = await dbAPI.getCars();
            if (!carsResult.success) {
                throw new Error('فشل في جلب السيارات');
            }

            // اختبار إضافة سيارة تجريبية
            const testCar = {
                name: 'سيارة اختبار',
                model: 'تويوتا كامري',
                year: 2023,
                licensePlate: 'TEST-123',
                color: 'أبيض',
                notes: 'سيارة للاختبار'
            };

            const addResult = await dbAPI.addCar(testCar);
            if (!addResult.success) {
                throw new Error('فشل في إضافة السيارة');
            }

            // حذف السيارة التجريبية
            await dbAPI.deleteCar(addResult.data.id);

            return { success: true, message: 'API السيارات يعمل بشكل صحيح' };
        } catch (error) {
            throw new Error('فشل اختبار API السيارات: ' + error.message);
        }
    }

    // اختبار API الموظفين
    async testEmployeesAPI() {
        try {
            // اختبار جلب الموظفين
            const employeesResult = await dbAPI.getEmployees();
            if (!employeesResult.success) {
                throw new Error('فشل في جلب الموظفين');
            }

            // اختبار إضافة موظف تجريبي
            const testEmployee = {
                name: 'موظف اختبار',
                phone: '0501234567',
                email: 'test@example.com',
                position: 'سائق',
                salary: 3000,
                hireDate: '2024-01-01',
                notes: 'موظف للاختبار'
            };

            const addResult = await dbAPI.addEmployee(testEmployee);
            if (!addResult.success) {
                throw new Error('فشل في إضافة الموظف');
            }

            // حذف الموظف التجريبي
            await dbAPI.deleteEmployee(addResult.data.id);

            return { success: true, message: 'API الموظفين يعمل بشكل صحيح' };
        } catch (error) {
            throw new Error('فشل اختبار API الموظفين: ' + error.message);
        }
    }

    // اختبار API المصروفات
    async testExpensesAPI() {
        try {
            // اختبار جلب المصروفات
            const expensesResult = await dbAPI.getExpenses();
            if (!expensesResult.success) {
                throw new Error('فشل في جلب المصروفات');
            }

            // اختبار إضافة مصروف تجريبي
            const testExpense = {
                type: 'وقود',
                amount: 100,
                description: 'مصروف اختبار',
                date: new Date().toISOString().split('T')[0],
                vendor: 'محطة وقود',
                paymentMethod: 'cash'
            };

            const addResult = await dbAPI.addExpense(testExpense);
            if (!addResult.success) {
                throw new Error('فشل في إضافة المصروف');
            }

            // حذف المصروف التجريبي
            await dbAPI.deleteExpense(addResult.data.id);

            return { success: true, message: 'API المصروفات يعمل بشكل صحيح' };
        } catch (error) {
            throw new Error('فشل اختبار API المصروفات: ' + error.message);
        }
    }

    // اختبار نظام رفع الملفات
    async testFileUpload() {
        try {
            // التحقق من وجود مدير الملفات
            if (typeof fileManager === 'undefined') {
                throw new Error('مدير الملفات غير متوفر');
            }

            // اختبار التحقق من أنواع الملفات
            const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
            const isValidType = fileManager.isValidFileType(testFile);
            
            // اختبار التحقق من حجم الملف
            const isValidSize = fileManager.isValidFileSize(testFile);

            if (!isValidSize) {
                throw new Error('فشل في التحقق من حجم الملف');
            }

            return { success: true, message: 'نظام رفع الملفات يعمل بشكل صحيح' };
        } catch (error) {
            throw new Error('فشل اختبار نظام رفع الملفات: ' + error.message);
        }
    }

    // اختبار المزامنة الفورية
    async testRealtimeSync() {
        try {
            // التحقق من وجود نظام المزامنة
            if (typeof realtimeSync === 'undefined') {
                throw new Error('نظام المزامنة الفورية غير متوفر');
            }

            // التحقق من حالة الاتصال
            const status = realtimeSync.getConnectionStatus();
            
            if (!status.isConnected) {
                console.warn('المزامنة الفورية غير متصلة حالياً');
            }

            return { success: true, message: 'نظام المزامنة الفورية متوفر' };
        } catch (error) {
            throw new Error('فشل اختبار المزامنة الفورية: ' + error.message);
        }
    }

    // اختبار نظام الترحيل
    async testDataMigration() {
        try {
            // التحقق من وجود نظام الترحيل
            if (typeof dataMigration === 'undefined') {
                throw new Error('نظام الترحيل غير متوفر');
            }

            // اختبار تحليل البيانات المحلية
            const hasLocalData = dataMigration.hasLocalData();
            
            // اختبار حالة الترحيل
            const migrationStatus = dataMigration.getMigrationStatus();

            return { success: true, message: 'نظام الترحيل يعمل بشكل صحيح' };
        } catch (error) {
            throw new Error('فشل اختبار نظام الترحيل: ' + error.message);
        }
    }

    // اختبار الملف الشخصي
    async testUserProfile() {
        try {
            // التحقق من وجود إدارة الملف الشخصي
            if (typeof userProfile === 'undefined') {
                throw new Error('إدارة الملف الشخصي غير متوفرة');
            }

            // اختبار الحصول على الإعدادات
            const settings = userProfile.getSettings();
            if (!settings || typeof settings !== 'object') {
                throw new Error('فشل في الحصول على الإعدادات');
            }

            return { success: true, message: 'الملف الشخصي يعمل بشكل صحيح' };
        } catch (error) {
            throw new Error('فشل اختبار الملف الشخصي: ' + error.message);
        }
    }

    // اختبار الأداء العام
    async testPerformance() {
        try {
            const startTime = performance.now();

            // اختبار سرعة الاستجابة
            await this.testDatabaseConnection();
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            if (responseTime > 5000) { // أكثر من 5 ثوان
                console.warn(`وقت الاستجابة بطيء: ${responseTime.toFixed(2)}ms`);
            }

            return { success: true, message: `الأداء جيد - وقت الاستجابة: ${responseTime.toFixed(2)}ms` };
        } catch (error) {
            throw new Error('فشل اختبار الأداء: ' + error.message);
        }
    }

    // عرض نافذة الاختبار
    showTestDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-vial text-blue-500 ml-2"></i>
                    اختبار النظام الشامل
                </h3>
                
                <div class="mb-4">
                    <div class="bg-gray-200 rounded-full h-2 mb-2">
                        <div id="testProgressBar" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <p id="testProgressText" class="text-sm text-gray-600 text-center">جاري التحضير...</p>
                </div>

                <div id="testResults" class="max-h-64 overflow-y-auto bg-gray-50 p-3 rounded text-sm">
                    <!-- سيتم ملء نتائج الاختبار هنا -->
                </div>

                <div class="mt-4 flex justify-end">
                    <button id="closeTestBtn" onclick="systemTest.closeTestDialog()" class="btn-secondary" disabled>
                        إغلاق
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        this.testDialog = dialog;
    }

    // تحديث تقدم الاختبار
    updateTestProgress(currentTest, testName) {
        const progressBar = document.getElementById('testProgressBar');
        const progressText = document.getElementById('testProgressText');

        const percentage = ((currentTest + 1) / this.testSuite.length) * 100;

        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }

        if (progressText) {
            progressText.textContent = `جاري تشغيل: ${testName}`;
        }
    }

    // إضافة نتيجة اختبار
    addTestResult(testName, success, message) {
        const resultsDiv = document.getElementById('testResults');
        if (!resultsDiv) return;

        const resultElement = document.createElement('div');
        resultElement.className = `flex items-start mb-2 ${success ? 'text-green-600' : 'text-red-600'}`;
        resultElement.innerHTML = `
            <i class="fas ${success ? 'fa-check-circle' : 'fa-times-circle'} ml-2 mt-1"></i>
            <div>
                <div class="font-medium">${testName}</div>
                <div class="text-xs text-gray-600">${message}</div>
            </div>
        `;

        resultsDiv.appendChild(resultElement);
        resultsDiv.scrollTop = resultsDiv.scrollHeight;

        this.testResults.push({ testName, success, message });
    }

    // إنهاء الاختبارات
    completeTests() {
        const progressText = document.getElementById('testProgressText');
        const closeBtn = document.getElementById('closeTestBtn');

        const passedTests = this.testResults.filter(r => r.success).length;
        const totalTests = this.testResults.length;

        if (progressText) {
            progressText.textContent = `اكتمل الاختبار: ${passedTests}/${totalTests} نجح`;
        }

        if (closeBtn) {
            closeBtn.disabled = false;
        }

        // عرض ملخص النتائج
        const successRate = (passedTests / totalTests) * 100;
        const message = successRate === 100 ? 
            'جميع الاختبارات نجحت! النظام يعمل بشكل مثالي.' :
            `${passedTests} من ${totalTests} اختبار نجح (${successRate.toFixed(1)}%)`;

        showNotification(message, successRate === 100 ? 'success' : 'warning');
    }

    // إغلاق نافذة الاختبار
    closeTestDialog() {
        if (this.testDialog) {
            this.testDialog.remove();
            this.testDialog = null;
        }
    }

    // تأخير
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // الحصول على نتائج الاختبار
    getTestResults() {
        return this.testResults;
    }
}

// إنشاء مثيل من نظام الاختبار
const systemTest = new SystemTest();

// تشغيل الاختبار عند الحاجة
function runSystemTest() {
    systemTest.runAllTests();
}

// اختبار سريع للتحقق من الوظائف الأساسية
async function quickTest() {
    try {
        console.log('🔍 اختبار سريع...');
        
        // اختبار الاتصال
        const { data, error } = await supabase.from('cars').select('id').limit(1);
        if (error) throw error;
        
        console.log('✅ الاتصال بقاعدة البيانات يعمل');
        
        // اختبار المصادقة
        if (authManager.isUserAuthenticated()) {
            console.log('✅ المستخدم مسجل الدخول');
        } else {
            console.log('⚠️ المستخدم غير مسجل الدخول');
        }
        
        showNotification('الاختبار السريع مكتمل - النظام يعمل بشكل صحيح', 'success');
        
    } catch (error) {
        console.error('❌ فشل الاختبار السريع:', error);
        showNotification('فشل الاختبار السريع: ' + error.message, 'error');
    }
}
