import React, { useState } from 'react';
import { usePortfolio } from '../../hooks/usePortfolio';

const AddHolding = () => {
  const [formData, setFormData] = useState({
    symbol: '',
    shares: '',
    purchasePrice: '',
    purchaseDate: ''
  });
  const { addHoldingToPortfolio, loading } = usePortfolio();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.symbol || !formData.shares || !formData.purchasePrice) return;
    const payload = {
      symbol: formData.symbol.toUpperCase().trim(),
      companyName: formData.companyName || '',
      shares: Number(formData.shares),
      purchasePrice: Number(formData.purchasePrice),
      purchaseDate: formData.purchaseDate || new Date().toISOString().slice(0, 10),
      sector: formData.sector || '',
      assetType: formData.assetType || 'Stock'
    };
    try {
      await addHoldingToPortfolio(payload);
      setFormData({ symbol: '', shares: '', purchasePrice: '', purchaseDate: '' });
    } catch (err) {
      console.error('Failed to add holding', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Holding</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
          <input
            type="text"
            value={formData.symbol}
            onChange={(e) => setFormData({...formData, symbol: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., AAPL"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shares</label>
          <input
            type="number"
            value={formData.shares}
            onChange={(e) => setFormData({...formData, shares: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Number of shares"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Price per share"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
          <input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Adding…' : 'Add Holding'}
        </button>
      </form>
    </div>
  );
};

export default AddHolding;
