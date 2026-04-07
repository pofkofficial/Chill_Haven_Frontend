import { useState, useEffect, useMemo } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Edit, Trash2, X, Calendar, Users, DollarSign, TrendingUp, Ticket } from 'lucide-react';
import { getEventAvailability } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const EventDetailModal = ({ event, isOpen, onClose, onEdit, onDelete }) => {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch availability - ALWAYS called
  useEffect(() => {
    if (!event || !isOpen) return;

    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const res = await getEventAvailability(event._id);
        setAvailability(res.data);
      } catch (err) {
        console.error('Failed to fetch availability:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [event, isOpen]);

  // ALL useMemo hooks MUST be called before any conditional returns
  // Get sold counts
  const singleEarlyBirdSold = availability?.single?.earlyBirdSold || 0;
  const singleRegularSold = (availability?.single?.sold || 0) - singleEarlyBirdSold;
  const singleTotalSold = availability?.single?.sold || 0;
  
  const doubleEarlyBirdSold = availability?.double?.earlyBirdSold || 0;
  const doubleRegularSold = (availability?.double?.sold || 0) - doubleEarlyBirdSold;
  const doubleTotalSold = availability?.double?.sold || 0;
  
  const isEarlyBirdPeriod = availability?.isEarlyBird || false;
  const hasDoubleTickets = event?.doubleTicketAvailable || false;
  
  // Calculate revenue correctly using actual prices
  const singleEarlyBirdRevenue = singleEarlyBirdSold * (availability?.single?.earlyBirdPrice || 0);
  const singleRegularRevenue = singleRegularSold * (availability?.single?.regularPrice || 0);
  const singleTotalRevenue = singleEarlyBirdRevenue + singleRegularRevenue;
  
  const doubleEarlyBirdRevenue = doubleEarlyBirdSold * (availability?.double?.earlyBirdPrice || 0);
  const doubleRegularRevenue = doubleRegularSold * (availability?.double?.regularPrice || 0);
  const doubleTotalRevenue = doubleEarlyBirdRevenue + doubleRegularRevenue;
  
  const totalRevenue = singleTotalRevenue + doubleTotalRevenue;
  const totalSold = singleTotalSold + doubleTotalSold;

  // Data for charts
  const ticketBreakdownData = useMemo(() => {
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    if (singleEarlyBirdSold > 0) {
      labels.push('Single Early Bird');
      data.push(singleEarlyBirdSold);
      backgroundColors.push('#f59e0b');
    }
    if (singleRegularSold > 0) {
      labels.push('Single Regular');
      data.push(singleRegularSold);
      backgroundColors.push('#ec4899');
    }
    if (hasDoubleTickets && doubleEarlyBirdSold > 0) {
      labels.push('Double Early Bird');
      data.push(doubleEarlyBirdSold);
      backgroundColors.push('#8b5cf6');
    }
    if (hasDoubleTickets && doubleRegularSold > 0) {
      labels.push('Double Regular');
      data.push(doubleRegularSold);
      backgroundColors.push('#a855f7');
    }
    
    if (data.length === 0) {
      labels.push('No Tickets Sold');
      data.push(1);
      backgroundColors.push('#4b5563');
    }
    
    return { labels, datasets: [{ data, backgroundColor: backgroundColors }] };
  }, [singleEarlyBirdSold, singleRegularSold, doubleEarlyBirdSold, doubleRegularSold, hasDoubleTickets]);

  const revenueBreakdownData = useMemo(() => {
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    if (singleEarlyBirdRevenue > 0) {
      labels.push('Single Early Bird');
      data.push(singleEarlyBirdRevenue);
      backgroundColors.push('#f59e0b');
    }
    if (singleRegularRevenue > 0) {
      labels.push('Single Regular');
      data.push(singleRegularRevenue);
      backgroundColors.push('#ec4899');
    }
    if (hasDoubleTickets && doubleEarlyBirdRevenue > 0) {
      labels.push('Double Early Bird');
      data.push(doubleEarlyBirdRevenue);
      backgroundColors.push('#8b5cf6');
    }
    if (hasDoubleTickets && doubleRegularRevenue > 0) {
      labels.push('Double Regular');
      data.push(doubleRegularRevenue);
      backgroundColors.push('#a855f7');
    }
    
    if (data.length === 0) {
      labels.push('No Revenue');
      data.push(1);
      backgroundColors.push('#4b5563');
    }
    
    return { 
      labels, 
      datasets: [{ 
        label: 'Revenue (₵)', 
        data, 
        backgroundColor: backgroundColors 
      }] 
    };
  }, [singleEarlyBirdRevenue, singleRegularRevenue, doubleEarlyBirdRevenue, doubleRegularRevenue, hasDoubleTickets]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        labels: { color: '#e5e7eb', font: { size: 10 } },
        position: 'bottom'
      },
      tooltip: {
        bodyFont: { size: 11 },
        titleFont: { size: 11 },
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            let value = context.raw || 0;
            if (context.dataset.label === 'Revenue (₵)') {
              return `${label}: ₵${value.toLocaleString()}`;
            }
            return `${label}: ${value} tickets`;
          }
        }
      }
    }
  }), []);

  // NOW conditional returns can happen (after all hooks)
  if (!isOpen || !event) return null;

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 border border-white/20 rounded-2xl md:rounded-3xl w-full max-w-5xl p-6 md:p-12 text-center mx-4">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-pink-500 mx-auto mb-4 md:mb-6"></div>
          <p className="text-lg md:text-xl text-white">Loading event details...</p>
          <p className="text-gray-400 text-sm md:text-base mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!availability) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-12 text-center mx-4">
          <p className="text-red-400 text-sm md:text-base">Failed to load event data</p>
          <button 
            onClick={onClose}
            className="mt-4 md:mt-6 px-6 md:px-8 py-2 md:py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm md:text-base"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/20 rounded-2xl md:rounded-3xl w-full max-w-5xl max-h-[95vh] md:max-h-[92vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-8 border-b border-white/10">
          <div className="flex-1">
            <h2 className="text-xl md:text-3xl font-bold text-white break-words">{event.title}</h2>
            <p className="text-pink-400 mt-1 flex items-center gap-2 text-sm md:text-base">
              <Calendar size={16} />
              {new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
              })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white ml-4">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Event Information */}
            <div className="lg:col-span-1 space-y-4 md:space-y-6">
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-pink-400">Event Information</h3>
                <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-5">
                  <div>
                    <p className="text-gray-400 text-xs md:text-sm">Venue</p>
                    <p className="text-white text-sm md:text-base">The G-HOUSE APARTMENT</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs md:text-sm">Time</p>
                    <p className="text-white text-sm md:text-base">8:00 PM - Till Morning</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs md:text-sm">Early Bird Ends</p>
                    <p className="text-white text-sm md:text-base">
                      {new Date(event.earlyBirdEnd).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs md:text-sm">Early Bird Status</p>
                    <p className={`font-semibold text-sm md:text-base ${isEarlyBirdPeriod ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {isEarlyBirdPeriod ? 'Active' : 'Ended'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs md:text-sm">Double Tickets</p>
                    <p className={`font-semibold text-sm md:text-base ${hasDoubleTickets ? 'text-green-400' : 'text-gray-400'}`}>
                      {hasDoubleTickets ? 'Available' : 'Not Available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/30 rounded-xl md:rounded-2xl p-4 md:p-6">
                <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Quick Stats</h4>
                <div className="space-y-2 md:space-y-3">
                  <div>
                    <p className="text-gray-400 text-xs md:text-sm">Total Tickets Sold</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">{totalSold}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs md:text-sm">Total Revenue</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-400">₵{totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-pink-400" /> Sales Analytics
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Tickets Sold by Type Chart */}
                  <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
                    <h4 className="font-medium mb-3 md:mb-4 text-center text-sm md:text-base">Tickets Sold by Type</h4>
                    <div className="h-48 md:h-64">
                      <Pie data={ticketBreakdownData} options={chartOptions} />
                    </div>
                    <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-400 space-y-1">
                      {singleEarlyBirdSold > 0 && (
                        <div className="flex justify-between">
                          <span><span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full mr-1 md:mr-2"></span>Single Early Bird</span>
                          <span>{singleEarlyBirdSold} tickets</span>
                        </div>
                      )}
                      {singleRegularSold > 0 && (
                        <div className="flex justify-between">
                          <span><span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-pink-500 rounded-full mr-1 md:mr-2"></span>Single Regular</span>
                          <span>{singleRegularSold} tickets</span>
                        </div>
                      )}
                      {hasDoubleTickets && doubleEarlyBirdSold > 0 && (
                        <div className="flex justify-between">
                          <span><span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-purple-600 rounded-full mr-1 md:mr-2"></span>Double Early Bird</span>
                          <span>{doubleEarlyBirdSold} tickets</span>
                        </div>
                      )}
                      {hasDoubleTickets && doubleRegularSold > 0 && (
                        <div className="flex justify-between">
                          <span><span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-purple-400 rounded-full mr-1 md:mr-2"></span>Double Regular</span>
                          <span>{doubleRegularSold} tickets</span>
                        </div>
                      )}
                      {totalSold === 0 && (
                        <div className="text-center text-gray-500">No tickets sold yet</div>
                      )}
                    </div>
                  </div>

                  {/* Revenue by Type Chart */}
                  <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
                    <h4 className="font-medium mb-3 md:mb-4 text-center text-sm md:text-base">Revenue by Ticket Type</h4>
                    <div className="h-48 md:h-64">
                      <Bar data={revenueBreakdownData} options={chartOptions} />
                    </div>
                    <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-400 space-y-1">
                      {singleEarlyBirdRevenue > 0 && (
                        <div className="flex justify-between">
                          <span><span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full mr-1 md:mr-2"></span>Single Early Bird</span>
                          <span>₵{singleEarlyBirdRevenue.toLocaleString()}</span>
                        </div>
                      )}
                      {singleRegularRevenue > 0 && (
                        <div className="flex justify-between">
                          <span><span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-pink-500 rounded-full mr-1 md:mr-2"></span>Single Regular</span>
                          <span>₵{singleRegularRevenue.toLocaleString()}</span>
                        </div>
                      )}
                      {hasDoubleTickets && doubleEarlyBirdRevenue > 0 && (
                        <div className="flex justify-between">
                          <span><span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-purple-600 rounded-full mr-1 md:mr-2"></span>Double Early Bird</span>
                          <span>₵{doubleEarlyBirdRevenue.toLocaleString()}</span>
                        </div>
                      )}
                      {hasDoubleTickets && doubleRegularRevenue > 0 && (
                        <div className="flex justify-between">
                          <span><span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-purple-400 rounded-full mr-1 md:mr-2"></span>Double Regular</span>
                          <span>₵{doubleRegularRevenue.toLocaleString()}</span>
                        </div>
                      )}
                      {totalRevenue === 0 && (
                        <div className="text-center text-gray-500">No revenue yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Ticket Breakdown */}
          <div className="mt-6 md:mt-10">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
              <Ticket size={18} className="text-pink-400" /> Ticket Sales Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Single Tickets Section */}
              <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
                <h4 className="text-lg md:text-xl font-bold text-pink-400 mb-3 md:mb-4">Single Tickets</h4>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center pb-2 md:pb-3 border-b border-white/10">
                    <div>
                      <p className="font-medium text-sm md:text-base">Early Bird Tickets</p>
                      <p className="text-xs md:text-sm text-gray-400">₵{availability?.single?.earlyBirdPrice || 0} each</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl md:text-2xl font-bold text-yellow-400">{singleEarlyBirdSold}</p>
                      <p className="text-xs md:text-sm text-gray-400">sold</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pb-2 md:pb-3 border-b border-white/10">
                    <div>
                      <p className="font-medium text-sm md:text-base">Regular Tickets</p>
                      <p className="text-xs md:text-sm text-gray-400">₵{availability?.single?.regularPrice || 0} each</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl md:text-2xl font-bold text-pink-400">{singleRegularSold}</p>
                      <p className="text-xs md:text-sm text-gray-400">sold</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <p className="font-semibold text-sm md:text-base">Total Single Tickets</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl md:text-2xl font-bold text-white">{singleTotalSold}</p>
                      <p className="text-xs md:text-sm text-green-400">₵{singleTotalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Double Tickets Section - Only show if available */}
              {hasDoubleTickets && (
                <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
                  <h4 className="text-lg md:text-xl font-bold text-purple-400 mb-3 md:mb-4">Double Tickets</h4>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center pb-2 md:pb-3 border-b border-white/10">
                      <div>
                        <p className="font-medium text-sm md:text-base">Early Bird Tickets</p>
                        <p className="text-xs md:text-sm text-gray-400">₵{availability?.double?.earlyBirdPrice || 0} each</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl md:text-2xl font-bold text-yellow-400">{doubleEarlyBirdSold}</p>
                        <p className="text-xs md:text-sm text-gray-400">sold</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pb-2 md:pb-3 border-b border-white/10">
                      <div>
                        <p className="font-medium text-sm md:text-base">Regular Tickets</p>
                        <p className="text-xs md:text-sm text-gray-400">₵{availability?.double?.regularPrice || 0} each</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl md:text-2xl font-bold text-purple-400">{doubleRegularSold}</p>
                        <p className="text-xs md:text-sm text-gray-400">sold</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <p className="font-semibold text-sm md:text-base">Total Double Tickets</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl md:text-2xl font-bold text-white">{doubleTotalSold}</p>
                        <p className="text-xs md:text-sm text-green-400">₵{doubleTotalRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-white/10 p-4 md:p-6 flex flex-col sm:flex-row gap-3 md:gap-4">
          <button
            onClick={() => onEdit(event)}
            className="flex-1 flex items-center justify-center gap-2 md:gap-3 bg-blue-600 hover:bg-blue-700 py-2 md:py-4 rounded-xl md:rounded-2xl font-medium transition text-sm md:text-base"
          >
            <Edit size={16} /> Edit Event
          </button>

          <button
            onClick={() => onDelete(event)}
            className="flex-1 flex items-center justify-center gap-2 md:gap-3 bg-red-600 hover:bg-red-700 py-2 md:py-4 rounded-xl md:rounded-2xl font-medium transition text-sm md:text-base"
          >
            <Trash2 size={16} /> Delete Event
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2 md:py-4 border border-white/30 hover:bg-white/10 rounded-xl md:rounded-2xl font-medium transition text-sm md:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;