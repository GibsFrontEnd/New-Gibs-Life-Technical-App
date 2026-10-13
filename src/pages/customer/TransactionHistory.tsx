// pages/customer/TransactionHistory.tsx
// @ts-nocheck

import { ArrowUpRight, ArrowDownLeft, Calendar, Loader2, AlertCircle, Search, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { SERVER_URL } from '../../utils/constants';

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'credit' | 'debit';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  source?: 'party' | 'insured';
  partyCode?: string;
  insuredCode?: string;
}

interface ApiResponse {
  success: boolean;
  data?: any[];
  message?: string;
  error?: string;
}

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'party' | 'insured'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // New state for frontend filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

 const storedUser = useMemo(() => 
  JSON.parse(localStorage.getItem("unEncryptedUser") || "{}"), 
[]);

console.log("customer object:", storedUser?.customer);
console.log("partyCode:", storedUser?.customer?.partyCode);
console.log("insuredCode:", storedUser?.customer?.insuredCode);

const insuredCode = storedUser?.customer?.insuredID; 

  const fetchTransactions = async (pageNum = 1, append = false) => {
  try {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    setError(null);

    // Create an array of fetch promises based on filter
    const fetchPromises = [];

    if (filter === 'all' || filter === 'insured') {
      if (insuredCode) {
        // Encode the insuredCode (SA/017675 -> SA%2F017675)
        const encodedInsuredCode = encodeURIComponent(insuredCode);
        fetchPromises.push(
          fetch(`${SERVER_URL}/Payment/by-insuredcode?insuredCode=${encodedInsuredCode}`)
            .then(res => res.json())
            .then(data => ({ source: 'insured', data }))
            .catch(err => ({ source: 'insured', error: err.message }))
        );
      }
    }

    const results = await Promise.all(fetchPromises);

    // Process and combine transactions
    let allTransactions: Transaction[] = [];

    results.forEach(result => {
      if (result.error) {
        console.error(`Error fetching ${result.source} transactions:`, result.error);
        return;
      }

      // Check if the response has the expected structure
      if (result.data && result.data.success && Array.isArray(result.data.data)) {
        // Filter only payment transactions (you may need to adjust this logic)
       const paymentTransactions = result.data.data;
        
        const sourceTransactions = paymentTransactions.map((item: any) => 
          mapApiResponseToTransaction(item, result.source as 'party' | 'insured')
        );
        allTransactions = [...allTransactions, ...sourceTransactions];
      }
    });

    // Sort by date (most recent first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Implement pagination
    const itemsPerPage = 10;
    const startIndex = (pageNum - 1) * itemsPerPage;
    const paginatedTransactions = allTransactions.slice(0, startIndex + itemsPerPage);

    if (append) {
      setTransactions(prev => [...prev, ...paginatedTransactions.slice(prev.length)]);
    } else {
      setTransactions(paginatedTransactions);
    }

    setHasMore(paginatedTransactions.length < allTransactions.length);
    
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    console.error('Error fetching transactions:', err);
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
};

  // Update the mapping function to match your API structure
const mapApiResponseToTransaction = (apiData: any, source: 'party' | 'insured'): Transaction => {
  // Check if this is a payment record (you might need to identify payment-specific fields)
  const isPayment = apiData.receiptNo || apiData.chequeNo || apiData.transType === 'Payment';
  
  return {
    id: apiData.dncnid?.toString() || apiData.dncnNo || Math.random().toString(),
    date: apiData.submitOn || apiData.tDate || apiData.billingDate || new Date().toISOString(),
    description: `${apiData.insuredName || apiData.partyName || ''}`.trim(),
    // Determine if credit/debit based on transaction type
    type: apiData.transType?.toLowerCase().includes('credit') ? 'credit' : 'debit',
    amount: Math.abs(apiData.amount || apiData.paidAmount || 0),
    // Check if there are payment-specific fields
    status: apiData.transSTATUS?.toLowerCase() === 'approved' ? 'completed' 
      : apiData.approvedOn ? 'completed'
      : apiData.receiptNo ? 'completed'
      : apiData.amtPaid > 0 ? 'completed'
      : 'pending',
    reference: apiData.dncnNo || apiData.receiptNo || apiData.chequeNo || 'N/A',
    source,
    partyCode: apiData.partyCode,
    insuredCode: apiData.insuredid
  };
};

  useEffect(() => {
    fetchTransactions(1, false);
  }, [filter]);

  // Effect to apply frontend filters whenever transactions, searchTerm, or dateRange changes
  useEffect(() => {
    let filtered = [...transactions];
    
    // Apply search filter (searches in description/insured name and reference)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(term) ||
        t.reference.toLowerCase().includes(term) ||
        (t.insuredCode && t.insuredCode.toLowerCase().includes(term))
      );
    }
    
    // Apply date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.date).getTime() >= startDate);
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.date).getTime() <= endDate);
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, dateRange]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage, true);
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setPage(1);
    setTransactions([]);
    // Reset frontend filters when changing main filter
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const clearDateFilters = () => {
    setDateRange({ start: '', end: '' });
    setShowDateFilter(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'successful':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
      case 'declined':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'insured':
        return <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Insured</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Transaction History</h1>
        <p className="text-gray-600">View all your account transactions</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
            
            <div className="flex items-center space-x-4">
              {/* Filter Buttons */}
              <div className="flex items-center space-x-2 text-sm">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleFilterChange('insured')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    filter === 'insured'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Insured
                </button>
              </div>
            </div>
          </div>

          {/* Search and Date Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by insured name, reference, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Date Filter Toggle */}
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`px-4 py-2 border rounded-lg flex items-center space-x-2 transition-colors ${
                showDateFilter || dateRange.start || dateRange.end
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar size={18} />
              <span>Date</span>
              {(dateRange.start || dateRange.end) && (
                <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                  {dateRange.start && dateRange.end ? '2' : '1'}
                </span>
              )}
            </button>
          </div>

          {/* Date Range Filter Panel */}
          {showDateFilter && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Filter by Date Range</h3>
                {(dateRange.start || dateRange.end) && (
                  <button
                    onClick={clearDateFilters}
                    className="text-xs text-red-600 hover:text-red-700 flex items-center"
                  >
                    <X size={14} className="mr-1" />
                    Clear dates
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Filter Summary */}
          {(searchTerm || dateRange.start || dateRange.end) && (
            <div className="mt-3 text-sm text-gray-600">
              Found {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {transactions.length === 0 ? 'No transactions found' : 'No transactions match your filters'}
              </p>
              {(searchTerm || dateRange.start || dateRange.end) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDateRange({ start: '', end: '' });
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownLeft size={16} className="text-green-600" />
                          ) : (
                            <ArrowUpRight size={16} className="text-red-600" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {transaction.description}
                            </span>
                            {getSourceBadge(transaction.source)}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {transaction.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {transaction.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {hasMore && transactions.length > 0 && filteredTransactions.length === transactions.length && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </p>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default TransactionHistory;