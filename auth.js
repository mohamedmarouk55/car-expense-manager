// نظام المصادقة والتحقق من الهوية
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        // التحقق من حالة المستخدم الحالية
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            this.currentUser = user;
            this.isAuthenticated = true;
            this.showMainApp();
        } else {
            this.showLoginScreen();
        }

        // الاستماع لتغييرات حالة المصادقة
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                this.isAuthenticated = true;
                this.showMainApp();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.isAuthenticated = false;
                this.showLoginScreen();
            }
        });
    }

    // تسجيل الدخول بالبريد الإلكتروني
    async signInWithEmail(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            showNotification('تم تسجيل الدخول بنجاح!', 'success');
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            showNotification('خطأ في تسجيل الدخول: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // تسجيل الدخول بـ Google
    async signInWithGoogle() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تسجيل الدخول بـ Google:', error);
            showNotification('خطأ في تسجيل الدخول بـ Google: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // إنشاء حساب جديد
    async signUp(email, password, fullName) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });

            if (error) throw error;

            showNotification('تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني.', 'success');
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء الحساب:', error);
            showNotification('خطأ في إنشاء الحساب: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // تسجيل الخروج
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            showNotification('تم تسجيل الخروج بنجاح!', 'success');
            return { success: true };
        } catch (error) {
            console.error('خطأ في تسجيل الخروج:', error);
            showNotification('خطأ في تسجيل الخروج: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // إعادة تعيين كلمة المرور
    async resetPassword(email) {
        try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password'
            });

            if (error) throw error;

            showNotification('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني!', 'success');
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إعادة تعيين كلمة المرور:', error);
            showNotification('خطأ في إعادة تعيين كلمة المرور: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // عرض شاشة تسجيل الدخول
    showLoginScreen() {
        document.body.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
                <div class="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold text-white mb-2">نظام إدارة المصروفات</h1>
                        <p class="text-white/70">مرحباً بك في النظام السحابي الجديد</p>
                    </div>

                    <div id="auth-tabs" class="flex mb-6 bg-white/10 rounded-lg p-1">
                        <button id="login-tab" class="flex-1 py-2 px-4 rounded-md text-white font-medium transition-all duration-200 bg-white/20">
                            تسجيل الدخول
                        </button>
                        <button id="signup-tab" class="flex-1 py-2 px-4 rounded-md text-white/70 font-medium transition-all duration-200">
                            إنشاء حساب
                        </button>
                    </div>

                    <!-- نموذج تسجيل الدخول -->
                    <form id="login-form" class="space-y-4">
                        <div>
                            <input type="email" id="login-email" placeholder="البريد الإلكتروني" required
                                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400">
                        </div>
                        <div>
                            <input type="password" id="login-password" placeholder="كلمة المرور" required
                                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400">
                        </div>
                        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200">
                            تسجيل الدخول
                        </button>
                        <button type="button" id="forgot-password" class="w-full text-white/70 hover:text-white text-sm">
                            نسيت كلمة المرور؟
                        </button>
                    </form>

                    <!-- نموذج إنشاء حساب -->
                    <form id="signup-form" class="space-y-4 hidden">
                        <div>
                            <input type="text" id="signup-name" placeholder="الاسم الكامل" required
                                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400">
                        </div>
                        <div>
                            <input type="email" id="signup-email" placeholder="البريد الإلكتروني" required
                                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400">
                        </div>
                        <div>
                            <input type="password" id="signup-password" placeholder="كلمة المرور (6 أحرف على الأقل)" required minlength="6"
                                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400">
                        </div>
                        <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200">
                            إنشاء حساب
                        </button>
                    </form>

                    <div class="mt-6 text-center">
                        <div class="relative">
                            <div class="absolute inset-0 flex items-center">
                                <div class="w-full border-t border-white/20"></div>
                            </div>
                            <div class="relative flex justify-center text-sm">
                                <span class="px-2 bg-transparent text-white/70">أو</span>
                            </div>
                        </div>
                        <button id="google-signin" class="mt-4 w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
                            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            تسجيل الدخول بـ Google
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupLoginEventListeners();
    }

    // عرض التطبيق الرئيسي
    showMainApp() {
        // إعادة تحميل التطبيق الرئيسي
        location.reload();
    }

    // إعداد مستمعي الأحداث لشاشة تسجيل الدخول
    setupLoginEventListeners() {
        // التبديل بين تسجيل الدخول وإنشاء حساب
        document.getElementById('login-tab').addEventListener('click', () => {
            document.getElementById('login-tab').classList.add('bg-white/20');
            document.getElementById('login-tab').classList.remove('text-white/70');
            document.getElementById('signup-tab').classList.remove('bg-white/20');
            document.getElementById('signup-tab').classList.add('text-white/70');
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('signup-form').classList.add('hidden');
        });

        document.getElementById('signup-tab').addEventListener('click', () => {
            document.getElementById('signup-tab').classList.add('bg-white/20');
            document.getElementById('signup-tab').classList.remove('text-white/70');
            document.getElementById('login-tab').classList.remove('bg-white/20');
            document.getElementById('login-tab').classList.add('text-white/70');
            document.getElementById('signup-form').classList.remove('hidden');
            document.getElementById('login-form').classList.add('hidden');
        });

        // تسجيل الدخول
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            await this.signInWithEmail(email, password);
        });

        // إنشاء حساب
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            await this.signUp(email, password, name);
        });

        // تسجيل الدخول بـ Google
        document.getElementById('google-signin').addEventListener('click', async () => {
            await this.signInWithGoogle();
        });

        // نسيت كلمة المرور
        document.getElementById('forgot-password').addEventListener('click', async () => {
            const email = prompt('أدخل بريدك الإلكتروني:');
            if (email) {
                await this.resetPassword(email);
            }
        });
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        return this.currentUser;
    }

    // التحقق من حالة المصادقة
    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

// إنشاء مثيل من مدير المصادقة
const authManager = new AuthManager();
