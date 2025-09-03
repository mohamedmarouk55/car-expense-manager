/*
  تطبيق تقارير وتحليلات الموظفين
  - يدعم سحب وإفلات/رفع ملف CSV أو JSON
  - يحسب إجمالي الراتب (أساسي + جميع البدلات) تلقائياً
  - يولد جداول إحصائية ورسوم بيانية وتوصيات
*/

// حالة التطبيق المشتركة
const state = {
  rawRows: [],         // البيانات الأصلية كسجلات
  normalized: [],      // بعد التطبيع وإضافة الإجماليات
  columns: [],
  allowanceCols: [],   // أسماء أعمدة البدلات المكتشفة
  charts: {},
};

// عناصر DOM
const els = {
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  execSummary: document.getElementById('executive-summary'),
  tables: {
    employees: document.getElementById('employees-table'),
    dept: document.getElementById('dept-table'),
    nat: document.getElementById('nat-table'),
    gender: document.getElementById('gender-table'),
    exp: document.getElementById('exp-table'),
  },
  // recList: document.getElementById('recommendations-list'),
};

// تنقل جانبي بسيط
(function sidebarNav(){
  const buttons = document.querySelectorAll('.menu-item');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.section)?.scrollIntoView({behavior:'smooth', block:'start'});
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
})();

