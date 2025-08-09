-- إنشاء قاعدة بيانات نظام إدارة مصروفات السيارات - نسخة مبسطة
-- يجب تشغيل هذا الكود في Supabase SQL Editor

-- 1. جدول السيارات
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT,
  year INTEGER,
  license_plate TEXT,
  color TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول الموظفين
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  position TEXT,
  salary DECIMAL(10,2),
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول فئات المصروفات
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول المصروفات
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  date DATE NOT NULL,
  receipt_number TEXT,
  vendor TEXT,
  payment_method TEXT DEFAULT 'cash',
  is_recurring BOOLEAN DEFAULT false,
  recurring_period TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. جدول المرفقات
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_cars_user_id ON cars(user_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_car_id ON expenses(car_id);
CREATE INDEX idx_expenses_employee_id ON expenses(employee_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_type ON expenses(type);
CREATE INDEX idx_attachments_expense_id ON attachments(expense_id);

-- إنشاء وظيفة التحديث التلقائي للوقت
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق التحديث التلقائي على الجداول
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إعداد Row Level Security (RLS)
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - المستخدمون يمكنهم الوصول لبياناتهم فقط

-- سياسات السيارات
CREATE POLICY "Users can view their own cars" ON cars
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cars" ON cars
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cars" ON cars
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cars" ON cars
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات الموظفين
CREATE POLICY "Users can view their own employees" ON employees
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own employees" ON employees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees" ON employees
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees" ON employees
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات فئات المصروفات
CREATE POLICY "Users can view their own categories" ON expense_categories
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own categories" ON expense_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON expense_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON expense_categories
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات المصروفات
CREATE POLICY "Users can view their own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON expenses
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات المرفقات
CREATE POLICY "Users can view attachments for their expenses" ON attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM expenses 
            WHERE expenses.id = attachments.expense_id 
            AND expenses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert attachments for their expenses" ON attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM expenses 
            WHERE expenses.id = attachments.expense_id 
            AND expenses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update attachments for their expenses" ON attachments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM expenses 
            WHERE expenses.id = attachments.expense_id 
            AND expenses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete attachments for their expenses" ON attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM expenses 
            WHERE expenses.id = attachments.expense_id 
            AND expenses.user_id = auth.uid()
        )
    );

-- إدراج فئات افتراضية (سيتم إدراجها عند تسجيل المستخدم الأول)
INSERT INTO expense_categories (user_id, name, description, color) 
SELECT 
    auth.uid(),
    unnest(ARRAY['وقود', 'صيانة', 'تأمين', 'رواتب', 'أخرى']),
    unnest(ARRAY['مصروفات الوقود والبنزين', 'صيانة وإصلاح السيارات', 'تأمين السيارات', 'رواتب الموظفين', 'مصروفات متنوعة']),
    unnest(ARRAY['#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#6B7280'])
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;
