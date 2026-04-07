import { useState, useEffect, useMemo } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Download, TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const SalesReport = () => {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const summaryRes = await fetch('http://localhost:5000/api/purchase/summary').then(res => res.json());
        setSalesData(summaryRes);
      } catch (err) {
        console.error('Failed to fetch sales data:', err);
        setError('Failed to load sales report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  const revenueByEvent = useMemo(() => ({
    labels: (salesData?.eventStats || []).map(stat => 
      stat.title.length > 15 ? stat.title.substring(0, 12) + '...' : stat.title
    ),
    datasets: [{
      label: 'Revenue (₵)',
      data: (salesData?.eventStats || []).map(stat => stat.revenue || 0),
      backgroundColor: '#ec4899',
    }]
  }), [salesData]);

  const ticketsByEvent = useMemo(() => ({
    labels: (salesData?.eventStats || []).map(stat => 
      stat.title.length > 15 ? stat.title.substring(0, 12) + '...' : stat.title
    ),
    datasets: [{
      label: 'Tickets Sold',
      data: (salesData?.eventStats || []).map(stat => stat.ticketsSold || 0),
      backgroundColor: '#a855f7',
    }]
  }), [salesData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        labels: { color: '#e5e7eb', font: { size: 10 } },
        position: 'bottom'
      },
      tooltip: {
        bodyFont: { size: 12 },
        titleFont: { size: 12 }
      }
    },
    scales: {
      y: { 
        grid: { color: 'rgba(255,255,255,0.1)' }, 
        ticks: { color: '#9ca3af', font: { size: 10 } } 
      },
      x: { 
        grid: { color: 'rgba(255,255,255,0.1)' }, 
        ticks: { color: '#9ca3af', font: { size: 10 } } 
      }
    }
  };

  const handleExport = () => {
    if (!salesData) return;
    
    const csvData = [
      ['Event Title', 'Tickets Sold', 'Revenue (₵)'],
      ...(salesData.eventStats || []).map(stat => [stat.title, stat.ticketsSold, stat.revenue])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-20 text-white text-lg md:text-xl">Loading sales report...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-400">{error}</div>;
  }

  const totalRevenue = salesData?.totalRevenue || 0;
  const totalTicketsSold = salesData?.totalTicketsSold || 0;

  return (
    <div>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold">Sales Report</h1>
          <p className="text-gray-400 text-sm md:text-base mt-1">Real-time overview of all ticket sales</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl transition text-sm md:text-base w-full sm:w-auto justify-center"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8">
          <p className="text-gray-400 text-xs md:text-sm">Total Revenue</p>
          <p className="text-3xl md:text-5xl font-bold text-green-400 mt-2 md:mt-3 break-words">
            ₵{totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8">
          <p className="text-gray-400 text-xs md:text-sm">Total Tickets Sold</p>
          <p className="text-3xl md:text-5xl font-bold text-pink-400 mt-2 md:mt-3">
            {totalTicketsSold}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8">
          <p className="text-gray-400 text-xs md:text-sm">Events with Sales</p>
          <p className="text-3xl md:text-5xl font-bold text-purple-400 mt-2 md:mt-3">
            {salesData?.totalEventsWithSales || 0}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8">
          <h3 className="text-base md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-pink-400" /> Revenue by Event
          </h3>
          <div className="h-[250px] md:h-80">
            <Bar data={revenueByEvent} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8">
          <h3 className="text-base md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-400" /> Tickets Sold by Event
          </h3>
          <div className="h-[250px] md:h-80">
            <Bar data={ticketsByEvent} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Events Breakdown Table */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8">
        <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Events Breakdown</h3>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr className="text-left text-pink-300 border-b border-white/10">
                    <th className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base">Event Title</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-center text-sm md:text-base">Tickets Sold</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-right text-sm md:text-base">Revenue (₵)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(salesData?.eventStats || []).length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-8 md:py-12 text-gray-400 text-sm md:text-base">
                        No sales data available yet.
                      </td>
                    </tr>
                  ) : (
                    (salesData?.eventStats || []).map((stat, index) => (
                      <tr key={index} className="hover:bg-white/5 transition">
                        <td className="px-4 md:px-6 py-3 md:py-5 font-medium text-sm md:text-base">
                          {stat.title}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-5 text-center font-bold text-pink-400 text-sm md:text-base">
                          {stat.ticketsSold}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-5 text-right font-medium text-green-400 text-sm md:text-base">
                          ₵{stat.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;