// أدوات مساعدة
const utils = {
  // يحاول تحويل النص إلى رقم
  toNumber(v){
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const cleaned = String(v).replace(/[^\d.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  },
  // CSV مع كشف الفاصل تلقائياً ومعالجة BOM ودعم الاقتباسات
  parseCSV(text){
    const rows = [];
    const norm = text.replace(/\r/g,'').replace(/^\uFEFF/, '');
    const lines = norm.split('\n').filter(l => l.trim().length > 0);
    if (!lines.length) return rows;
    const delim = utils.detectDelimiter(lines);
    const header = utils.splitCSVLine(lines[0], delim);
    for (let i=1;i<lines.length;i++){
      const cols = utils.splitCSVLine(lines[i], delim);
      const obj = {};
      header.forEach((h,idx)=> obj[String(h).trim()] = cols[idx] ?? '');
      rows.push(obj);
    }
    return rows;
  },
  splitCSVLine(line, delim = ','){
    const out = [];
    let cur = '';
    let q = false;
    for (let i=0;i<line.length;i++){
      const c = line[i];
      if (c === '"'){
        if (q && line[i+1] === '"'){ cur += '"'; i++; }
        else { q = !q; }
      } else if (c === delim && !q){
        out.push(cur); cur = '';
      } else {
        cur += c;
      }
    }
    out.push(cur);
    return out;
  },
  detectDelimiter(lines){
    const cands = [',',';','\t','|'];
    let best = ',', bestScore = -Infinity;
    for (const d of cands){
      const counts = lines.slice(0, Math.min(10, lines.length)).map(l => utils.splitCSVLine(l, d).length);
      const uniq = new Set(counts).size;
      const max = Math.max(...counts);
      const score = (max > 1 ? max : 0) - (uniq - 1); // تفضيل اتساق أكبر وعدد أعمدة أكثر
      if (score > bestScore){ bestScore = score; best = d; }
    }
    return best;
  },
  // يكتشف أعمدة البدلات (كل الأعمدة التي تبدأ بـ allowance أو تحتوي Allowance)
  allowanceKeys(cols){
    const regex = /^(allowance|بدل)/i;
    return cols.filter(c => regex.test(c) || /allowance/i.test(c));
  },
  groupBy(arr, keyFn){
    const m = new Map();
    for (const item of arr){
      const k = keyFn(item);
      const g = m.get(k) || [];
      g.push(item); m.set(k,g);
    }
    return m;
  },
  mean(nums){ return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : 0; },
  sum(nums){ return nums.reduce((a,b)=>a+b,0); },
  // تصنيف الخبرة إلى فئات
  expBucket(years){
    const y = Math.max(0, Math.floor(years || 0));
    if (y <= 1) return '0-1 سنة';
    if (y <= 3) return '2-3 سنوات';
    if (y <= 5) return '4-5 سنوات';
    if (y <= 10) return '6-10 سنوات';
    return 'أكثر من 10 سنوات';
  },
  formatMoney(v){
    return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(v);
  },
  // يبني شجرة: الشركة → الادارة التنفيذية → نائب الرئيس التنفيذي → الإدارات → المدير المباشر → الموظفون (الاسم — المسمى الوظيفي)
  buildHierarchy(rows, opts={}){
    const get = (r, keys) => keys.find(k=>r[k]!=null && r[k]!=='' && r[k]!==undefined);
    const companyName = opts.companyName || 'شركة الراشد';
    const dKeys   = ['department','القسم','الادارة','الإدارة','ادارة','الإداره'];
    const mKeys   = ['manager','المدير المباشر','المدير'];
    const nameKs  = ['name','الاسم'];
    const jobKs   = ['jobTitle','المسمى الوظيفي','المسمي الوظيفي'];

    // بناء خرائط: قسم → مدير → قائمة موظفين
    const deptMap = new Map();
    for (const r of rows){
      const dept = String(r[get(r, dKeys)] ?? '').trim() || 'غير محدد';
      const mgr  = String(r[get(r, mKeys)] ?? '').trim() || 'بدون مدير';
      const name = String(r[get(r, nameKs)] ?? '').trim();
      const job  = String(r[get(r, jobKs)] ?? '').trim();
      if (!deptMap.has(dept)) deptMap.set(dept, new Map());
      const mgrMap = deptMap.get(dept);
      if (!mgrMap.has(mgr)) mgrMap.set(mgr, []);
      mgrMap.get(mgr).push({ name, job });
    }

    // فرز بالعربية
    const sortAr = (a,b)=> String(a).localeCompare(String(b), 'ar');
    for (const mgrMap of deptMap.values()){
      for (const [mgr, arr] of mgrMap.entries()){
        arr.sort((a,b)=> sortAr(a.name, b.name));
      }
    }

    // بناء عقد الشجرة
    const root = { name: companyName, role: 'الادارة التنفيذية', children: [] };
    const vpNode = { name: 'نائب الرئيس التنفيذي', role: '', children: [] };

    const deptNames = [...deptMap.keys()].sort(sortAr);
    for (const dept of deptNames){
      const deptNode = { name: dept, role: 'ادارة', children: [] };
      const mgrMap = deptMap.get(dept);
      const mgrNames = [...mgrMap.keys()].sort(sortAr);
      for (const mgr of mgrNames){
        const mgrNode = { name: mgr, role: 'مدير مباشر', children: [] };
        const emps = mgrMap.get(mgr);
        for (const e of emps){
          const empName = e.name || '(موظف)';
          mgrNode.children.push({ name: empName, role: e.job || '', children: [] });
        }
        deptNode.children.push(mgrNode);
      }
      vpNode.children.push(deptNode);
    }

    root.children.push(vpNode);
    return root;
  }
};

// سحب وإفلات
(function initDnD(){
  const dz = els.dropZone;
  ['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('dragover'); }));
  dz.addEventListener('drop', e => {
    const file = e.dataTransfer?.files?.[0];
    if (file) readFile(file);
  });
  els.fileInput.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  });
})();

// قراءة ملف (CSV/JSON/Excel)
function readFile(file){
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const reader = new FileReader();
  reader.onload = () => {
    try {
      if (ext === 'json'){
        const text = String(reader.result || '');
        state.rawRows = JSON.parse(text);
      } else if (ext === 'xls' || ext === 'xlsx'){
        const data = reader.result; // ArrayBuffer
        parseExcel(data);
      } else {
        // محاولة كشف الترميز الشائع للويندوز (1256) عند فشل UTF-8 في إظهار العربية
        let text = '';
        try { text = new TextDecoder('utf-8',{fatal:false}).decode(reader.result); }
        catch { text = String(reader.result || ''); }
        if (/�/.test(text) && typeof TextDecoder !== 'undefined'){
          try { text = new TextDecoder('windows-1256', {fatal:false}).decode(reader.result); } catch {}
        }
        state.rawRows = utils.parseCSV(text);
      }
      normalizeData();
      renderAll();
    } catch(e){
      alert('تعذر قراءة الملف: ' + e.message);
    }
  };
  if (ext === 'xls' || ext === 'xlsx') reader.readAsArrayBuffer(file);
  else reader.readAsText(file, 'utf-8');
}

// تحليل ملف Excel إلى صفوف JSON
function parseExcel(arrayBuffer){
  if (typeof XLSX === 'undefined') throw new Error('مكتبة XLSX غير محمّلة');
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  state.rawRows = rows;
}

// تحميل ملف Excel الافتراضي من مجلد المشروع
async function loadDefaultExcel(){
  const btn = document.getElementById('btn-load-default');
  if (btn) btn.disabled = true;
  try {
    const url = 'excel/تقرير الموظفين - 03 Sep 2025.xls';
    const res = await fetch(url);
    if (!res.ok) throw new Error('تعذر الوصول للملف. افتح الصفحة عبر خادم محلي لتجاوز قيود المتصفح.');
    const buf = await res.arrayBuffer();
    parseExcel(buf);
    normalizeData();
    renderAll();
  } catch(e){
    alert('فشل تحميل ملف Excel الافتراضي: ' + e.message + '\nاقتراح: افتح الصفحة عبر إضافة Live Server في VS Code.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ربط زر التحميل الافتراضي
(function bindDefaultBtn(){
  document.getElementById('btn-load-default')?.addEventListener('click', loadDefaultExcel);
})();

// رسم شجرة هيكل تنظيمي مبسطة
function renderOrgChart(){
  const container = document.getElementById('org-tree');
  if (!container) return;
  const d = state.normalized;
  if (!d.length){ container.innerHTML = '<div class="small">لا توجد بيانات بعد.</div>'; return; }

  const tree = utils.buildHierarchy(d.map(x=>x.__orig || {}), { companyName: 'شركة الراشد' });
  // إن لم تكن هناك إدارات، اعرض رسالة واضحة
  if (!tree.children?.[0]?.children?.length){
    container.innerHTML = '<div class="small">لم يتم العثور على أعمدة قسم في البيانات. تأكد من وجود عمود باسم "القسم" أو "department".</div>';
    return;
  }
  container.innerHTML = renderNode(tree);

  function renderNode(node){
    const title = `${node.name}${node.role ? `<span class="org-role">— ${node.role}</span>`:''}`;
    const childrenHtml = (node.children||[]).map(renderNode).join('');
    if (childrenHtml){
      return `<div class="org-branch"><div class="org-node">${title}</div><div class="org-children">${childrenHtml}</div></div>`;
    }
    return `<div class="org-node">${title}</div>`;
  }
}

// تطبيع البيانات: حساب إجمالي البدلات وإجمالي الراتب
function normalizeData(){
  const rows = Array.isArray(state.rawRows) ? state.rawRows : [];
  if (!rows.length){ state.normalized = []; state.columns = []; return; }

  // كشف أسماء الأعمدة الشائعة بالعربية/الإنجليزية
  const cols = Object.keys(rows[0]);
  const nameKeys = ['name','الاسم'];
  const jobKeys = ['jobTitle','المسمى الوظيفي'];
  const deptKeys = ['department','القسم'];
  const natKeys  = ['nationality','الجنسية'];
  const genderKeys=['gender','الجنس'];
  const expKeys  = ['experienceYears','سنوات الخبرة','سنوات خبرة العمل'];
  const baseKeys = ['baseSalary','الراتب الأساسي','الراتب الاساسي','basicSalary'];
  const totalKeys= ['totalComp','الراتب الاجمالي','إجمالي الراتب','إجمالي التعويضات','totalSalary'];
  const idKeys   = ['employeeId','الرقم الوظيفي','رقم الموظف'];
  const joinDateKeys=['joinDate','تاريخ الانضمام','تاريخ الالتحاق'];
  const locationKeys=['location','الموقع','المدينة','الفرع'];
  const managerKeys=['manager','المدير المباشر','المدير'];
  
  const findKey = (cands)=> cands.find(k => cols.includes(k));
  const kName   = findKey(nameKeys)   || nameKeys[0];
  const kJob    = findKey(jobKeys)    || jobKeys[0];
  const kDept   = findKey(deptKeys)   || deptKeys[0];
  const kNat    = findKey(natKeys)    || natKeys[0];
  const kGender = findKey(genderKeys) || genderKeys[0];
  const kExp    = findKey(expKeys)    || expKeys[0];
  const kBase   = findKey(baseKeys)   || baseKeys[0];
  const kTotal  = findKey(totalKeys)  || null;

  // أعمدة البدلات: كل ما يبدأ بـ "بدل" أو allowance + قائمة عربية صريحة
  const allowanceArabic = ['بدل سكن','بدل مواصلات','بدل إعاشة','بدل اضافي ثابت','بدل طبيعة عمل','بدل ادارة','بدل محروقات','بدل اتصال','أخرى'];
  const allowanceCols = Array.from(new Set(
    utils.allowanceKeys(cols).concat(allowanceArabic).filter(c => cols.includes(c))
  )).filter(c => c !== kBase && c !== kTotal);
  state.allowanceCols = allowanceCols;

  state.normalized = rows.map(r => {
    const base = utils.toNumber(r[kBase]);
    const allowances = allowanceCols.map(c => utils.toNumber(r[c]));
    const allowanceSum = utils.sum(allowances);
    const totalFromCol = kTotal ? utils.toNumber(r[kTotal]) : 0;
    const total = totalFromCol > 0 ? totalFromCol : (base + allowanceSum);
    return {
      employeeId: r[findKey(idKeys)] ?? '',
      name: r[kName] ?? '',
      jobTitle: r[kJob] ?? '',
      department: r[kDept] ?? '',
      nationality: r[kNat] ?? '',
      gender: r[kGender] ?? '',
      joinDate: r[findKey(joinDateKeys)] ?? '',
      experienceYears: utils.toNumber(r[kExp]),
      location: r[findKey(locationKeys)] ?? '',
      manager: r[findKey(managerKeys)] ?? '',
      baseSalary: base,
      allowanceTotal: allowanceSum,
      totalComp: total,
      __orig: r,
    };
  });

  // احتفظ بأعمدة الملف الأصلية (للعرض الكامل)
  state.columns = cols;
}

// عرض الجداول والرسوم
function renderAll(){
  renderExecutiveSummary();
  renderEmployeesTable();
  renderByDepartment();
  renderByNationality();
  renderByGender();
  renderCharts();
  renderOrgChart();
  renderSalaryAllowanceAnalysis();
  renderRecommendations();
}

function renderExecutiveSummary(){
  if (!els.execSummary) return;
  const d = state.normalized;
  const totalEmployees = d.length;
  const avgBase = utils.mean(d.map(x=>x.baseSalary));
  const avgAllw = utils.mean(d.map(x=>x.allowanceTotal));
  const avgTotal = utils.mean(d.map(x=>x.totalComp));
  const minTotal = Math.min(...d.map(x=>x.totalComp));
  const maxTotal = Math.max(...d.map(x=>x.totalComp));

  els.execSummary.innerHTML = [
    {label:'عدد الموظفين', value: totalEmployees},
    {label:'متوسط الراتب الأساسي', value: utils.formatMoney(avgBase)},
    {label:'متوسط إجمالي البدلات', value: utils.formatMoney(avgAllw)},
    {label:'متوسط إجمالي الراتب', value: utils.formatMoney(avgTotal)},
    {label:'أدنى إجمالي راتب', value: utils.formatMoney(minTotal)},
    {label:'أعلى إجمالي راتب', value: utils.formatMoney(maxTotal)},
  ].map(s => `<div class="stat"><div class="label">${s.label}</div><div class="value">${s.value}</div></div>`).join('');
}

function renderEmployeesTable(){
  const t = els.tables.employees;
  if (!t) return;
  const origCols = Array.isArray(state.columns) ? state.columns.slice() : [];
  const allowanceSyn = ['إجمالي البدلات','allowanceTotal','Total Allowances'];
  const totalSyn = ['الراتب الاجمالي','إجمالي الراتب','totalSalary','totalComp'];
  const hasAllowanceTotal = origCols.some(c => allowanceSyn.includes(c));
  const hasTotal = origCols.some(c => totalSyn.includes(c));
  const finalCols = origCols.slice();
  if (!hasAllowanceTotal) finalCols.push('إجمالي البدلات');
  if (!hasTotal) finalCols.push('إجمالي الراتب');

  // تهيئة أدوات التحكم (قائمة الأعمدة + فلاتر مخصصة وترتيب متعدد)
  const filterDeptSel = document.getElementById('emp-filter-dept');
  const filterJobSel  = document.getElementById('emp-filter-job');

  // ملء قوائم القسم والمسمى الوظيفي من البيانات
  if (filterDeptSel){
    const depts = Array.from(new Set(state.normalized.map(r=> (r.department || (r.__orig||{})['القسم'] || 'غير محدد')))).sort((a,b)=> String(a).localeCompare(String(b),'ar'));
    filterDeptSel.innerHTML = `<option value="">كل الأقسام</option>` + depts.map(d=>`<option value="${d}">${d}</option>`).join('');
  }
  if (filterJobSel){
    const jobs = Array.from(new Set(state.normalized.map(r=> (r.jobTitle || (r.__orig||{})['المسمى الوظيفي'] || 'غير محدد')))).sort((a,b)=> String(a).localeCompare(String(b),'ar'));
    filterJobSel.innerHTML = `<option value="">كل المسميات</option>` + jobs.map(j=>`<option value="${j}">${j}</option>`).join('');
  }

  // حالة الترتيب عند النقر على الرؤوس (احتفاظ داخلي)
  let sortState = renderEmployeesTable._sort || { col: null, dir: 1 };

  // بناء رأس الجدول مع إمكانية الترتيب
  t.querySelector('thead').innerHTML = `<tr>${finalCols.map(c=>`<th data-col="${c}">${c} <span class="sort-ind"></span></th>`).join('')}</tr>`;

  // معالجات البحث/الفلترة/الترتيب
  const searchInput = document.getElementById('emp-search');
  const applyBtn = document.getElementById('emp-apply');
  const resetBtn = document.getElementById('emp-reset');
  const opSel = document.getElementById('emp-filter-op');
  const valInput = document.getElementById('emp-filter-val');

  function getFilteredData(){
    let rows = state.normalized.slice();

    // فلاتر سريعة: القسم + المسمى الوظيفي
    const deptSelVal = (filterDeptSel?.value || '').trim();
    const jobSelVal  = (filterJobSel?.value || '').trim();
    if (deptSelVal){ rows = rows.filter(r => (r.department || (r.__orig||{})['القسم'] || '').trim() === deptSelVal); }
    if (jobSelVal){ rows = rows.filter(r => (r.jobTitle || (r.__orig||{})['المسمى الوظيفي'] || '').trim() === jobSelVal); }

    // بحث شامل
    const q = (searchInput?.value || '').trim();
    if (q){
      const qLower = q.toLowerCase();
      rows = rows.filter(r => {
        const o = r.__orig || {};
        return finalCols.some(c => String(o[c] ?? r[c] ?? '').toLowerCase().includes(qLower));
      });
    }

    // فلتر متقدم حسب عمود
    // ترتيب بالنقر على الرؤوس فقط (إذا استُخدم)
    function compareByCol(a,b,col,dir){
      const oa = a.__orig || {}, ob = b.__orig || {};
      const va = oa[col] ?? a[col] ?? '';
      const vb = ob[col] ?? b[col] ?? '';
      const na = Number(String(va).replace(/[^\d.-]/g,''));
      const nb = Number(String(vb).replace(/[^\d.-]/g,''));
      const aIsNum = Number.isFinite(na), bIsNum = Number.isFinite(nb);
      if (aIsNum && bIsNum){
        const diff = na - nb; return diff === 0 ? 0 : diff * dir;
      }
      return String(va).localeCompare(String(vb), 'ar') * dir;
    }

    if (sortState.col){
      rows.sort((a,b) => compareByCol(a,b,sortState.col,sortState.dir));
    }

    return rows;
  }

  function renderBody(){
    const rows = getFilteredData();
    t.querySelector('tbody').innerHTML = rows.map(r => {
      const orig = r.__orig || {};
      return `<tr>${finalCols.map(c => {
        let val = orig[c];
        if (val == null || val === ''){
          if (allowanceSyn.includes(c) || c === 'إجمالي البدلات') val = utils.formatMoney(r.allowanceTotal);
          else if (totalSyn.includes(c) || c === 'إجمالي الراتب') val = utils.formatMoney(r.totalComp);
          else if (c === 'الاسم' && r.name) val = r.name;
          else if (c === 'المسمى الوظيفي' && r.jobTitle) val = r.jobTitle;
          else if (c === 'القسم' && r.department) val = r.department;
          else if (c === 'الجنسية' && r.nationality) val = r.nationality;
          else if (c === 'الجنس' && r.gender) val = r.gender;
          else if ((c === 'سنوات الخبرة' || c === 'سنوات خبرة العمل') && Number.isFinite(r.experienceYears)) val = r.experienceYears;
          else if ((c === 'الراتب الأساسي' || c === 'الراتب الاساسي') && Number.isFinite(r.baseSalary)) val = utils.formatMoney(r.baseSalary);
          else val = orig[c] ?? '';
        } else {
          if (['الراتب الأساسي','الراتب الاساسي'].includes(c)) val = utils.formatMoney(utils.toNumber(val));
          if (String(c).startsWith('بدل')) val = utils.formatMoney(utils.toNumber(val));
        }
        return `<td>${val ?? ''}</td>`;
      }).join('')}</tr>`;
    }).join('');
  }

  // ربط أحداث البحث والفلترة
  // إعادة ضبط مبسطة
  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (filterDeptSel) filterDeptSel.value = '';
    if (filterJobSel) filterJobSel.value = '';
    renderBody();
  });
  searchInput?.addEventListener('input', renderBody);
  filterDeptSel?.addEventListener('change', renderBody);
  filterJobSel?.addEventListener('change', renderBody);

  // ربط الترتيب بالنقر على الرأس
  t.querySelectorAll('thead th').forEach(th => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-col');
      if (sortState.col === col){ sortState.dir = -sortState.dir; }
      else { sortState.col = col; sortState.dir = 1; }
      renderEmployeesTable._sort = sortState;
      // تحديث مؤشر السهم البسيط
      t.querySelectorAll('thead th .sort-ind').forEach(s=> s.textContent='');
      th.querySelector('.sort-ind').textContent = sortState.dir > 0 ? '▲' : '▼';
      renderBody();
    });
  });

  // أول رسم
  renderBody();
}

