import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../contexts/AppContext';
import { usePortfolioContext } from '../../contexts/PortfolioContext';
import { supabase } from '../../services/supabase/config';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { VALIDATION_RULES } from '../../utils/constants';

const ACCEPTED_TYPES = ['.csv', '.xlsx', '.xls'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const HEADER_ALIASES = {
  symbol: ['symbol', 'ticker'],
  date: ['date', 'transaction date', 'trade date'],
  shares: ['shares', 'quantity', 'qty', 'units'],
  price: ['price', 'cost', 'rate', 'fill price']
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

const parseWorksheet = (worksheet) => {
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

const parseUploadFile = async (file) => {
  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = parseWorksheet(worksheet);
    return transformRows(rows);
  }

  if (extension === 'csv') {
    const text = await readFileAsText(file);
    const workbook = XLSX.read(text, { type: 'string' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = parseWorksheet(worksheet);
    return transformRows(rows);
  }

  throw new Error('Unsupported file type.');
};

const UploadCSV = ({ onUploadComplete }) => {
  const { currentUser } = useAuth();
  const { queueToast } = useApp();
  const { portfolio, reloadPortfolio, updatePortfolioMetrics } = usePortfolioContext();

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [error, setError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
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
        queueToast('You must be signed in to upload transactions.', 'error');
        return;
      }

      if (!validateFile(incomingFile)) return;

      setIsParsing(true);
      setError(null);
      setFile(incomingFile);

      try {
        const rows = await parseUploadFile(incomingFile);
        setParsedRows(rows);
        if (!rows.length) {
          setError('No valid rows found in the file.');
          queueToast('No valid rows found in the file.', 'warning');
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
    [currentUser, queueToast]
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
    if (!currentUser || !portfolio?.id) {
      queueToast('Portfolio not ready yet. Please try again.', 'error');
      return;
    }

    if (!validationSummary.validRows.length) {
      queueToast('No valid rows to import.', 'warning');
      return;
    }

    setIsImporting(true);
    try {
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

      resetState();
    } catch (err) {
      console.error('Import error', err);
      queueToast(err.message || 'Unable to import transactions.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <GlassCard variant="floating" padding="large" shadow="xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Import Portfolio Transactions</h3>
          <p className="text-white/70 text-sm">
            Upload a CSV or Excel file containing your trades. We&apos;ll validate each row,
            highlight any issues, and import the valid transactions directly into your Supabase-backed portfolio.
          </p>
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
              Supported: CSV, XLSX, XLS • Max 5MB • Required columns: symbol, date, shares, price
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

              <div className="overflow-x-auto border border-white/10 rounded-xl">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-white/10 text-white/70">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">#</th>
                      <th className="px-4 py-2 text-left font-medium">Symbol</th>
                      <th className="px-4 py-2 text-left font-medium">Date</th>
                      <th className="px-4 py-2 text-left font-medium">Shares</th>
                      <th className="px-4 py-2 text-left font-medium">Price</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parsedRows.slice(0, 25).map((row) => {
                      const hasErrors = Object.keys(row.errors).length > 0;
                      return (
                        <tr key={row.id} className={hasErrors ? 'bg-red-500/5' : 'bg-white/5'}>
                          <td className="px-4 py-2 text-white/70">{row.id}</td>
                          <td
                            className={`px-4 py-2 ${row.errors.symbol ? 'text-red-300' : 'text-white'}`}
                          >
                            {row.data.symbol || '—'}
                          </td>
                          <td
                            className={`px-4 py-2 ${row.errors.date ? 'text-red-300' : 'text-white'}`}
                          >
                            {row.data.date || '—'}
                          </td>
                          <td
                            className={`px-4 py-2 ${row.errors.shares ? 'text-red-300' : 'text-white'}`}
                          >
                            {Number.isFinite(row.data.shares) ? row.data.shares : '—'}
                          </td>
                          <td
                            className={`px-4 py-2 ${row.errors.price ? 'text-red-300' : 'text-white'}`}
                          >
                            {Number.isFinite(row.data.price) ? row.data.price : '—'}
                          </td>
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
                  Import {validationSummary.validRows.length || ''} Transactions
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

