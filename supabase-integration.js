// تكامل Supabase مع النظام الحالي
// هذا الملف يربط النظام الحالي مع Supabase

// متغيرات عامة
let supabaseClient = null;
let currentUser = null;
let isSupabaseEnabled = false;

// تهيئة Supabase
async function initSupabase() {
    try {
        // التحقق من وجود إعدادات Supabase
        if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('Supabase غير مُعد - سيعمل النظام محلياً فقط');
            return false;
        }

        // التحقق من وجود مكتبة Supabase
        if (typeof window.supabase === 'undefined') {
            console.error('مكتبة Supabase غير محملة');
            return false;
        }

        // إنشاء عميل Supabase
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // التحقق من حالة المصادقة
        const { data: { user } } = await supabaseClient.auth.getUser();
        currentUser = user;
        
        // مراقبة تغييرات المصادقة
        supabaseClient.auth.onAuthStateChange((event, session) => {
            currentUser = session?.user || null;
            handleAuthStateChange(event, session);
        });

        isSupabaseEnabled = true;
        console.log('✅ تم تهيئة Supabase بنجاح');
        return true;
    } catch (error) {
        console.error('❌ خطأ في تهيئة Supabase:', error);
        return false;
    }
}

// معالجة تغييرات حالة المصادقة
function handleAuthStateChange(event, session) {
    if (event === 'SIGNED_IN') {
        showSuccessMessage('تم تسجيل الدخول بنجاح');
        hideLoginForm();
        showMainApp();
        showSignOutButton();
        syncDataToSupabase();
    } else if (event === 'SIGNED_OUT') {
        showInfoMessage('تم تسجيل الخروج');
        showLoginForm();
        hideMainApp();
        hideSignOutButton();
    }
}

// إظهار/إخفاء نماذج المصادقة
function showLoginForm() {
    const loginSection = document.getElementById('loginSection');
    const mainApp = document.getElementById('mainApp');
    if (loginSection) loginSection.style.display = 'block';
    if (mainApp) mainApp.style.display = 'none';
}

function hideLoginForm() {
    const loginSection = document.getElementById('loginSection');
    if (loginSection) loginSection.style.display = 'none';
}

function showMainApp() {
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'block';
}

function hideMainApp() {
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'none';
}

// وظائف المصادقة
async function signUpWithEmail(email, password, fullName) {
    if (!isSupabaseEnabled) {
        showErrorMessage('Supabase غير مُعد');
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) throw error;
        
        showSuccessMessage('تم إنشاء الحساب! تحقق من بريدك الإلكتروني للتفعيل');
        return data;
    } catch (error) {
        showErrorMessage('خطأ في إنشاء الحساب: ' + error.message);
        throw error;
    }
}

async function signInWithEmail(email, password) {
    if (!isSupabaseEnabled) {
        showErrorMessage('Supabase غير مُعد');
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    } catch (error) {
        showErrorMessage('خطأ في تسجيل الدخول: ' + error.message);
        throw error;
    }
}

async function signInWithGoogle() {
    if (!isSupabaseEnabled) {
        showErrorMessage('Supabase غير مُعد');
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;
        return data;
    } catch (error) {
        showErrorMessage('خطأ في تسجيل الدخول بـ Google: ' + error.message);
        throw error;
    }
}

async function signOut() {
    if (!isSupabaseEnabled) {
        return;
    }

    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    } catch (error) {
        showErrorMessage('خطأ في تسجيل الخروج: ' + error.message);
    }
}

// مزامنة البيانات مع Supabase
async function syncDataToSupabase() {
    if (!isSupabaseEnabled || !currentUser) return;

    try {
        // مزامنة السيارات
        await syncCarsToSupabase();
        
        // مزامنة الموظفين
        await syncEmployeesToSupabase();
        
        // مزامنة المصروفات
        await syncExpensesToSupabase();
        
        showSuccessMessage('تم مزامنة البيانات مع السحابة');
    } catch (error) {
        console.error('خطأ في المزامنة:', error);
        showErrorMessage('خطأ في مزامنة البيانات');
    }
}

