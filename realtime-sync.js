// نظام المزامنة الفورية باستخدام Supabase Realtime
class RealtimeSync {
    constructor() {
        this.channels = new Map();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 1 ثانية
        this.init();
    }

    // تهيئة النظام
    async init() {
        if (!authManager.isUserAuthenticated()) {
            console.log('المستخدم غير مسجل الدخول - تأجيل المزامنة');
            return;
        }

        try {
            await this.setupRealtimeChannels();
            this.setupConnectionMonitoring();
            console.log('✅ تم تفعيل المزامنة الفورية');
        } catch (error) {
            console.error('❌ خطأ في تفعيل المزامنة الفورية:', error);
        }
    }

    // إعداد قنوات المزامنة
    async setupRealtimeChannels() {
        const userId = authManager.getCurrentUser()?.id;
        if (!userId) return;

        // قناة السيارات
        this.setupCarsChannel(userId);
        
        // قناة الموظفين
        this.setupEmployeesChannel(userId);
        
        // قناة المصروفات
        this.setupExpensesChannel(userId);
        
        // قناة المرفقات
        this.setupAttachmentsChannel(userId);
    }

    // إعداد قناة السيارات
    setupCarsChannel(userId) {
        const carsChannel = supabase
            .channel('cars_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cars',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => this.handleCarsChange(payload)
            )
            .subscribe((status) => {
                console.log('قناة السيارات:', status);
                this.updateConnectionStatus('cars', status);
            });

        this.channels.set('cars', carsChannel);
    }

    // إعداد قناة الموظفين
    setupEmployeesChannel(userId) {
        const employeesChannel = supabase
            .channel('employees_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'employees',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => this.handleEmployeesChange(payload)
            )
            .subscribe((status) => {
                console.log('قناة الموظفين:', status);
                this.updateConnectionStatus('employees', status);
            });

        this.channels.set('employees', employeesChannel);
    }

    // إعداد قناة المصروفات
    setupExpensesChannel(userId) {
        const expensesChannel = supabase
            .channel('expenses_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'expenses',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => this.handleExpensesChange(payload)
            )
            .subscribe((status) => {
                console.log('قناة المصروفات:', status);
                this.updateConnectionStatus('expenses', status);
            });

        this.channels.set('expenses', expensesChannel);
    }

    // إعداد قناة المرفقات
    setupAttachmentsChannel(userId) {
        const attachmentsChannel = supabase
            .channel('attachments_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attachments'
                },
                (payload) => this.handleAttachmentsChange(payload)
            )
            .subscribe((status) => {
                console.log('قناة المرفقات:', status);
                this.updateConnectionStatus('attachments', status);
            });

