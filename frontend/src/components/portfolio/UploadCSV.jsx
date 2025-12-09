import React, { useState, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../contexts/AppContext';
import { usePortfolioContext } from '../../contexts/PortfolioContext';
import { supabase } from '../../services/supabase/config';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { VALIDATION_RULES } from '../../utils/constants';

// Lazy load xlsx only when needed
const loadXLSX = async () => {
  const xlsxModule = await import('xlsx');
  return xlsxModule.default || xlsxModule;
};

const ACCEPTED_TYPES = ['.csv', '.xlsx', '.xls'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const HEADER_ALIASES = {
  symbol: ['symbol', 'ticker'],
  date: ['date', 'transaction date', 'trade date'],
  shares: ['shares', 'quantity', 'qty', 'units'],
  price: ['price', 'cost', 'rate', 'fill price']
};

// Spending analysis header aliases
const SPENDING_HEADER_ALIASES = {
  date: ['date', 'transaction date', 'transaction_date'],
  amount: ['amount', 'value', 'total', 'sum'],
  category: ['category', 'type', 'description', 'merchant'],
  type: ['type', 'transaction type', 'transaction_type', 'flow']
};

const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }
};

const normalizeHeader = (headerRow = []) =>
  headerRow.map((cell) => String(cell || '').trim().toLowerCase());

const detectColumns = (headerRow = []) => {
  const normalized = normalizeHeader(headerRow);
  return Object.entries(HEADER_ALIASES).reduce((acc, [key, aliases]) => {
    acc[key] =
      normalized.findIndex((cell) =>
        aliases.some((alias) => cell.includes(alias))
      );
    return acc;
  }, {});
};

const detectSpendingColumns = (headerRow = []) => {
  const normalized = normalizeHeader(headerRow);
  return Object.entries(SPENDING_HEADER_ALIASES).reduce((acc, [key, aliases]) => {
    acc[key] =
      normalized.findIndex((cell) =>
        aliases.some((alias) => cell.includes(alias))
      );
    return acc;
  }, {});
};

const normalizeDate = (value) => {
  if (!value) return null;
  const stringValue = String(value).trim();

  // handle Excel numeric dates
  if (!Number.isNaN(Number(stringValue)) && Number(stringValue) > 40000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsedDate = new Date(excelEpoch.getTime() + Number(stringValue) * 86400000);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString().split('T')[0];
  }

  const formats = [
    'YYYY-MM-DD',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY/MM/DD',
    'M/D/YY',
    'D/M/YY'
  ];

  const date = new Date(stringValue);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // fallback manual parsing
  const parts = stringValue
    .replace(/-/g, '/')
    .split('/')
    .map((part) => part.padStart(2, '0'));

  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (Number(c) > 31) {
      return `${c.length === 2 ? `20${c}` : c}-${a}-${b}`;
    }
    if (Number(a) > 12) {
      return `${c.length === 2 ? `20${c}` : c}-${b}-${a}`;
    }
    return `${c.length === 2 ? `20${c}` : c}-${a}-${b}`;
  }

  return null;
};

const parseWorksheet = (worksheet, XLSX) => {
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rows.length) {
    throw new Error('The file is empty.');
  }
  return rows;
};

const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsArrayBuffer(file);
  });

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsText(file);
  });

const validateRow = (row) => {
  const errors = {};
  const symbolRegex = VALIDATION_RULES?.SYMBOL || /^[A-Z]{1,5}$/;

  if (!row.symbol || !symbolRegex.test(row.symbol)) {
    errors.symbol = 'Invalid or missing symbol';
  }

  if (!row.date) {
    errors.date = 'Invalid date';
  }

  if (!Number.isFinite(row.shares) || row.shares === 0) {
    errors.shares = 'Shares must be a non-zero number';
  }

  if (!Number.isFinite(row.price) || row.price <= 0) {
    errors.price = 'Price must be greater than zero';
  }

  return errors;
};