// مزامنة السيارات
async function syncCarsToSupabase() {
    const localCars = AppData.cars || [];
    
    for (const car of localCars) {
        if (!car.synced) {
            try {
                const { data, error } = await supabaseClient
                    .from('cars')
                    .insert([{
                        name: car.name,
                        model: car.model,
                        year: car.year,
                        license_plate: car.licensePlate,
                        color: car.color,
                        notes: car.notes,
                        user_id: currentUser.id
                    }]);

                if (error) throw error;
                
                // تحديث البيانات المحلية
                car.synced = true;
                car.supabase_id = data[0].id;
            } catch (error) {
                console.error('خطأ في مزامنة السيارة:', car.name, error);
            }
        }
    }
}

// مزامنة الموظفين
async function syncEmployeesToSupabase() {
    const localEmployees = AppData.employees || [];
    
    for (const employee of localEmployees) {
        if (!employee.synced) {
            try {
                const { data, error } = await supabaseClient
                    .from('employees')
                    .insert([{
                        name: employee.name,
                        phone: employee.phone,
                        position: employee.position,
                        salary: employee.salary,
                        hire_date: employee.hireDate,
                        notes: employee.notes,
                        user_id: currentUser.id
                    }]);

                if (error) throw error;
                
                // تحديث البيانات المحلية
                employee.synced = true;
                employee.supabase_id = data[0].id;
            } catch (error) {
                console.error('خطأ في مزامنة الموظف:', employee.name, error);
            }
        }
    }
}

// مزامنة المصروفات
async function syncExpensesToSupabase() {
    const localExpenses = AppData.expenses || [];
    
    for (const expense of localExpenses) {
        if (!expense.synced) {
            try {
                // العثور على معرف السيارة في Supabase
                const car = AppData.cars.find(c => c.id === expense.carId);
                const employee = AppData.employees.find(e => e.id === expense.employeeId);
                
                const { data, error } = await supabaseClient
                    .from('expenses')
                    .insert([{
                        type: expense.type,
                        amount: expense.amount,
                        date: expense.date,
                        description: expense.description,
                        receipt_number: expense.receiptNumber,
                        car_id: car?.supabase_id || null,
                        employee_id: employee?.supabase_id || null,
                        user_id: currentUser.id
                    }]);

                if (error) throw error;
                
                // تحديث البيانات المحلية
                expense.synced = true;
                expense.supabase_id = data[0].id;
            } catch (error) {
                console.error('خطأ في مزامنة المصروف:', expense, error);
            }
        }
    }
}

// تحميل البيانات من Supabase
async function loadDataFromSupabase() {
    if (!isSupabaseEnabled || !currentUser) return;

    try {
        // تحميل السيارات
        const { data: cars } = await supabaseClient
            .from('cars')
            .select('*')
            .eq('user_id', currentUser.id);

        // تحميل الموظفين
        const { data: employees } = await supabaseClient
            .from('employees')
            .select('*')
            .eq('user_id', currentUser.id);

        // تحميل المصروفات
        const { data: expenses } = await supabaseClient
            .from('expenses')
            .select('*')
            .eq('user_id', currentUser.id);

        // دمج البيانات مع البيانات المحلية
        if (cars) mergeCarsData(cars);
        if (employees) mergeEmployeesData(employees);
        if (expenses) mergeExpensesData(expenses);

        showSuccessMessage('تم تحميل البيانات من السحابة');
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showErrorMessage('خطأ في تحميل البيانات من السحابة');
    }
}

