# 🚀 دليل إعداد Supabase لنظام إدارة مصروفات السيارات

## 📋 الخطوات المطلوبة

### 1️⃣ **إنشاء حساب Supabase**

1. اذهب إلى: [supabase.com](https://supabase.com)
2. انقر على **"Start your project"**
3. سجل دخول بـ GitHub أو Google
4. انقر على **"New Project"**

### 2️⃣ **إعداد المشروع**

1. **اختر Organization:** (أو أنشئ واحدة جديدة)
2. **اسم المشروع:** `car-expense-manager`
3. **كلمة مرور قاعدة البيانات:** (احفظها في مكان آمن)
4. **المنطقة:** اختر الأقرب لك
5. انقر **"Create new project"**

⏳ **انتظر 2-3 دقائق حتى يكتمل الإعداد**

### 3️⃣ **الحصول على مفاتيح API**

1. في لوحة التحكم، اذهب إلى **Settings** → **API**
2. انسخ:
   - **Project URL** (مثل: `https://xxxxx.supabase.co`)
   - **anon public** key (المفتاح العام)

### 4️⃣ **إعداد قاعدة البيانات**

1. اذهب إلى **SQL Editor** في الشريط الجانبي
2. انقر **"New query"**
3. انسخ محتوى ملف `database-schema-simple.sql` والصقه
4. انقر **"Run"** لتنفيذ الكود

✅ **يجب أن ترى رسالة "Success. No rows returned"**

### 5️⃣ **إعداد Storage للمرفقات**

1. اذهب إلى **Storage** في الشريط الجانبي
2. انقر **"Create a new bucket"**
3. اسم الـ bucket: `car-expenses-attachments`
4. اجعله **Private** (غير عام)
5. انقر **"Create bucket"**

### 6️⃣ **تحديث ملف التكوين**

1. افتح ملف `supabase-config.js`
2. استبدل:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   
   بالقيم الحقيقية من مشروعك:
   ```javascript
   const SUPABASE_URL = 'https://xxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

### 7️⃣ **اختبار الاتصال**

1. احفظ الملفات
2. ارفع التحديثات إلى GitHub
3. انتظر حتى يتم نشر الموقع
4. افتح الموقع وجرب تسجيل حساب جديد

---

## 🔧 **إعدادات إضافية (اختيارية)**

### **تفعيل مصادقة Google:**
1. في **Authentication** → **Providers**
2. فعّل **Google**
3. أدخل Client ID و Client Secret من Google Console

### **تفعيل مصادقة GitHub:**
1. في **Authentication** → **Providers**
2. فعّل **GitHub**
3. أدخل Client ID و Client Secret من GitHub

---

## 🚨 **استكشاف الأخطاء**

### **خطأ في الاتصال:**
- تأكد من صحة URL و API Key
- تأكد من أن المشروع نشط في Supabase

### **خطأ في قاعدة البيانات:**
- تأكد من تنفيذ ملف SQL بنجاح
- تحقق من وجود الجداول في **Table Editor**

### **خطأ في المصادقة:**
- تأكد من تفعيل Email في **Authentication** → **Providers**
- تحقق من إعدادات RLS في الجداول

---

## 📞 **الدعم**

إذا واجهت أي مشكلة:
1. تحقق من **Logs** في Supabase Dashboard
2. راجع **Network** tab في Developer Tools
3. تأكد من أن جميع الملفات محدثة على GitHub

---

## ✅ **التحقق من نجاح الإعداد**

عند اكتمال الإعداد، يجب أن تتمكن من:
- ✅ تسجيل حساب جديد
- ✅ تسجيل الدخول والخروج
- ✅ إضافة سيارة جديدة
- ✅ إضافة مصروف جديد
- ✅ رفع مرفق
- ✅ مشاهدة البيانات محفوظة بين الجلسات

**🎉 مبروك! النظام جاهز للاستخدام!**