const validateSpendingRow = (row) => {
  const errors = {};

  if (!row.date) {
    errors.date = 'Invalid or missing date';
  }

  if (!Number.isFinite(row.amount) || row.amount === 0) {
    errors.amount = 'Amount must be a non-zero number';
  }

  if (!row.category || !String(row.category).trim()) {
    errors.category = 'Category is required';
  }

  return errors;
};

const transformRows = (tableRows) => {
  const header = tableRows[0];
  const dataRows = tableRows.slice(1);
  const columnMap = detectColumns(header);

  const missingColumns = Object.entries(columnMap)
    .filter(([, index]) => index === -1)
    .map(([key]) => key);

  if (missingColumns.length) {
    throw new Error(
      `Missing required columns: ${missingColumns
        .map((col) => col.toUpperCase())
        .join(', ')}`
    );
  }

  return dataRows
    .map((row, idx) => {
      if (!row || row.length === 0 || row.every((cell) => !String(cell).trim())) {
        return null;
      }

      const symbolRaw = row[columnMap.symbol];
      const dateRaw = row[columnMap.date];
      const sharesRaw = row[columnMap.shares];
      const priceRaw = row[columnMap.price];

      const parsedRow = {
        id: idx + 1,
        data: {
          symbol: String(symbolRaw || '').trim().toUpperCase(),
          date: normalizeDate(dateRaw),
          shares: Number(sharesRaw),
          price: Number(priceRaw)
        }
      };

      parsedRow.errors = validateRow(parsedRow.data);
      return parsedRow;
    })
    .filter(Boolean);
};

const transformSpendingRows = (tableRows) => {
  const header = tableRows[0];
  const dataRows = tableRows.slice(1);
  const columnMap = detectSpendingColumns(header);

  const missingColumns = Object.entries(columnMap)
    .filter(([, index]) => index === -1)
    .map(([key]) => key);

  if (missingColumns.length) {
    throw new Error(
      `Missing required columns: ${missingColumns
        .map((col) => col.toUpperCase())
        .join(', ')}`
    );
  }

  return dataRows
    .map((row, idx) => {
      if (!row || row.length === 0 || row.every((cell) => !String(cell).trim())) {
        return null;
      }

      const dateRaw = row[columnMap.date];
      const amountRaw = row[columnMap.amount];
      const categoryRaw = row[columnMap.category];
      const typeRaw = row[columnMap.type] || 'expense';

      const parsedRow = {
        id: idx + 1,
        data: {
          date: normalizeDate(dateRaw),
          amount: Number(amountRaw),
          category: String(categoryRaw || '').trim(),
          type: String(typeRaw || 'expense').trim().toLowerCase()
        }
      };

      parsedRow.errors = validateSpendingRow(parsedRow.data);
      return parsedRow;
    })
    .filter(Boolean);
};

// Calculate spending analysis from parsed rows
const calculateSpendingAnalysis = (validRows) => {
  if (!validRows || validRows.length === 0) {
    return null;
  }

  let totalIncome = 0;
  let totalExpenses = 0;
  const categories = {};

  // Group by month and calculate totals
  const monthlyData = {};

  validRows.forEach(({ data }) => {
    if (!data.date) return;

    const date = new Date(data.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = {
        income: 0,
        expenses: 0,
        categories: {}
      };
    }

    const amount = Math.abs(data.amount);
    const typeLower = String(data.type || 'expense').toLowerCase();
    // Income types: 'income', 'credit', 'deposit', 'salary', 'wage'
    // Expense types: 'expense', 'debit', 'payment', 'purchase', or anything else
    const isIncome = ['income', 'credit', 'deposit', 'salary', 'wage', 'revenue'].includes(typeLower);

    if (isIncome) {
      monthlyData[monthYear].income += amount;
      totalIncome += amount;
    } else {
      monthlyData[monthYear].expenses += amount;
      totalExpenses += amount;
      
      const category = data.category || 'Uncategorized';
      if (!monthlyData[monthYear].categories[category]) {
        monthlyData[monthYear].categories[category] = 0;
      }
      monthlyData[monthYear].categories[category] += amount;

      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += amount;
    }
  });

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  const discretionarySpending = Object.entries(categories)
    .filter(([cat]) => !['rent', 'mortgage', 'utilities', 'insurance', 'groceries'].includes(cat.toLowerCase()))
    .reduce((sum, [, amount]) => sum + amount, 0);
  const investmentCapacity = Math.max(0, netSavings * 0.7); // 70% of net savings

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate: Number(savingsRate.toFixed(2)),
    discretionarySpending: Number(discretionarySpending.toFixed(2)),
    investmentCapacity: Number(investmentCapacity.toFixed(2)),
    categories,
    monthlyData
  };
};