// دمج بيانات السيارات
function mergeCarsData(supabaseCars) {
    // تحويل بيانات Supabase إلى تنسيق النظام المحلي
    const convertedCars = supabaseCars.map(car => ({
        id: car.id,
        name: car.name,
        model: car.model,
        year: car.year,
        licensePlate: car.license_plate,
        color: car.color,
        notes: car.notes,
        synced: true,
        supabase_id: car.id
    }));

    // دمج مع البيانات المحلية
    AppData.cars = [...(AppData.cars || []), ...convertedCars];
    saveData();
}

// دمج بيانات الموظفين
function mergeEmployeesData(supabaseEmployees) {
    const convertedEmployees = supabaseEmployees.map(employee => ({
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        position: employee.position,
        salary: employee.salary,
        hireDate: employee.hire_date,
        notes: employee.notes,
        synced: true,
        supabase_id: employee.id
    }));

    AppData.employees = [...(AppData.employees || []), ...convertedEmployees];
    saveData();
}

// دمج بيانات المصروفات
function mergeExpensesData(supabaseExpenses) {
    const convertedExpenses = supabaseExpenses.map(expense => ({
        id: expense.id,
        type: expense.type,
        amount: expense.amount,
        date: expense.date,
        description: expense.description,
        receiptNumber: expense.receipt_number,
        carId: expense.car_id,
        employeeId: expense.employee_id,
        synced: true,
        supabase_id: expense.id
    }));

    AppData.expenses = [...(AppData.expenses || []), ...convertedExpenses];
    saveData();
}

// معالجة نماذج تسجيل الدخول
function setupAuthForms() {
    // تبديل التبويبات
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginTab && signupTab && loginForm && signupForm) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            loginTab.classList.remove('text-gray-600');
            signupTab.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
            signupTab.classList.add('text-gray-600');
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
        });

        signupTab.addEventListener('click', () => {
            signupTab.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            signupTab.classList.remove('text-gray-600');
            loginTab.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
            loginTab.classList.add('text-gray-600');
            signupForm.style.display = 'block';
            loginForm.style.display = 'none';
        });

        // معالجة نموذج تسجيل الدخول
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                await signInWithEmail(email, password);
            } catch (error) {
                console.error('خطأ في تسجيل الدخول:', error);
            }
        });

        // معالجة نموذج إنشاء الحساب
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            try {
                await signUpWithEmail(email, password, name);
            } catch (error) {
                console.error('خطأ في إنشاء الحساب:', error);
            }
        });
    }

    // تسجيل الدخول بـ Google
    const googleSignInBtn = document.getElementById('googleSignIn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            try {
                await signInWithGoogle();
            } catch (error) {
                console.error('خطأ في تسجيل الدخول بـ Google:', error);
            }
        });
    }

    // العمل بدون حساب
    const workOfflineBtn = document.getElementById('workOffline');
    if (workOfflineBtn) {
        workOfflineBtn.addEventListener('click', () => {
            hideLoginForm();
            showMainApp();
            showInfoMessage('تعمل الآن في الوضع المحلي - لن يتم حفظ البيانات في السحابة');
        });
    }
}

// إظهار/إخفاء نماذج المصادقة
function showLoginForm() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (mainApp) mainApp.classList.add('hidden');
}

function hideLoginForm() {
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) loginScreen.style.display = 'none';
}

function showMainApp() {
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.classList.remove('hidden');
}

function hideMainApp() {
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.classList.add('hidden');
}

// إظهار/إخفاء زر تسجيل الخروج
function showSignOutButton() {
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) signOutBtn.style.display = 'block';
}

function hideSignOutButton() {
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) signOutBtn.style.display = 'none';
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    await initSupabase();
    setupAuthForms();

    if (isSupabaseEnabled && currentUser) {
        hideLoginForm();
        showMainApp();
        await loadDataFromSupabase();
    } else if (isSupabaseEnabled) {
        showLoginForm();
        hideMainApp();
    } else {
        // العمل في الوضع المحلي فقط
        hideLoginForm();
        showMainApp();
    }
});
