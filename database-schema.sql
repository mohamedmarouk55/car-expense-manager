-- إنشاء قاعدة بيانات نظام إدارة مصروفات السيارات
-- يجب تشغيل هذا الكود في Supabase SQL Editor

-- 2. جدول السيارات
CREATE TABLE IF NOT EXISTS cars (
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

-- 3. جدول الموظفين
CREATE TABLE IF NOT EXISTS employees (
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

-- 4. جدول فئات المصروفات
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج فئات افتراضية
INSERT INTO expense_categories (name, description, color) VALUES
('وقود', 'مصروفات الوقود والبنزين', '#EF4444'),
('صيانة', 'صيانة وإصلاح السيارات', '#F59E0B'),
('تأمين', 'تأمين السيارات', '#10B981'),
('رواتب', 'رواتب الموظفين', '#8B5CF6'),
('أخرى', 'مصروفات متنوعة', '#6B7280')
ON CONFLICT DO NOTHING;

-- 5. جدول المصروفات
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'fuel', 'maintenance', 'salary', 'insurance', 'other'
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  date DATE NOT NULL,
  receipt_number TEXT,
  vendor TEXT, -- اسم المورد أو المحطة
  payment_method TEXT DEFAULT 'cash', -- 'cash', 'card', 'transfer'
  is_recurring BOOLEAN DEFAULT false,
  recurring_period TEXT, -- 'monthly', 'quarterly', 'yearly'
  tags TEXT[], -- مصفوفة من العلامات
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. جدول المرفقات
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. جدول الميزانية
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  period TEXT NOT NULL, -- 'monthly', 'quarterly', 'yearly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. جدول التنبيهات
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'maintenance', 'insurance', 'budget', 'custom'
  title TEXT NOT NULL,
  message TEXT,
  alert_date DATE NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_cars_user_id ON cars(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_car_id ON expenses(car_id);
CREATE INDEX IF NOT EXISTS idx_expenses_employee_id ON expenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
CREATE INDEX IF NOT EXISTS idx_attachments_expense_id ON attachments(expense_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);

-- إنشاء وظائف التحديث التلقائي للوقت
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
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

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

-- سياسات الميزانية
CREATE POLICY "Users can manage their own budgets" ON budgets
    FOR ALL USING (auth.uid() = user_id);

-- سياسات التنبيهات
CREATE POLICY "Users can manage their own alerts" ON alerts
    FOR ALL USING (auth.uid() = user_id);

-- إنشاء bucket للتخزين (يجب تشغيله من Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('car-expenses-attachments', 'car-expenses-attachments', true);

-- سياسة التخزين
-- CREATE POLICY "Users can upload their own files" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'car-expenses-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own files" ON storage.objects
--     FOR SELECT USING (bucket_id = 'car-expenses-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own files" ON storage.objects
--     FOR DELETE USING (bucket_id = 'car-expenses-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- إنشاء views مفيدة للتقارير
CREATE OR REPLACE VIEW expense_summary AS
SELECT 
    e.user_id,
    e.type,
    c.name as car_name,
    emp.name as employee_name,
    cat.name as category_name,
    DATE_TRUNC('month', e.date) as month,
    COUNT(*) as expense_count,
    SUM(e.amount) as total_amount,
    AVG(e.amount) as avg_amount
FROM expenses e
LEFT JOIN cars c ON e.car_id = c.id
LEFT JOIN employees emp ON e.employee_id = emp.id
LEFT JOIN expense_categories cat ON e.category_id = cat.id
GROUP BY e.user_id, e.type, c.name, emp.name, cat.name, DATE_TRUNC('month', e.date);

-- View للمصروفات الشهرية
CREATE OR REPLACE VIEW monthly_expenses AS
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    type,
    SUM(amount) as total_amount,
    COUNT(*) as expense_count
FROM expenses
GROUP BY user_id, DATE_TRUNC('month', date), type
ORDER BY month DESC, type;

-- إنشاء وظائف مخصصة
CREATE OR REPLACE FUNCTION get_user_statistics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_cars', (SELECT COUNT(*) FROM cars WHERE user_id = user_uuid AND is_active = true),
        'total_employees', (SELECT COUNT(*) FROM employees WHERE user_id = user_uuid AND is_active = true),
        'total_expenses', (SELECT COUNT(*) FROM expenses WHERE user_id = user_uuid),
        'total_amount', (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = user_uuid),
        'this_month_amount', (
            SELECT COALESCE(SUM(amount), 0) 
            FROM expenses 
            WHERE user_id = user_uuid 
            AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
        ),
        'last_month_amount', (
            SELECT COALESCE(SUM(amount), 0) 
            FROM expenses 
            WHERE user_id = user_uuid 
            AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