const parseUploadFile = async (file, mode = 'transactions') => {
  const extension = file.name.split('.').pop().toLowerCase();

  let rows;
  if (extension === 'xlsx' || extension === 'xls') {
    const XLSX = await loadXLSX();
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = parseWorksheet(worksheet, XLSX);
  } else if (extension === 'csv') {
    const XLSX = await loadXLSX();
    const text = await readFileAsText(file);
    const workbook = XLSX.read(text, { type: 'string' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = parseWorksheet(worksheet, XLSX);
  } else {
    throw new Error('Unsupported file type.');
  }

  // Transform based on mode
  if (mode === 'spending') {
    return transformSpendingRows(rows);
  } else {
    return transformRows(rows);
  }
};

const UploadCSV = ({ onUploadComplete, mode = 'transactions' }) => {
  const { currentUser } = useAuth();
  const { queueToast } = useApp();
  const { portfolio, reloadPortfolio, updatePortfolioMetrics } = usePortfolioContext();

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [error, setError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadMode, setUploadMode] = useState(mode); // 'transactions' or 'spending'
  const [spendingAnalysis, setSpendingAnalysis] = useState(null);
  const fileInputRef = useRef(null);

  const validationSummary = useMemo(() => {
    if (!parsedRows.length) {
      return {
        total: 0,
        valid: 0,
        invalid: 0,
        validRows: [],
        invalidRows: []
      };
    }

    const validRows = parsedRows.filter((row) => Object.keys(row.errors).length === 0);
    const invalidRows = parsedRows.filter((row) => Object.keys(row.errors).length > 0);

    return {
      total: parsedRows.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      validRows,
      invalidRows
    };
  }, [parsedRows]);

  const resetState = useCallback(() => {
    setFile(null);
    setParsedRows([]);
    setError(null);
    setIsParsing(false);
    setIsImporting(false);
    setSpendingAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const validateFile = (incomingFile) => {
    if (!incomingFile) return false;

    if (incomingFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 5MB limit.');
      queueToast('File size exceeds 5MB limit.', 'error');
      return false;
    }

    const extension = `.${incomingFile.name.split('.').pop().toLowerCase()}`;
    if (!ACCEPTED_TYPES.includes(extension)) {
      const message = `Unsupported file type. Please provide ${ACCEPTED_TYPES.join(', ')}.`;
      setError(message);
      queueToast(message, 'error');
      return false;
    }

    return true;
  };

  const handleFileSelection = useCallback(
    async (incomingFile) => {
      if (!currentUser) {
        queueToast('You must be signed in to upload files.', 'error');
        return;
      }

      if (!validateFile(incomingFile)) return;

      setIsParsing(true);
      setError(null);
      setFile(incomingFile);
      setSpendingAnalysis(null);

      try {
        const rows = await parseUploadFile(incomingFile, uploadMode);
        setParsedRows(rows);
        
        if (!rows.length) {
          setError('No valid rows found in the file.');
          queueToast('No valid rows found in the file.', 'warning');
        } else if (uploadMode === 'spending') {
          // Calculate spending analysis
          const validRows = rows.filter((row) => Object.keys(row.errors).length === 0);
          if (validRows.length > 0) {
            const analysis = calculateSpendingAnalysis(validRows);
            setSpendingAnalysis(analysis);
          }
        }
      } catch (err) {
        console.error('CSV parse error', err);
        const message = err.message || 'Unable to parse file. Please verify the template.';
        setError(message);
        setParsedRows([]);
        queueToast(message, 'error');
      } finally {
        setIsParsing(false);
      }
    },
    [currentUser, queueToast, uploadMode]
  );

  const handleFileInputChange = (event) => {
    const [incomingFile] = event.target.files || [];
    if (incomingFile) {
      handleFileSelection(incomingFile);
    }
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const [incomingFile] = event.dataTransfer.files || [];
    if (incomingFile) {
      handleFileSelection(incomingFile);
    }
  };

  const handleImport = async () => {
    if (!currentUser) {
      queueToast('You must be signed in to import data.', 'error');
      return;
    }

    if (!validationSummary.validRows.length) {
      queueToast('No valid rows to import.', 'warning');
      return;
    }

    setIsImporting(true);
    try {
      if (uploadMode === 'spending') {
        // Import spending analysis
        if (!spendingAnalysis) {
          throw new Error('Spending analysis not calculated. Please re-upload the file.');
        }

        // Get the most recent month from the data
        const monthYears = Object.keys(spendingAnalysis.monthlyData);
        if (monthYears.length === 0) {
          throw new Error('No valid monthly data found.');
        }

        // Process each month
        const insertPromises = monthYears.map(async (monthYear) => {
          const monthData = spendingAnalysis.monthlyData[monthYear];
          const netSavings = monthData.income - monthData.expenses;
          const savingsRate = monthData.income > 0 ? (netSavings / monthData.income) * 100 : 0;
          const discretionarySpending = Object.entries(monthData.categories)
            .filter(([cat]) => !['rent', 'mortgage', 'utilities', 'insurance', 'groceries'].includes(cat.toLowerCase()))
            .reduce((sum, [, amount]) => sum + amount, 0);
          const investmentCapacity = Math.max(0, netSavings * 0.7);

          const payload = {
            user_id: currentUser.id,
            month_year: monthYear,
            total_income: Number(monthData.income.toFixed(2)),
            total_expenses: Number(monthData.expenses.toFixed(2)),
            savings_rate: Number(savingsRate.toFixed(2)),
            discretionary_spending: Number(discretionarySpending.toFixed(2)),
            investment_capacity: Number(investmentCapacity.toFixed(2)),
            categories: monthData.categories
          };

          // Use upsert to handle updates
          const { error: upsertError } = await supabase
            .from('spending_analysis')
            .upsert(payload, { onConflict: 'user_id,month_year' });

          if (upsertError) {
            throw upsertError;
          }

          return payload;
        });

        const results = await Promise.all(insertPromises);

        queueToast(`Analyzed ${results.length} month(s) of spending data successfully.`, 'success');

        // Update user profile with latest investment capacity
        const latestMonth = monthYears.sort().pop();
        const latestData = spendingAnalysis.monthlyData[latestMonth];
        const latestInvestmentCapacity = Math.max(0, (latestData.income - latestData.expenses) * 0.7);

        await supabase
          .from('profiles')
          .update({
            monthly_income: latestData.income,
            investment_capacity: latestInvestmentCapacity,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        if (onUploadComplete) {
          onUploadComplete(results);
        }
      } else {
        // Import transactions (existing logic)
        if (!portfolio?.id) {
          queueToast('Portfolio not ready yet. Please try again.', 'error');
          return;
        }

        const payload = validationSummary.validRows.map(({ data }) => {
          const transactionType = data.shares >= 0 ? 'buy' : 'sell';
          const shares = Math.abs(data.shares);
          const price = Math.abs(data.price);

          return {
            user_id: currentUser.id,
            portfolio_id: portfolio.id,
            symbol: data.symbol,
            transaction_type: transactionType,
            shares,
            price,
            total_amount: Number((shares * price).toFixed(2)),
            fees: 0,
            transaction_date: data.date,
            notes: 'Imported via CSV uploader',
            metadata: {
              source: 'csv_upload',
              originalShares: data.shares,
              originalPrice: data.price
            }
          };
        });

        const { error: insertError } = await supabase.from('transactions').insert(payload);
        if (insertError) {
          throw insertError;
        }

        queueToast(`Imported ${payload.length} transactions successfully.`, 'success');

        await reloadPortfolio?.();
        await updatePortfolioMetrics?.({ notify: false, showLoader: false });

        if (onUploadComplete) {
          onUploadComplete(payload);
        }
      }

      resetState();
    } catch (err) {
      console.error('Import error', err);
      queueToast(err.message || `Unable to import ${uploadMode === 'spending' ? 'spending data' : 'transactions'}.`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <GlassCard variant="floating" padding="large" shadow="xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {uploadMode === 'spending' ? 'Upload Spending Analysis' : 'Import Portfolio Transactions'}
          </h3>
          <p className="text-white/70 text-sm mb-4">
            {uploadMode === 'spending' 
              ? 'Upload a CSV or Excel file containing your income and expenses. We\'ll analyze your spending patterns, calculate savings rate, and determine your investment capacity.'
              : 'Upload a CSV or Excel file containing your trades. We\'ll validate each row, highlight any issues, and import the valid transactions directly into your Supabase-backed portfolio.'}
          </p>
          
          {/* Mode Selector */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-white/70 text-sm">Upload Type:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setUploadMode('transactions');
                  resetState();
                }}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  uploadMode === 'transactions'
                    ? 'bg-blue-500/30 text-white border border-blue-400/30'
                    : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                }`}
              >
                Portfolio Transactions
              </button>
              <button
                onClick={() => {
                  setUploadMode('spending');
                  resetState();
                }}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  uploadMode === 'spending'
                    ? 'bg-blue-500/30 text-white border border-blue-400/30'
                    : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                }`}
              >
                Spending Analysis
              </button>
            </div>
          </div>
        </div>

        <div
          className={`
            border-2 border-dashed rounded-2xl p-8 transition-all duration-200
            ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-white/15 hover:border-white/30'}
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="text-4xl">📥</div>
            <div>
              <p className="text-white text-lg font-medium mb-2">
                Drag &amp; drop your file here
              </p>
              <p className="text-white/60 text-sm mb-4">
                Or click below to browse your computer
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />
              <GlassButton
                variant="primary"
                size="medium"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </GlassButton>
            </div>
            <p className="text-white/50 text-xs">
              Supported: CSV, XLSX, XLS • Max 5MB • 
              {uploadMode === 'spending' 
                ? ' Required columns: date, amount, category, type (income/expense)'
                : ' Required columns: symbol, date, shares, price'}
            </p>
          </div>
        </div>

        {(file || error) && (
          <motion.div
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{file?.name}</p>
                <p className="text-white/60 text-xs">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'No file selected'}
                </p>
              </div>
              <div className="flex space-x-2">
                {file && (
                  <GlassButton variant="ghost" size="small" onClick={resetState} disabled={isParsing || isImporting}>
                    Reset
                  </GlassButton>
                )}
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </p>
            )}
            {isParsing && (
              <p className="text-sm text-white/60">Parsing file…</p>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {parsedRows.length > 0 && (
            <motion.div
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-4"
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wide">Total Rows</p>
                    <p className="text-lg font-semibold text-white">{validationSummary.total}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wide">Ready to Import</p>
                    <p className="text-lg font-semibold text-emerald-300">{validationSummary.valid}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wide">Needs Attention</p>
                    <p className="text-lg font-semibold text-amber-300">{validationSummary.invalid}</p>
                  </div>
                </div>
              </div>

              {uploadMode === 'spending' && spendingAnalysis && (
                <motion.div
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 space-y-4"
                >
                  <h4 className="text-lg font-semibold text-white mb-4">Spending Analysis Preview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Total Income</p>
                      <p className="text-lg font-semibold text-green-300">${spendingAnalysis.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Total Expenses</p>
                      <p className="text-lg font-semibold text-red-300">${spendingAnalysis.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Savings Rate</p>
                      <p className="text-lg font-semibold text-blue-300">{spendingAnalysis.savingsRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Investment Capacity</p>
                      <p className="text-lg font-semibold text-purple-300">${spendingAnalysis.investmentCapacity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  {Object.keys(spendingAnalysis.categories).length > 0 && (
                    <div className="mt-4">
                      <p className="text-white/70 text-sm mb-2">Top Categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(spendingAnalysis.categories)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([category, amount]) => (
                            <span key={category} className="px-3 py-1 bg-white/10 rounded-lg text-white text-xs">
                              {category}: ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              <div className="overflow-x-auto border border-white/10 rounded-xl">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-white/10 text-white/70">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">#</th>
                      {uploadMode === 'spending' ? (
                        <>
                          <th className="px-4 py-2 text-left font-medium">Date</th>
                          <th className="px-4 py-2 text-left font-medium">Amount</th>
                          <th className="px-4 py-2 text-left font-medium">Category</th>
                          <th className="px-4 py-2 text-left font-medium">Type</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-2 text-left font-medium">Symbol</th>
                          <th className="px-4 py-2 text-left font-medium">Date</th>
                          <th className="px-4 py-2 text-left font-medium">Shares</th>
                          <th className="px-4 py-2 text-left font-medium">Price</th>
                        </>
                      )}
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parsedRows.slice(0, 25).map((row) => {
                      const hasErrors = Object.keys(row.errors).length > 0;
                      return (
                        <tr key={row.id} className={hasErrors ? 'bg-red-500/5' : 'bg-white/5'}>
                          <td className="px-4 py-2 text-white/70">{row.id}</td>
                          {uploadMode === 'spending' ? (
                            <>
                              <td className={`px-4 py-2 ${row.errors.date ? 'text-red-300' : 'text-white'}`}>
                                {row.data.date || '—'}
                              </td>
                              <td className={`px-4 py-2 ${row.errors.amount ? 'text-red-300' : 'text-white'}`}>
                                {Number.isFinite(row.data.amount) ? `$${row.data.amount.toFixed(2)}` : '—'}
                              </td>
                              <td className={`px-4 py-2 ${row.errors.category ? 'text-red-300' : 'text-white'}`}>
                                {row.data.category || '—'}
                              </td>
                              <td className="px-4 py-2 text-white/70">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  row.data.type === 'income' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                }`}>
                                  {row.data.type || 'expense'}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className={`px-4 py-2 ${row.errors.symbol ? 'text-red-300' : 'text-white'}`}>
                                {row.data.symbol || '—'}
                              </td>
                              <td className={`px-4 py-2 ${row.errors.date ? 'text-red-300' : 'text-white'}`}>
                                {row.data.date || '—'}
                              </td>
                              <td className={`px-4 py-2 ${row.errors.shares ? 'text-red-300' : 'text-white'}`}>
                                {Number.isFinite(row.data.shares) ? row.data.shares : '—'}
                              </td>
                              <td className={`px-4 py-2 ${row.errors.price ? 'text-red-300' : 'text-white'}`}>
                                {Number.isFinite(row.data.price) ? row.data.price : '—'}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-2 text-white/70">
                            {hasErrors ? (
                              <div className="space-y-1 text-xs text-red-300">
                                {Object.values(row.errors).map((message, idx) => (
                                  <div key={idx}>• {message}</div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-emerald-300">Ready</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {parsedRows.length > 25 && (
                  <p className="text-xs text-white/50 px-4 py-3">
                    Showing first 25 rows of {parsedRows.length}. Invalid rows must be fixed before importing.
                  </p>
                )}
              </div>

              {validationSummary.invalid > 0 && (
                <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  Fix highlighted rows in your source file and re-upload to include them in the import.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <GlassButton
                  variant="ghost"
                  size="medium"
                  onClick={resetState}
                  disabled={isParsing || isImporting}
                >
                  Choose Another File
                </GlassButton>
                <GlassButton
                  variant="primary"
                  size="medium"
                  onClick={handleImport}
                  disabled={
                    isParsing ||
                    isImporting ||
                    !validationSummary.validRows.length
                  }
                  loading={isImporting}
                >
                  {uploadMode === 'spending' 
                    ? `Analyze & Save ${validationSummary.validRows.length || ''} Transaction(s)`
                    : `Import ${validationSummary.validRows.length || ''} Transaction(s)`}
                </GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
};

export default UploadCSV;

