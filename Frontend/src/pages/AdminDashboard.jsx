import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

import { getAllEvents } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

import { LogOut, Plus, LayoutDashboard, Calendar, FileText, Settings, Menu, X } from 'lucide-react';

import CreateEventModal from '../components/admin/CreateEventModal';
import ManageEvents from '../components/admin/ManageEvents';
import SalesReport from '../components/admin/SalesReport';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [events, setEvents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [salesSummary, setSalesSummary] = useState({
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalEarlyBirdTickets: 0,
    totalRegularTickets: 0,
    eventStats: []
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const backend_link = import.meta.env.VITE_BACKEND_LINK || 'http://localhost:5000';

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Fetch both events and real sales summary
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, summaryRes] = await Promise.all([
          getAllEvents(),
          fetch(`${backend_link}/purchase/summary`).then(res => res.json())
        ]);

        setEvents(eventsRes.data || []);
        setSalesSummary(summaryRes || { 
          totalTicketsSold: 0, 
          totalRevenue: 0, 
          totalEarlyBirdTickets: 0,
          totalRegularTickets: 0,
          eventStats: [] 
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setSalesSummary({
          totalTicketsSold: 0,
          totalRevenue: 0,
          totalEarlyBirdTickets: 0,
          totalRegularTickets: 0,
          eventStats: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshEvents = async () => {
    try {
      const res = await getAllEvents();
      setEvents(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Real Bar Chart Data using salesSummary.eventStats
  const barData = useMemo(() => ({
    labels: (salesSummary.eventStats || []).map(stat => 
      stat.title.length > 15 ? stat.title.substring(0, 12) + '...' : stat.title
    ),
    datasets: [{
      label: 'Revenue (₵)',
      data: (salesSummary.eventStats || []).map(stat => stat.revenue || 0),
      backgroundColor: '#ec4899',
    }]
  }), [salesSummary]);

  // FIXED: Real Pie Chart Data using actual early bird vs regular tickets
  const pieData = useMemo(() => {
    const earlyBirdTickets = salesSummary.totalEarlyBirdTickets || 0;
    const regularTickets = salesSummary.totalRegularTickets || 0;
    
    if (earlyBirdTickets === 0 && regularTickets === 0) {
      return {
        labels: ['No Tickets Sold'],
        datasets: [{
          data: [1],
          backgroundColor: ['#4b5563'],
        }]
      };
    }
    
    return {
      labels: ['Early Bird Tickets', 'Regular Tickets'],
      datasets: [{
        data: [earlyBirdTickets, regularTickets],
        backgroundColor: ['#f59e0b', '#ec4899'],
      }]
    };
  }, [salesSummary]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        labels: { color: '#e5e7eb', font: { size: 10 } },
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            let value = context.raw || 0;
            let total = context.dataset.data.reduce((a, b) => a + b, 0);
            let percentage = Math.round((value / total) * 100);
            return `${label}: ${value} tickets (${percentage}%)`;
          }
        }
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

  const DashboardHome = () => (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <p className="text-pink-300 text-xs md:text-sm">Total Events</p>
          <p className="text-3xl md:text-5xl font-bold mt-2">{events.length}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <p className="text-pink-300 text-xs md:text-sm">Tickets Sold</p>
          <p className="text-3xl md:text-5xl font-bold mt-2 text-pink-400">
            {salesSummary.totalTicketsSold || 0}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <p className="text-pink-300 text-xs md:text-sm">Total Revenue</p>
          <p className="text-2xl md:text-5xl font-bold mt-2 text-green-400 break-words">
            ₵{(salesSummary.totalRevenue || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <p className="text-pink-300 text-xs md:text-sm">Upcoming Events</p>
          <p className="text-3xl md:text-5xl font-bold mt-2">
            {events.filter(e => new Date(e.date) > new Date()).length}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Revenue by Event</h2>
          <div className="h-[250px] md:h-[280px]">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Early Bird vs Regular Tickets</h2>
          <div className="h-[250px] md:h-[280px] flex items-center justify-center">
            <Pie data={pieData} options={chartOptions} />
          </div>
          <div className="mt-4 text-center text-xs md:text-sm text-gray-400">
            {salesSummary.totalEarlyBirdTickets > 0 && (
              <span className="inline-block mr-4">
                <span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full mr-1"></span>
                Early Bird: {salesSummary.totalEarlyBirdTickets}
              </span>
            )}
            {salesSummary.totalRegularTickets > 0 && (
              <span>
                <span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-pink-500 rounded-full mr-1"></span>
                Regular: {salesSummary.totalRegularTickets}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Events Table */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Recent Events</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="text-left text-pink-300 border-b border-white/10">
                <th className="py-3 md:py-4">Title</th>
                <th className="py-3 md:py-4 hidden sm:table-cell">Date</th>
                <th className="py-3 md:py-4 hidden md:table-cell">Single</th>
                <th className="py-3 md:py-4 hidden lg:table-cell">Double</th>
                <th className="py-3 md:py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 5).map(event => (
                <tr key={event._id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="py-3 md:py-5 font-medium text-sm md:text-base">{event.title}</td>
                  <td className="py-3 md:py-5 hidden sm:table-cell text-sm md:text-base">
                    {new Date(event.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 md:py-5 hidden md:table-cell">₵{event.singleTicket?.regularPrice || 0}</td>
                  <td className="py-3 md:py-5 hidden lg:table-cell">₵{event.doubleTicket?.regularPrice || '—'}</td>
                  <td className="py-3 md:py-5">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${
                      new Date(event.date) > new Date() ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/20 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Chill Haven Logo" 
            className="h-10 w-auto"
          />
          <h1 className="text-xl font-bold text-pink-400">Chill Haven</h1>
        </div>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-white/10 rounded-xl transition"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-black/95 backdrop-blur-xl border-r border-white/20 
        transition-transform duration-300 z-50 w-72
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-6 md:mb-12">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Chill Haven Logo" 
                className="h-12 md:h-20 w-auto"
              />
              <h1 className="text-2xl md:text-3xl font-bold text-pink-400 hidden sm:block">Chill Haven</h1>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition lg:hidden"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-2">
            <Link 
              to="/admin/dashboard" 
              className={`flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 rounded-2xl transition text-sm md:text-base ${
                location.pathname === '/admin/dashboard' || location.pathname === '/admin/dashboard/' 
                  ? 'bg-pink-600 font-medium' 
                  : 'hover:bg-white/10'
              }`}
            >
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link 
              to="/admin/dashboard/events" 
              className={`flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 rounded-2xl transition text-sm md:text-base ${
                location.pathname === '/admin/dashboard/events' 
                  ? 'bg-pink-600 font-medium' 
                  : 'hover:bg-white/10'
              }`}
            >
              <Calendar size={18} /> Manage Events
            </Link>
            <Link 
              to="/admin/dashboard/sales" 
              className={`flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 rounded-2xl transition text-sm md:text-base ${
                location.pathname === '/admin/dashboard/sales' 
                  ? 'bg-pink-600 font-medium' 
                  : 'hover:bg-white/10'
              }`}
            >
              <FileText size={18} /> Sales Report
            </Link>
          </nav>

          <div className="absolute bottom-4 md:bottom-8 left-4 md:left-6 right-4 md:right-6">
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-3 w-full px-4 md:px-6 py-3 md:py-4 text-red-400 hover:bg-white/10 rounded-2xl transition text-sm md:text-base"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
            <h1 className="text-2xl md:text-4xl font-bold">
              {location.pathname.includes('/events') ? '' : 
               location.pathname.includes('/sales') ? '' : 'Admin Dashboard'}
            </h1>

            {!location.pathname.includes('/sales') && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl transition text-sm md:text-base w-full sm:w-auto justify-center"
              >
                <Plus size={18} /> Create New Event
              </button>
            )}
          </div>

          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="events" element={<ManageEvents onEventDeleted={refreshEvents} />} />
            <Route path="sales" element={<SalesReport />} />
          </Routes>
        </div>
      </div>

      <CreateEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onEventCreated={refreshEvents} 
      />
    </div>
  );
};

export default AdminDashboard;