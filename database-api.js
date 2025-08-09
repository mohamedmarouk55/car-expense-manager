// API للتعامل مع قاعدة البيانات Supabase
class DatabaseAPI {
    constructor() {
        this.supabase = supabase;
    }

    // ==================== السيارات ====================

    // إضافة سيارة جديدة
    async addCar(carData) {
        try {
            const { data, error } = await this.supabase
                .from('cars')
                .insert([{
                    user_id: authManager.getCurrentUser()?.id,
                    name: carData.name,
                    model: carData.model,
                    year: carData.year,
                    license_plate: carData.licensePlate,
                    color: carData.color,
                    notes: carData.notes || null
                }])
                .select();

            if (error) throw error;

            showNotification('تم إضافة السيارة بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في إضافة السيارة:', error);
            showNotification('خطأ في إضافة السيارة: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // الحصول على جميع السيارات
    async getCars() {
        try {
            const { data, error } = await this.supabase
                .from('cars')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب السيارات:', error);
            return { success: false, error };
        }
    }

    // تحديث سيارة
    async updateCar(carId, carData) {
        try {
            const { data, error } = await this.supabase
                .from('cars')
                .update({
                    name: carData.name,
                    model: carData.model,
                    year: carData.year,
                    license_plate: carData.licensePlate,
                    color: carData.color,
                    notes: carData.notes || null
                })
                .eq('id', carId)
                .select();

            if (error) throw error;

            showNotification('تم تحديث السيارة بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في تحديث السيارة:', error);
            showNotification('خطأ في تحديث السيارة: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // حذف سيارة (حذف منطقي)
    async deleteCar(carId) {
        try {
            const { data, error } = await this.supabase
                .from('cars')
                .update({ is_active: false })
                .eq('id', carId)
                .select();

            if (error) throw error;

            showNotification('تم حذف السيارة بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في حذف السيارة:', error);
            showNotification('خطأ في حذف السيارة: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // ==================== الموظفين ====================

    // إضافة موظف جديد
    async addEmployee(employeeData) {
        try {
            const { data, error } = await this.supabase
                .from('employees')
                .insert([{
                    user_id: authManager.getCurrentUser()?.id,
                    name: employeeData.name,
                    phone: employeeData.phone || null,
                    email: employeeData.email || null,
                    position: employeeData.position || null,
                    salary: employeeData.salary || null,
                    hire_date: employeeData.hireDate || null,
                    notes: employeeData.notes || null
                }])
                .select();

            if (error) throw error;

            showNotification('تم إضافة الموظف بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في إضافة الموظف:', error);
            showNotification('خطأ في إضافة الموظف: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // الحصول على جميع الموظفين
    async getEmployees() {
        try {
            const { data, error } = await this.supabase
                .from('employees')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب الموظفين:', error);
            return { success: false, error };
        }
    }

    // تحديث موظف
    async updateEmployee(employeeId, employeeData) {
        try {
            const { data, error } = await this.supabase
                .from('employees')
                .update({
                    name: employeeData.name,
                    phone: employeeData.phone || null,
                    email: employeeData.email || null,
                    position: employeeData.position || null,
                    salary: employeeData.salary || null,
                    hire_date: employeeData.hireDate || null,
                    notes: employeeData.notes || null
                })
                .eq('id', employeeId)
                .select();

            if (error) throw error;

            showNotification('تم تحديث الموظف بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في تحديث الموظف:', error);
            showNotification('خطأ في تحديث الموظف: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // حذف موظف (حذف منطقي)
    async deleteEmployee(employeeId) {
        try {
            const { data, error } = await this.supabase
                .from('employees')
                .update({ is_active: false })
                .eq('id', employeeId)
                .select();

            if (error) throw error;

            showNotification('تم حذف الموظف بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في حذف الموظف:', error);
            showNotification('خطأ في حذف الموظف: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // ==================== فئات المصروفات ====================

    // إضافة فئة مصروف جديدة
    async addExpenseCategory(categoryData) {
        try {
            const { data, error } = await this.supabase
                .from('expense_categories')
                .insert([{
                    user_id: authManager.getCurrentUser()?.id,
                    name: categoryData.name,
                    description: categoryData.description || null,
                    color: categoryData.color || '#3B82F6'
                }])
                .select();

            if (error) throw error;

            showNotification('تم إضافة فئة المصروف بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في إضافة فئة المصروف:', error);
            showNotification('خطأ في إضافة فئة المصروف: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // الحصول على جميع فئات المصروفات
    async getExpenseCategories() {
        try {
            const { data, error } = await this.supabase
                .from('expense_categories')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب فئات المصروفات:', error);
            return { success: false, error };
        }
    }

    // ==================== المصروفات ====================

    // إضافة مصروف جديد
    async addExpense(expenseData) {
        try {
            const { data, error } = await this.supabase
                .from('expenses')
                .insert([{
                    user_id: authManager.getCurrentUser()?.id,
                    car_id: expenseData.carId || null,
                    employee_id: expenseData.employeeId || null,
                    category_id: expenseData.categoryId || null,
                    type: expenseData.type,
                    amount: parseFloat(expenseData.amount),
                    description: expenseData.description,
                    date: expenseData.date,
                    receipt_number: expenseData.receiptNumber || null,
                    vendor: expenseData.vendor || null,
                    payment_method: expenseData.paymentMethod || 'cash',
                    tags: expenseData.tags || []
                }])
                .select();

            if (error) throw error;

            showNotification('تم إضافة المصروف بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في إضافة المصروف:', error);
            showNotification('خطأ في إضافة المصروف: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // الحصول على جميع المصروفات
    async getExpenses(filters = {}) {
        try {
            let query = this.supabase
                .from('expenses')
                .select(`
                    *,
                    cars(name, license_plate),
                    employees(name),
                    expense_categories(name, color)
                `)
                .order('date', { ascending: false });

            // تطبيق الفلاتر
            if (filters.carId) {
                query = query.eq('car_id', filters.carId);
            }
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            if (filters.dateFrom) {
                query = query.gte('date', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('date', filters.dateTo);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب المصروفات:', error);
            return { success: false, error };
        }
    }

    // تحديث مصروف
    async updateExpense(expenseId, expenseData) {
        try {
            const { data, error } = await this.supabase
                .from('expenses')
                .update({
                    car_id: expenseData.carId || null,
                    employee_id: expenseData.employeeId || null,
                    category_id: expenseData.categoryId || null,
                    type: expenseData.type,
                    amount: parseFloat(expenseData.amount),
                    description: expenseData.description,
                    date: expenseData.date,
                    receipt_number: expenseData.receiptNumber || null,
                    vendor: expenseData.vendor || null,
                    payment_method: expenseData.paymentMethod || 'cash',
                    tags: expenseData.tags || []
                })
                .eq('id', expenseId)
                .select();

            if (error) throw error;

            showNotification('تم تحديث المصروف بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في تحديث المصروف:', error);
            showNotification('خطأ في تحديث المصروف: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // حذف مصروف
    async deleteExpense(expenseId) {
        try {
            const { data, error } = await this.supabase
                .from('expenses')
                .delete()
                .eq('id', expenseId)
                .select();

            if (error) throw error;

            showNotification('تم حذف المصروف بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في حذف المصروف:', error);
            showNotification('خطأ في حذف المصروف: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // ==================== المرفقات ====================

    // رفع ملف
    async uploadFile(file, expenseId) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${expenseId}_${Date.now()}.${fileExt}`;
            const filePath = `attachments/${fileName}`;

            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // إضافة سجل المرفق في قاعدة البيانات
            const { data, error } = await this.supabase
                .from('attachments')
                .insert([{
                    expense_id: expenseId,
                    file_name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    mime_type: file.type
                }])
                .select();

            if (error) throw error;

            showNotification('تم رفع الملف بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في رفع الملف:', error);
            showNotification('خطأ في رفع الملف: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // الحصول على رابط الملف
    async getFileUrl(filePath) {
        try {
            const { data } = await this.supabase.storage
                .from('attachments')
                .getPublicUrl(filePath);

            return { success: true, url: data.publicUrl };
        } catch (error) {
            console.error('خطأ في الحصول على رابط الملف:', error);
            return { success: false, error };
        }
    }

    // حذف ملف
    async deleteFile(attachmentId, filePath) {
        try {
            // حذف الملف من التخزين
            const { error: storageError } = await this.supabase.storage
                .from('attachments')
                .remove([filePath]);

            if (storageError) throw storageError;

            // حذف سجل المرفق من قاعدة البيانات
            const { data, error } = await this.supabase
                .from('attachments')
                .delete()
                .eq('id', attachmentId)
                .select();

            if (error) throw error;

            showNotification('تم حذف الملف بنجاح!', 'success');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في حذف الملف:', error);
            showNotification('خطأ في حذف الملف: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // ==================== الإحصائيات ====================

    // إحصائيات عامة
    async getStatistics() {
        try {
            // إجمالي المصروفات
            const { data: expensesData, error: expensesError } = await this.supabase
                .from('expenses')
                .select('amount');

            if (expensesError) throw expensesError;

            // عدد السيارات
            const { count: carsCount, error: carsError } = await this.supabase
                .from('cars')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            if (carsError) throw carsError;

            // عدد الموظفين
            const { count: employeesCount, error: employeesError } = await this.supabase
                .from('employees')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            if (employeesError) throw employeesError;

            const totalExpenses = expensesData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

            return {
                success: true,
                data: {
                    totalExpenses,
                    expenseCount: expensesData.length,
                    carsCount,
                    employeesCount
                }
            };
        } catch (error) {
            console.error('خطأ في جلب الإحصائيات:', error);
            return { success: false, error };
        }
    }
}

// إنشاء مثيل من API قاعدة البيانات
const dbAPI = new DatabaseAPI();