function renderByDepartment(){
  const d = state.normalized;
  const m = utils.groupBy(d, x=>x.department || 'غير محدد');
  const rows = [...m.entries()].map(([dept, arr]) => {
    const avgBase = utils.mean(arr.map(x=>x.baseSalary));
    const avgAllw = utils.mean(arr.map(x=>x.allowanceTotal));
    const avgTot  = utils.mean(arr.map(x=>x.totalComp));
    return { dept, count: arr.length, avgBase, avgAllw, avgTot };
  }).sort((a,b)=> b.avgTot - a.avgTot);

  const table = els.tables.dept;
  if (!table) return;
  table.querySelector('tbody').innerHTML = rows.map(r => `
    <tr>
      <td>${r.dept}</td>
      <td>${r.count}</td>
      <td>${Number.isFinite(r.avgBase) ? r.avgBase.toFixed(2) : ''}</td>
      <td>${Number.isFinite(r.avgAllw) ? r.avgAllw.toFixed(2) : ''}</td>
      <td>${Number.isFinite(r.avgTot) ? r.avgTot.toFixed(2) : ''}</td>
    </tr>
  `).join('');
}

function renderByNationality(){
  const d = state.normalized;
  const m = utils.groupBy(d, x=>x.nationality || 'غير محدد');
  const rows = [...m.entries()].map(([nat, arr]) => {
    const avgTot  = utils.mean(arr.map(x=>x.totalComp));
    return { nat, count: arr.length, avgTot };
  }).sort((a,b)=> b.count - a.count);

  const table = els.tables.nat;
  if (!table) return;
  table.querySelector('tbody').innerHTML = rows.map(r => `
    <tr>
      <td>${r.nat}</td>
      <td>${r.count}</td>
      <td>${utils.formatMoney(r.avgTot)}</td>
    </tr>
  `).join('');
}

