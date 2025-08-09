// نظام إدارة الملفات والمرفقات
class FileManager {
    constructor() {
        this.maxFileSize = 5 * 1024 * 1024; // 5 ميجا
        this.allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        this.setupFileUpload();
    }

    // إعداد منطقة رفع الملفات
    setupFileUpload() {
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('expenseAttachment');

        if (!fileUploadArea || !fileInput) return;

        // منع السلوك الافتراضي للسحب والإفلات
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileUploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // تمييز منطقة الإفلات
        ['dragenter', 'dragover'].forEach(eventName => {
            fileUploadArea.addEventListener(eventName, () => this.highlight(fileUploadArea), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileUploadArea.addEventListener(eventName, () => this.unhighlight(fileUploadArea), false);
        });

        // معالجة الإفلات
        fileUploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);

        // النقر لاختيار الملف
        fileUploadArea.addEventListener('click', () => fileInput.click());

        // تغيير الملف
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    // منع السلوك الافتراضي
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // تمييز منطقة الإفلات
    highlight(element) {
        element.classList.add('border-blue-500', 'bg-blue-50');
    }

    // إزالة تمييز منطقة الإفلات
    unhighlight(element) {
        element.classList.remove('border-blue-500', 'bg-blue-50');
    }

    // معالجة الإفلات
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.handleFiles(files);
    }

    // معالجة اختيار الملف
    handleFileSelect(e) {
        const files = e.target.files;
        this.handleFiles(files);
    }

    // معالجة الملفات
    handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        
        // التحقق من نوع الملف
        if (!this.isValidFileType(file)) {
            showNotification('نوع الملف غير مدعوم. يرجى اختيار صورة أو PDF أو مستند Word/Excel.', 'error');
            return;
        }

        // التحقق من حجم الملف
        if (!this.isValidFileSize(file)) {
            showNotification('حجم الملف كبير جداً. الحد الأقصى 5 ميجا.', 'error');
            return;
        }

        // عرض معلومات الملف
        this.displayFileInfo(file);
    }

    // التحقق من نوع الملف
    isValidFileType(file) {
        return this.allowedTypes.includes(file.type);
    }

    // التحقق من حجم الملف
    isValidFileSize(file) {
        return file.size <= this.maxFileSize;
    }

    // عرض معلومات الملف
    displayFileInfo(file) {
        const uploadedFileDiv = document.getElementById('uploadedFile');
        const fileNameSpan = document.getElementById('fileName');

        if (uploadedFileDiv && fileNameSpan) {
            fileNameSpan.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
            uploadedFileDiv.classList.remove('hidden');
        }

        // حفظ الملف مؤقتاً
        this.currentFile = file;
    }

    // تنسيق حجم الملف
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // إزالة الملف
    removeFile() {
        const uploadedFileDiv = document.getElementById('uploadedFile');
        const fileInput = document.getElementById('expenseAttachment');

        if (uploadedFileDiv) {
            uploadedFileDiv.classList.add('hidden');
        }

        if (fileInput) {
            fileInput.value = '';
        }

        this.currentFile = null;
    }

    // رفع الملف إلى Supabase
    async uploadFile(expenseId) {
        if (!this.currentFile) {
            return { success: true, data: null };
        }

        try {
            showNotification('جاري رفع الملف...', 'info');

            const result = await dbAPI.uploadFile(this.currentFile, expenseId);

            if (result.success) {
                this.removeFile();
                return result;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('خطأ في رفع الملف:', error);
            showNotification('خطأ في رفع الملف: ' + error.message, 'error');
            return { success: false, error };
        }
    }

    // الحصول على الملف الحالي
    getCurrentFile() {
        return this.currentFile;
    }

    // عرض المرفقات
    async displayAttachments(expenseId, container) {
        try {
            const { data, error } = await supabase
                .from('attachments')
                .select('*')
                .eq('expense_id', expenseId);

            if (error) throw error;

            if (!container) return;

            if (data.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-sm">لا توجد مرفقات</p>';
                return;
            }

            let html = '<div class="space-y-2">';
            
            for (const attachment of data) {
                const fileUrl = await this.getFileUrl(attachment.file_path);
                const fileIcon = this.getFileIcon(attachment.mime_type);
                
                html += `
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div class="flex items-center">
                            <i class="${fileIcon} text-blue-500 ml-2"></i>
                            <div>
                                <p class="text-sm font-medium">${attachment.file_name}</p>
                                <p class="text-xs text-gray-500">${this.formatFileSize(attachment.file_size)}</p>
                            </div>
                        </div>
                        <div class="flex space-x-1">
                            <a href="${fileUrl}" target="_blank" class="text-blue-500 hover:text-blue-700">
                                <i class="fas fa-eye"></i>
                            </a>
                            <a href="${fileUrl}" download="${attachment.file_name}" class="text-green-500 hover:text-green-700">
                                <i class="fas fa-download"></i>
                            </a>
                            <button onclick="fileManager.deleteAttachment('${attachment.id}', '${attachment.file_path}')" class="text-red-500 hover:text-red-700">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
            container.innerHTML = html;

        } catch (error) {
            console.error('خطأ في عرض المرفقات:', error);
            if (container) {
                container.innerHTML = '<p class="text-red-500 text-sm">خطأ في تحميل المرفقات</p>';
            }
        }
    }

    // الحصول على رابط الملف
    async getFileUrl(filePath) {
        const result = await dbAPI.getFileUrl(filePath);
        return result.success ? result.url : '#';
    }

    // الحصول على أيقونة الملف
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) {
            return 'fas fa-image';
        } else if (mimeType === 'application/pdf') {
            return 'fas fa-file-pdf';
        } else if (mimeType.includes('word')) {
            return 'fas fa-file-word';
        } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
            return 'fas fa-file-excel';
        } else {
            return 'fas fa-file';
        }
    }

    // حذف مرفق
    async deleteAttachment(attachmentId, filePath) {
        if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) {
            return;
        }

        try {
            const result = await dbAPI.deleteFile(attachmentId, filePath);
            
            if (result.success) {
                // إعادة تحميل المرفقات
                const container = document.querySelector('.attachments-container');
                if (container) {
                    const expenseId = container.dataset.expenseId;
                    if (expenseId) {
                        this.displayAttachments(expenseId, container);
                    }
                }
            }
        } catch (error) {
            console.error('خطأ في حذف المرفق:', error);
            showNotification('خطأ في حذف المرفق: ' + error.message, 'error');
        }
    }

    // معاينة الملف
    previewFile(file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // يمكن إضافة معاينة الصورة هنا
                console.log('معاينة الصورة:', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    // تحويل الملف إلى Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // ضغط الصورة (إذا كانت كبيرة)
    async compressImage(file, maxWidth = 1920, quality = 0.8) {
        if (!file.type.startsWith('image/')) {
            return file;
        }

        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // حساب الأبعاد الجديدة
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                // رسم الصورة المضغوطة
                ctx.drawImage(img, 0, 0, width, height);

                // تحويل إلى Blob
                canvas.toBlob(resolve, file.type, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }
}

// إنشاء مثيل من مدير الملفات
const fileManager = new FileManager();

// وظائف مساعدة عامة
function handleFileUpload(event) {
    fileManager.handleFileSelect(event);
}

function removeFile() {
    fileManager.removeFile();
}
