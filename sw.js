// Service Worker لنظام إدارة مصروفات السيارات
// مطور البرنامج: محمد مبروك عطية - Mohamed Mabrouk Attia

const CACHE_NAME = 'car-expense-manager-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://apis.google.com/js/api.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap'
];

// تثبيت Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: تم التثبيت');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: تم فتح الذاكرة المؤقتة');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.error('Service Worker: خطأ في التثبيت', error);
      })
  );
  
  // فرض التفعيل الفوري
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: تم التفعيل');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // حذف الذاكرة المؤقتة القديمة
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: حذف ذاكرة مؤقتة قديمة', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // السيطرة على جميع العملاء فوراً
  return self.clients.claim();
});

// اعتراض طلبات الشبكة
self.addEventListener('fetch', function(event) {
  // تجاهل طلبات غير HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // تجاهل طلبات Google APIs المعقدة
  if (event.request.url.includes('googleapis.com') && 
      (event.request.method !== 'GET' || event.request.url.includes('upload'))) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // إرجاع النسخة المحفوظة إذا وجدت
        if (response) {
          console.log('Service Worker: تم العثور في الذاكرة المؤقتة', event.request.url);
          return response;
        }
        
        // محاولة جلب من الشبكة
        return fetch(event.request)
          .then(function(response) {
            // التحقق من صحة الاستجابة
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // نسخ الاستجابة للحفظ
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(function(cache) {
                // حفظ الملفات المهمة فقط
                if (shouldCache(event.request.url)) {
                  cache.put(event.request, responseToCache);
                  console.log('Service Worker: تم حفظ في الذاكرة المؤقتة', event.request.url);
                }
              });
            
            return response;
          })
          .catch(function(error) {
            console.log('Service Worker: خطأ في الشبكة', event.request.url, error);
            
            // إرجاع صفحة بديلة للملفات المهمة
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // إرجاع استجابة فارغة للموارد الأخرى
            return new Response('', {
              status: 200,
              statusText: 'OK',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// تحديد الملفات التي يجب حفظها
function shouldCache(url) {
  // حفظ الملفات الأساسية
  const importantPatterns = [
    '/index.html',
    '/app.js',
    '/manifest.json',
    'tailwindcss.com',
    'chart.js',
    'xlsx',
    'font-awesome',
    'googleapis.com/css',
    'fonts.googleapis.com'
  ];
  
  return importantPatterns.some(pattern => url.includes(pattern));
}

// معالجة رسائل من التطبيق الرئيسي
self.addEventListener('message', function(event) {
  console.log('Service Worker: تم استلام رسالة', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      timestamp: new Date().toISOString()
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(function() {
      event.ports[0].postMessage({
        success: true,
        message: 'تم مسح الذاكرة المؤقتة'
      });
    });
  }
});

// معالجة تحديثات الخلفية
self.addEventListener('sync', function(event) {
  console.log('Service Worker: مزامنة الخلفية', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// تنفيذ مزامنة الخلفية
function doBackgroundSync() {
  console.log('Service Worker: تنفيذ مزامنة الخلفية');
  
  // هنا يمكن إضافة منطق مزامنة البيانات
  // مثل رفع البيانات المحلية إلى السحابة
  
  return Promise.resolve();
}

// معالجة الإشعارات
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: تم النقر على الإشعار', event.notification.tag);
  
  event.notification.close();
  
  // فتح التطبيق عند النقر على الإشعار
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// معالجة إغلاق الإشعارات
self.addEventListener('notificationclose', function(event) {
  console.log('Service Worker: تم إغلاق الإشعار', event.notification.tag);
});

// تسجيل أخطاء Service Worker
self.addEventListener('error', function(event) {
  console.error('Service Worker: خطأ عام', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('Service Worker: رفض غير معالج', event.reason);
});

// إشعار بالتحديثات المتاحة
self.addEventListener('updatefound', function(event) {
  console.log('Service Worker: تم العثور على تحديث');
  
  // إرسال رسالة للتطبيق الرئيسي
  self.clients.matchAll().then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        message: 'يتوفر تحديث جديد للتطبيق'
      });
    });
  });
});

console.log('Service Worker: تم تحميل ملف Service Worker بنجاح');
console.log('مطور البرنامج: محمد مبروك عطية - Mohamed Mabrouk Attia');