function renderByGender(){
  const d = state.normalized;
  const m = utils.groupBy(d, x=>x.gender || 'غير محدد');
  const rows = [...m.entries()].map(([g, arr]) => {
    const avgTot  = utils.mean(arr.map(x=>x.totalComp));
    return { g, count: arr.length, avgTot };
  }).sort((a,b)=> b.count - a.count);

  const table = els.tables.gender;
  if (!table) return;
  table.querySelector('tbody').innerHTML = rows.map(r => `
    <tr>
      <td>${r.g}</td>
      <td>${r.count}</td>
      <td>${utils.formatMoney(r.avgTot)}</td>
    </tr>
  `).join('');
}

function renderByExperience(){
  const d = state.normalized;
  const m = utils.groupBy(d, x=>utils.expBucket(x.experienceYears));
  const rows = [...m.entries()].map(([bucket, arr]) => {
    const avgBase = utils.mean(arr.map(x=>x.baseSalary));
    const avgAllw = utils.mean(arr.map(x=>x.allowanceTotal));
    const avgTot  = utils.mean(arr.map(x=>x.totalComp));
    const minTot  = Math.min(...arr.map(x=>x.totalComp));
    const maxTot  = Math.max(...arr.map(x=>x.totalComp));
    return { bucket, count: arr.length, avgBase, avgAllw, avgTot, minTot, maxTot };
  }).sort((a,b)=> a.bucket.localeCompare(b.bucket, 'ar'));

  els.tables.exp.querySelector('tbody').innerHTML = rows.map(r => `
    <tr>
      <td>${r.bucket}</td>
      <td>${r.count}</td>
      <td>${Number.isFinite(r.avgBase) ? r.avgBase.toFixed(2) : ''}</td>
      <td>${Number.isFinite(r.avgAllw) ? r.avgAllw.toFixed(2) : ''}</td>
      <td>${Number.isFinite(r.avgTot) ? r.avgTot.toFixed(2) : ''}</td>
      <td>${Number.isFinite(r.minTot) ? r.minTot.toFixed(2) : ''}</td>
      <td>${Number.isFinite(r.maxTot) ? r.maxTot.toFixed(2) : ''}</td>
    </tr>
  `).join('');
}