        this.channels.set('attachments', attachmentsChannel);
    }

    // معالجة تغييرات السيارات
    handleCarsChange(payload) {
        console.log('تغيير في السيارات:', payload);
        
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
            case 'INSERT':
                this.onCarAdded(newRecord);
                break;
            case 'UPDATE':
                this.onCarUpdated(newRecord, oldRecord);
                break;
            case 'DELETE':
                this.onCarDeleted(oldRecord);
                break;
        }
    }

    // معالجة تغييرات الموظفين
    handleEmployeesChange(payload) {
        console.log('تغيير في الموظفين:', payload);
        
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
            case 'INSERT':
                this.onEmployeeAdded(newRecord);
                break;
            case 'UPDATE':
                this.onEmployeeUpdated(newRecord, oldRecord);
                break;
            case 'DELETE':
                this.onEmployeeDeleted(oldRecord);
                break;
        }
    }

    // معالجة تغييرات المصروفات
    handleExpensesChange(payload) {
        console.log('تغيير في المصروفات:', payload);
        
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
            case 'INSERT':
                this.onExpenseAdded(newRecord);
                break;
            case 'UPDATE':
                this.onExpenseUpdated(newRecord, oldRecord);
                break;
            case 'DELETE':
                this.onExpenseDeleted(oldRecord);
                break;
        }
    }

    // معالجة تغييرات المرفقات
    handleAttachmentsChange(payload) {
        console.log('تغيير في المرفقات:', payload);
        
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
            case 'INSERT':
                this.onAttachmentAdded(newRecord);
                break;
            case 'DELETE':
                this.onAttachmentDeleted(oldRecord);
                break;
        }
    }

    // أحداث السيارات
    onCarAdded(car) {
        showNotification(`تم إضافة سيارة جديدة: ${car.name}`, 'info');
        this.refreshCarsData();
    }

    onCarUpdated(car, oldCar) {
        showNotification(`تم تحديث السيارة: ${car.name}`, 'info');
        this.refreshCarsData();
    }

    onCarDeleted(car) {
        showNotification(`تم حذف السيارة: ${car.name}`, 'info');
        this.refreshCarsData();
    }

    // أحداث الموظفين
    onEmployeeAdded(employee) {
        showNotification(`تم إضافة موظف جديد: ${employee.name}`, 'info');
        this.refreshEmployeesData();
    }

    onEmployeeUpdated(employee, oldEmployee) {
        showNotification(`تم تحديث الموظف: ${employee.name}`, 'info');
        this.refreshEmployeesData();
    }

    onEmployeeDeleted(employee) {
        showNotification(`تم حذف الموظف: ${employee.name}`, 'info');
        this.refreshEmployeesData();
    }

    // أحداث المصروفات
    onExpenseAdded(expense) {
        showNotification(`تم إضافة مصروف جديد: ${expense.description}`, 'info');
        this.refreshExpensesData();
        this.refreshStatistics();
    }

    onExpenseUpdated(expense, oldExpense) {
        showNotification(`تم تحديث المصروف: ${expense.description}`, 'info');
        this.refreshExpensesData();
        this.refreshStatistics();
    }

    onExpenseDeleted(expense) {
        showNotification(`تم حذف المصروف: ${expense.description}`, 'info');
        this.refreshExpensesData();
        this.refreshStatistics();
    }

    // أحداث المرفقات
    onAttachmentAdded(attachment) {
        showNotification(`تم إضافة مرفق جديد: ${attachment.file_name}`, 'info');
        this.refreshAttachmentsData(attachment.expense_id);
    }

    onAttachmentDeleted(attachment) {
        showNotification(`تم حذف المرفق: ${attachment.file_name}`, 'info');
        this.refreshAttachmentsData(attachment.expense_id);
    }

    // تحديث البيانات
    async refreshCarsData() {
        if (typeof loadCarsData === 'function') {
            await loadCarsData();
        }
    }

    async refreshEmployeesData() {
        if (typeof loadEmployeesData === 'function') {
            await loadEmployeesData();
        }
    }

    async refreshExpensesData() {
        if (typeof loadExpensesData === 'function') {
            await loadExpensesData();
        }
    }

    async refreshStatistics() {
        if (typeof updateStatistics === 'function') {
            await updateStatistics();
        }
    }

    async refreshAttachmentsData(expenseId) {
        const container = document.querySelector(`[data-expense-id="${expenseId}"] .attachments-container`);
        if (container && fileManager) {
            await fileManager.displayAttachments(expenseId, container);
        }
    }

    // مراقبة حالة الاتصال
    setupConnectionMonitoring() {
        // مراقبة حالة الاتصال بالإنترنت
        window.addEventListener('online', () => {
            console.log('🌐 عاد الاتصال بالإنترنت');
            this.handleReconnection();
        });

        window.addEventListener('offline', () => {
            console.log('🔌 انقطع الاتصال بالإنترنت');
            this.handleDisconnection();
        });

        // فحص دوري لحالة الاتصال
        setInterval(() => {
            this.checkConnectionHealth();
        }, 30000); // كل 30 ثانية
    }

    // تحديث حالة الاتصال
    updateConnectionStatus(channel, status) {
        if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.isConnected = false;
            this.handleReconnection();
        }
    }

    // معالجة إعادة الاتصال
    async handleReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ تم الوصول للحد الأقصى من محاولات إعادة الاتصال');
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 محاولة إعادة الاتصال ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * this.reconnectAttempts));

        try {
            await this.disconnect();
            await this.init();
        } catch (error) {
            console.error('خطأ في إعادة الاتصال:', error);
        }
    }

    // معالجة انقطاع الاتصال
    handleDisconnection() {
        this.isConnected = false;
        console.log('🔌 تم قطع الاتصال مع المزامنة الفورية');
    }

    // فحص صحة الاتصال
    async checkConnectionHealth() {
        try {
            // محاولة استعلام بسيط للتحقق من الاتصال
            const { error } = await supabase
                .from('cars')
                .select('id')
                .limit(1);

            if (error) {
                throw error;
            }

            if (!this.isConnected) {
                console.log('🔄 إعادة تفعيل المزامنة الفورية');
                await this.handleReconnection();
            }
        } catch (error) {
            console.error('خطأ في فحص صحة الاتصال:', error);
            this.handleDisconnection();
        }
    }

    // قطع الاتصال
    async disconnect() {
        console.log('🔌 قطع اتصال المزامنة الفورية');
        
        for (const [name, channel] of this.channels) {
            try {
                await supabase.removeChannel(channel);
                console.log(`✅ تم قطع قناة ${name}`);
            } catch (error) {
                console.error(`❌ خطأ في قطع قناة ${name}:`, error);
            }
        }
        
        this.channels.clear();
        this.isConnected = false;
    }

    // إعادة تفعيل المزامنة
    async restart() {
        console.log('🔄 إعادة تشغيل المزامنة الفورية');
        await this.disconnect();
        await this.init();
    }

    // الحصول على حالة الاتصال
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            channelsCount: this.channels.size,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    // إرسال إشعار مخصص
    sendCustomNotification(message, type = 'info') {
        if (this.isConnected) {
            showNotification(message, type);
        }
    }
}

// إنشاء مثيل من نظام المزامنة الفورية
const realtimeSync = new RealtimeSync();

// تفعيل المزامنة عند تسجيل الدخول
document.addEventListener('DOMContentLoaded', () => {
    // انتظار تحميل نظام المصادقة
    setTimeout(() => {
        if (authManager.isUserAuthenticated()) {
            realtimeSync.init();
        }
    }, 1000);
});

// إعادة تفعيل المزامنة عند تسجيل الدخول
if (typeof authManager !== 'undefined') {
    const originalShowMainApp = authManager.showMainApp;
    authManager.showMainApp = function() {
        originalShowMainApp.call(this);
        setTimeout(() => {
            realtimeSync.restart();
        }, 1000);
    };
}
