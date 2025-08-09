// إعداد Supabase
// بيانات مشروعك من Supabase Dashboard
// يجب استبدال هذه القيم بالقيم الحقيقية من مشروعك
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// إنشاء عميل Supabase (سيتم تهيئته في supabase-integration.js)
let supabase = null;

// إعدادات التخزين
export const STORAGE_BUCKET = 'car-expenses-attachments';

// وظائف المصادقة
export class AuthService {
  // تسجيل دخول بـ Google
  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    return { data, error };
  }

  // تسجيل دخول بالإيميل
  static async signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  // تسجيل حساب جديد
  static async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    return { data, error };
  }

  // تسجيل خروج
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  // الحصول على المستخدم الحالي
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // مراقبة تغييرات المصادقة
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// وظائف قاعدة البيانات
export class DatabaseService {
  // السيارات
  static async getCars(userId) {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  static async addCar(carData, userId) {
    const { data, error } = await supabase
      .from('cars')
      .insert([{ ...carData, user_id: userId }])
      .select();
    return { data, error };
  }

  static async updateCar(carId, carData) {
    const { data, error } = await supabase
      .from('cars')
      .update(carData)
      .eq('id', carId)
      .select();
    return { data, error };
  }

  static async deleteCar(carId) {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId);
    return { error };
  }

  // الموظفين
  static async getEmployees(userId) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  static async addEmployee(employeeData, userId) {
    const { data, error } = await supabase
      .from('employees')
      .insert([{ ...employeeData, user_id: userId }])
      .select();
    return { data, error };
  }

  // المصروفات
  static async getExpenses(userId, filters = {}) {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        cars(name, model),
        employees(name),
        attachments(*)
      `)
      .eq('user_id', userId);

    // تطبيق الفلاتر
    if (filters.carId) query = query.eq('car_id', filters.carId);
    if (filters.employeeId) query = query.eq('employee_id', filters.employeeId);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.startDate) query = query.gte('date', filters.startDate);
    if (filters.endDate) query = query.lte('date', filters.endDate);

    query = query.order('date', { ascending: false });

    const { data, error } = await query;
    return { data, error };
  }

  static async addExpense(expenseData, userId) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expenseData, user_id: userId }])
      .select();
    return { data, error };
  }

  static async updateExpense(expenseId, expenseData) {
    const { data, error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', expenseId)
      .select();
    return { data, error };
  }

  static async deleteExpense(expenseId) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
    return { error };
  }
}

// وظائف التخزين
export class StorageService {
  // رفع ملف
  static async uploadFile(file, path) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file);
    return { data, error };
  }

  // الحصول على رابط عام للملف
  static getPublicUrl(path) {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  // حذف ملف
  static async deleteFile(path) {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);
    return { error };
  }

  // رفع مرفق لمصروف
  static async uploadAttachment(file, expenseId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${expenseId}/${fileName}`;

    // رفع الملف
    const { data: uploadData, error: uploadError } = await this.uploadFile(file, filePath);
    if (uploadError) return { error: uploadError };

    // حفظ معلومات المرفق في قاعدة البيانات
    const { data, error } = await supabase
      .from('attachments')
      .insert([{
        expense_id: expenseId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type
      }])
      .select();

    return { data, error };
  }
}

// وظائف المزامنة الفورية
export class RealtimeService {
  // مراقبة تغييرات المصروفات
  static subscribeToExpenses(userId, callback) {
    return supabase
      .channel('expenses-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  }

  // مراقبة تغييرات السيارات
  static subscribeToCars(userId, callback) {
    return supabase
      .channel('cars-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cars',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  }

  // إلغاء الاشتراك
  static unsubscribe(subscription) {
    return supabase.removeChannel(subscription);
  }
}

// وظائف مساعدة
export class UtilsService {
  // تحويل البيانات من Local Storage
  static async migrateFromLocalStorage() {
    const user = await AuthService.getCurrentUser();
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');

    // استيراد البيانات من Local Storage
    const localData = {
      cars: JSON.parse(localStorage.getItem('cars') || '[]'),
      employees: JSON.parse(localStorage.getItem('employees') || '[]'),
      expenses: JSON.parse(localStorage.getItem('expenses') || '[]')
    };

    const results = {
      cars: [],
      employees: [],
      expenses: [],
      errors: []
    };

    // ترحيل السيارات
    for (const car of localData.cars) {
      const { data, error } = await DatabaseService.addCar(car, user.id);
      if (error) {
        results.errors.push(`خطأ في ترحيل السيارة ${car.name}: ${error.message}`);
      } else {
        results.cars.push(data[0]);
      }
    }

    // ترحيل الموظفين
    for (const employee of localData.employees) {
      const { data, error } = await DatabaseService.addEmployee(employee, user.id);
      if (error) {
        results.errors.push(`خطأ في ترحيل الموظف ${employee.name}: ${error.message}`);
      } else {
        results.employees.push(data[0]);
      }
    }

    // ترحيل المصروفات
    for (const expense of localData.expenses) {
      const { data, error } = await DatabaseService.addExpense(expense, user.id);
      if (error) {
        results.errors.push(`خطأ في ترحيل المصروف: ${error.message}`);
      } else {
        results.expenses.push(data[0]);
      }
    }

    return results;
  }

  // تصدير البيانات
  static async exportData(userId) {
    const [carsResult, employeesResult, expensesResult] = await Promise.all([
      DatabaseService.getCars(userId),
      DatabaseService.getEmployees(userId),
      DatabaseService.getExpenses(userId)
    ]);

    return {
      cars: carsResult.data || [],
      employees: employeesResult.data || [],
      expenses: expensesResult.data || [],
      exportDate: new Date().toISOString()
    };
  }
}