function renderCharts(){
  // تدمير الرسوم السابقة لتجنب التسريب
  Object.values(state.charts).forEach(ch => ch?.destroy?.());
  state.charts = {};
  const d = state.normalized;
  if (!d.length) return;

  // توزيع حسب الجنس
  {
    const ctx = document.getElementById('chartByGender');
    if (ctx){
      const m = utils.groupBy(d, x=>x.gender || 'غير محدد');
      const labels = [], values = [];
      m.forEach((arr, k)=>{ labels.push(k); values.push(arr.length); });
      state.charts.byGender = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: ['#22c55e','#ef4444','#64748b','#f59e0b'] }]},
        options: { responsive: true }
      });
    }
  }

  // أعلى 6 جنسيات
  {
    const ctx = document.getElementById('chartTopNat');
    if (ctx){
      const m = utils.groupBy(d, x=>x.nationality || 'غير محدد');
      const arr = [...m.entries()].map(([k, v])=>({k, c: v.length})).sort((a,b)=>b.c-a.c).slice(0,6);
      const labels = arr.map(x=>x.k), values = arr.map(x=>x.c);
      state.charts.topNat = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'عدد الموظفين', data: values, backgroundColor: '#22c55e' }]},
        options: { responsive: true, plugins: { legend: { display: false }}}
      });
    }
  }

  // الخبرة مقابل إجمالي الراتب (مبعثر)
  {
    const ctx = document.getElementById('chartExpVsSalary');
    if (ctx) {
      const points = d.map(x=>({ x: x.experienceYears, y: x.totalComp }));
      state.charts.expVsSalary = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: [{ label: 'الموظفون', data: points, backgroundColor: '#f59e0b' }]},
        options: { responsive: true, scales: { x: { title: { display: true, text: 'سنوات الخبرة'}}, y: { title: { display: true, text: 'إجمالي الراتب'}, ticks: { callback: v => utils.formatMoney(v) }}} }
      });
    }
  }
}

// تحليل خاص للرواتب والبدلات
function renderSalaryAllowanceAnalysis(){
  const d = state.normalized;
  const allowanceCols = state.allowanceCols || [];
  const section = document.getElementById('salary-allowance');
  if (!section) return;
  if (!d.length){ section.querySelector('.content').innerHTML = '<div class="small">لا توجد بيانات.</div>'; return; }

  // ملخصات عامة
  const totalBase = utils.sum(d.map(x=>x.baseSalary));
  const totalAllw = utils.sum(d.map(x=>x.allowanceTotal));
  const totalComp = utils.sum(d.map(x=>x.totalComp));

  // تفصيل البدلات حسب النوع (جمع عبر كل الأعمدة المكتشفة)
  const allowanceBreakdown = allowanceCols.map(col => ({ col, sum: utils.sum(d.map(x => utils.toNumber((x.__orig||{})[col]))) }))
                                         .filter(x=>x.sum>0)
                                         .sort((a,b)=> b.sum - a.sum);

  // جدول مختصر حسب القسم: مجموع الأساسي والبدلات والإجمالي
  const byDept = [...utils.groupBy(d, x=>x.department||'غير محدد').entries()].map(([dept, arr])=>({
    dept,
    base: utils.sum(arr.map(x=>x.baseSalary)),
    allw: utils.sum(arr.map(x=>x.allowanceTotal)),
    tot:  utils.sum(arr.map(x=>x.totalComp)),
  })).sort((a,b)=> b.tot - a.tot);

  // بناء HTML
  const cards = `
    <div class="metrics-grid">
      <div class="stat"><div class="label">إجمالي الرواتب الأساسية</div><div class="value">${utils.formatMoney(totalBase)}</div></div>
      <div class="stat"><div class="label">إجمالي البدلات</div><div class="value">${utils.formatMoney(totalAllw)}</div></div>
      <div class="stat"><div class="label">إجمالي التعويضات</div><div class="value">${utils.formatMoney(totalComp)}</div></div>
    </div>`;

  const breakdownTable = allowanceBreakdown.length ? `
    <div class="table-wrapper">
      <table>
        <thead><tr><th>نوع البدل</th><th>الإجمالي</th></tr></thead>
        <tbody>
          ${allowanceBreakdown.map(x=>`<tr><td>${x.col}</td><td>${utils.formatMoney(x.sum)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>` : '<div class="small">لم يتم العثور على أعمدة بدلات مفصلة في الملف.</div>';

  const byDeptTable = `
    <div class="table-wrapper">
      <table>
        <thead><tr><th>القسم</th><th>مجموع الأساسي</th><th>مجموع البدلات</th><th>مجموع الإجمالي</th><th>نسبة البدلات من الإجمالي</th></tr></thead>
        <tbody>
          ${byDept.map(r=>{
            const ratio = r.tot ? (r.allw/r.tot) : 0;
            return `<tr>
              <td>${r.dept}</td>
              <td>${utils.formatMoney(r.base)}</td>
              <td>${utils.formatMoney(r.allw)}</td>
              <td>${utils.formatMoney(r.tot)}</td>
              <td>${(ratio*100).toFixed(1)}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  // جدول تفصيلي بدلات حسب الجنسية
  const byNat = [...utils.groupBy(d, x=>x.nationality||'غير محدد').entries()];
  const natTable = (()=>{
    if (!byNat.length) return '<div class="small">لا توجد بيانات جنسيات.</div>';
    const allowCols = allowanceCols;
    const header = `<tr><th>الجنسية</th>${allowCols.map(c=>`<th>${c}</th>`).join('')}<th>إجمالي البدلات</th></tr>`;
    const rowsHtml = byNat.map(([nat, arr])=>{
      const sums = allowCols.map(col => utils.sum(arr.map(x=> utils.toNumber((x.__orig||{})[col]))));
      const total = utils.sum(sums);
      return `<tr><td>${nat}</td>${sums.map(v=>`<td>${utils.formatMoney(v)}</td>`).join('')}<td>${utils.formatMoney(total)}</td></tr>`;
    }).sort((a,b)=>{ // فرز تنازلياً حسب الإجمالي (استخراج الرقم من HTML بسيط)
      const getNum = tr => Number((tr.match(/<td>([\d,.]+)/g)||[]).pop()?.replace(/[^\d.-]/g,'')) || 0;
      return getNum(b) - getNum(a);
    }).join('');
    return `<div class="table-wrapper"><table><thead>${header}</thead><tbody>${rowsHtml}</tbody></table></div>`;
  })();

  section.querySelector('.content').innerHTML = cards + '<h3>تفصيل البدلات حسب النوع</h3>' + breakdownTable + '<h3>تكلفة الرواتب حسب القسم</h3>' + byDeptTable + '<h3>تفصيل البدلات حسب الجنسية</h3>' + natTable;

  // رسم بياني: توزيع البدلات حسب النوع
  const canvas1 = document.getElementById('chartAllowanceBreakdown');
  if (canvas1 && allowanceBreakdown.length){
    const labels = allowanceBreakdown.map(x=>x.col);
    const values = allowanceBreakdown.map(x=>x.sum);
    state.charts.allowanceBreakdown = new Chart(canvas1, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'إجمالي البدل', data: values, backgroundColor: '#a855f7' }]},
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => utils.formatMoney(v) }}} }
    });
  }

  // رسم بياني: نسبة البدلات من الإجمالي حسب القسم
  const canvas2 = document.getElementById('chartAllowanceRatioByDept');
  if (canvas2 && byDept.length){
    const labels = byDept.map(x=>x.dept);
    const values = byDept.map(x=> x.tot ? (x.allw/x.tot*100) : 0);
    state.charts.allowanceRatioByDept = new Chart(canvas2, {
      type: 'line',
      data: { labels, datasets: [{ label: 'نسبة البدلات %', data: values, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.2)' }]},
      options: { responsive: true, scales: { y: { ticks: { callback: v => `${v}%` }}} }
    });
  }

  // إجمالي البدلات حسب الجنسية (أعلى 10)
  const canvas3 = document.getElementById('chartAllowanceByNat');
  if (canvas3 && d.length){
    const mNat = utils.groupBy(d, x=>x.nationality || 'غير محدد');
    const natAgg = [...mNat.entries()].map(([nat, arr])=>({ nat, sum: utils.sum(arr.map(x=>x.allowanceTotal)) }))
                    .sort((a,b)=> b.sum - a.sum).slice(0,10);
    if (natAgg.length){
      state.charts.allowanceByNat = new Chart(canvas3, {
        type: 'bar',
        data: { labels: natAgg.map(x=>x.nat), datasets: [{ label: 'إجمالي البدلات', data: natAgg.map(x=>x.sum), backgroundColor: '#06b6d4' }]},
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => utils.formatMoney(v) }}} }
      });
    }
  }


}

// ألوان متدرجة للرسوم المتعددة
function chartColor(i){
  const palette = ['#1d4ed8','#9333ea','#16a34a','#ef4444','#f59e0b','#0ea5e9','#22c55e','#f97316','#a855f7','#06b6d4','#84cc16','#64748b'];
  return palette[i % palette.length];
}

function renderRecommendations(){
  const d = state.normalized;
  if (!d.length){ els.recList.innerHTML = ''; return; }

  const avgTot = utils.mean(d.map(x=>x.totalComp));
  const byDept = [...utils.groupBy(d, x=>x.department||'غير محدد').entries()].map(([dept, arr])=>({dept, avg: utils.mean(arr.map(x=>x.totalComp)), count: arr.length}));
  const lowDepts = byDept.filter(x=>x.avg < avgTot*0.8).slice(0,3);
  const highDepts= byDept.filter(x=>x.avg > avgTot*1.2).slice(0,3);

  const items = [];
  if (lowDepts.length){
    items.push(`- مراجعة هيكل الرواتب في الأقسام: ${lowDepts.map(x=>x.dept).join('، ')} للاقتراب من متوسط المنظمة.`);
  }
  if (highDepts.length){
    items.push(`- التحقق من منطقية بدلات الأقسام: ${highDepts.map(x=>x.dept).join('، ')} مقارنة بمتوسط المنظمة.`);
  }
  // فجوة الجنس
  const byGenderAvg = [...utils.groupBy(d, x=>x.gender||'غير محدد').entries()].map(([g, arr])=>({g, avg: utils.mean(arr.map(x=>x.totalComp))}));
  if (byGenderAvg.length >= 2){
    byGenderAvg.sort((a,b)=>b.avg-a.avg);
    const gap = Math.abs(byGenderAvg[0].avg - byGenderAvg[byGenderAvg.length-1].avg) / avgTot;
    if (gap > 0.1) items.push('- هناك فجوة ملحوظة في التعويضات بين الجنسين، يُوصى بإجراء مراجعة للإنصاف الداخلي.');
  }
  // الخبرة
  const corr = correlation(d.map(x=>x.experienceYears), d.map(x=>x.totalComp));
  if (corr < 0.1) items.push('- العلاقة بين الخبرة والدخل ضعيفة؛ يُراجع نظام الترقيات والحوافز.');
  else if (corr > 0.6) items.push('- توجد علاقة قوية بين الخبرة والدخل؛ يمكن تعزيز برامج الاحتفاظ بالمواهب خبرة.');

  els.recList.innerHTML = items.map(x=>`<li>${x}</li>`).join('');
}

// ارتباط بسيط (بيرسون)
function correlation(xs, ys){
  const n = Math.min(xs.length, ys.length);
  if (!n) return 0;
  const mx = utils.mean(xs), my = utils.mean(ys);
  let num=0, dx=0, dy=0;
  for (let i=0;i<n;i++){
    const a = xs[i]-mx, b = ys[i]-my;
    num += a*b; dx += a*a; dy += b*b;
  }
  return (dx && dy) ? (num / Math.sqrt(dx*dy)) : 0;
}

// مساعدة: تمرير مثال بيانات سريع (اختياري للمراجعة)
window.demoData = function(){
  const rows = [
    {name:'Ahmed Ali', jobTitle:'Developer', department:'IT', nationality:'EG', gender:'M', experienceYears:4, baseSalary:8000, allowanceHousing:1500, allowanceTransport:600},
    {name:'Sara Noor', jobTitle:'HR Specialist', department:'HR', nationality:'SA', gender:'F', experienceYears:6, baseSalary:9000, allowanceHousing:1200, allowanceTransport:500},
    {name:'Mohammed', jobTitle:'Accountant', department:'Finance', nationality:'EG', gender:'M', experienceYears:2, baseSalary:7000, allowanceHousing:1000, allowanceTransport:400},
    {name:'Huda', jobTitle:'QA Engineer', department:'IT', nationality:'SA', gender:'F', experienceYears:5, baseSalary:9500, allowanceHousing:1500, allowanceTransport:700},
    {name:'Omar', jobTitle:'Sales Rep', department:'Sales', nationality:'JO', gender:'M', experienceYears:8, baseSalary:11000, allowanceHousing:2000, allowanceTransport:900}
  ];
  state.rawRows = rows; normalizeData(); renderAll();
};

// تحسين إمكانية الوصول للمساحة القابلة للإفلات بالكيبورد
els.dropZone.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter' || e.key === ' '){
    els.fileInput.click();
  }
});