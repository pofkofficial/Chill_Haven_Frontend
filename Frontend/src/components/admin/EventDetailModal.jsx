import { useState, useEffect, useMemo } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Edit, Trash2, X, Calendar, Users, DollarSign, TrendingUp, Ticket, UserCheck, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import { getEventAvailability, getEventParticipants, checkInParticipant } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const EventDetailModal = ({ event, isOpen, onClose, onEdit, onDelete }) => {
  const [availability, setAvailability] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [checkingIn, setCheckingIn] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'checked_in', 'not_checked_in'

  // Fetch availability and participants
  useEffect(() => {
    if (!event || !isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [availRes, participantsRes] = await Promise.all([
          getEventAvailability(event._id),
          getEventParticipants(event._id)
        ]);
        setAvailability(availRes.data);
        setParticipants(participantsRes.data.participants || []);
        setCheckedInCount(participantsRes.data.checkedInCount || 0);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh every second for real-time updates
    const interval = setInterval(async () => {
      if (isOpen && event) {
        try {
          const participantsRes = await getEventParticipants(event._id);
          setParticipants(participantsRes.data.participants || []);
          setCheckedInCount(participantsRes.data.checkedInCount || 0);
        } catch (err) {
          console.error('Failed to refresh participants:', err);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [event, isOpen]);

  const handleCheckIn = async (purchaseId, participantIndex) => {
    setCheckingIn(`${purchaseId}-${participantIndex}`);
    try {
      const res = await checkInParticipant(event._id, purchaseId, participantIndex);
      if (res.data.success) {
        // Update local state
        setParticipants(prevParticipants => 
          prevParticipants.map(p => {
            if (p.purchaseId === purchaseId) {
              const updatedParticipants = [...p.participants];
              updatedParticipants[participantIndex] = {
                ...updatedParticipants[participantIndex],
                checkedIn: true,
                checkedInAt: new Date().toISOString()
              };
              return { ...p, participants: updatedParticipants };
            }
            return p;
          })
        );
        setCheckedInCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to check in:', err);
      alert('Failed to check in participant. Please try again.');
    } finally {
      setCheckingIn(null);
    }
  };

  // Filter participants based on search query and status filter
  const filteredParticipants = useMemo(() => {
    if (!participants.length) return [];

    let filtered = [...participants];

    // Apply status filter
    if (filterStatus === 'checked_in') {
      filtered = filtered.filter(purchase => 
        purchase.participants.some(p => p.checkedIn)
      );
    } else if (filterStatus === 'not_checked_in') {
      filtered = filtered.filter(purchase => 
        purchase.participants.some(p => !p.checkedIn)
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(purchase =>
        purchase.participants.some(participant =>
          participant.name.toLowerCase().includes(query) ||
          participant.phone.includes(query)
        )
      );
    }

    return filtered;
  }, [participants, searchQuery, filterStatus]);

  const filteredCount = filteredParticipants.reduce((total, purchase) => 
    total + purchase.participants.length, 0
  );

  // Get sold counts
  const singleEarlyBirdSold = availability?.single?.earlyBirdSold || 0;
  const singleRegularSold = (availability?.single?.sold || 0) - singleEarlyBirdSold;
  const singleTotalSold = availability?.single?.sold || 0;
  
  const doubleEarlyBirdSold = availability?.double?.earlyBirdSold || 0;
  const doubleRegularSold = (availability?.double?.sold || 0) - doubleEarlyBirdSold;
  const doubleTotalSold = availability?.double?.sold || 0;
  
  const isEarlyBirdPeriod = availability?.isEarlyBird || false;
  const hasDoubleTickets = event?.doubleTicketAvailable || false;
  
  // Calculate revenue
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

  if (!availability) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-12 text-center mx-4">
          <p className="text-red-400 text-sm md:text-base">Failed to load event data</p>
          <button onClick={onClose} className="mt-4 md:mt-6 px-6 md:px-8 py-2 md:py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm md:text-base">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/20 rounded-2xl md:rounded-3xl w-full max-w-6xl max-h-[95vh] md:max-h-[92vh] overflow-hidden flex flex-col">
        
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

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-4 md:px-8">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 md:px-6 py-3 md:py-4 font-medium transition-all flex items-center gap-2 ${
              activeTab === 'analytics' 
                ? 'text-pink-400 border-b-2 border-pink-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp size={18} /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-4 md:px-6 py-3 md:py-4 font-medium transition-all flex items-center gap-2 ${
              activeTab === 'participants' 
                ? 'text-pink-400 border-b-2 border-pink-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users size={18} /> Participants ({participants.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'analytics' ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Event Information */}
                <div className="lg:col-span-1 space-y-4 md:space-y-6">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-pink-400">Event Information</h3>
                    <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-5">
                      <div><p className="text-gray-400 text-xs md:text-sm">Venue</p><p className="text-white text-sm md:text-base">{event.venue || 'The G-HOUSE APARTMENT'}</p></div>
                      <div><p className="text-gray-400 text-xs md:text-sm">Time</p><p className="text-white text-sm md:text-base">8:00 PM - Till Morning</p></div>
                      <div><p className="text-gray-400 text-xs md:text-sm">Early Bird Ends</p><p className="text-white text-sm md:text-base">{new Date(event.earlyBirdEnd).toLocaleString()}</p></div>
                      <div><p className="text-gray-400 text-xs md:text-sm">Early Bird Status</p><p className={`font-semibold text-sm md:text-base ${isEarlyBirdPeriod ? 'text-yellow-400' : 'text-gray-400'}`}>{isEarlyBirdPeriod ? 'Active' : 'Ended'}</p></div>
                      <div><p className="text-gray-400 text-xs md:text-sm">Double Tickets</p><p className={`font-semibold text-sm md:text-base ${hasDoubleTickets ? 'text-green-400' : 'text-gray-400'}`}>{hasDoubleTickets ? 'Available' : 'Not Available'}</p></div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/30 rounded-xl md:rounded-2xl p-4 md:p-6">
                    <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Quick Stats</h4>
                    <div className="space-y-2 md:space-y-3">
                      <div><p className="text-gray-400 text-xs md:text-sm">Total Tickets Sold</p><p className="text-2xl md:text-3xl font-bold text-white">{totalSold}</p></div>
                      <div><p className="text-gray-400 text-xs md:text-sm">Total Revenue</p><p className="text-2xl md:text-3xl font-bold text-green-400">₵{totalRevenue.toLocaleString()}</p></div>
                      <div><p className="text-gray-400 text-xs md:text-sm">Checked In</p><p className="text-2xl md:text-3xl font-bold text-blue-400">{checkedInCount} / {totalSold}</p></div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-pink-400" /> Sales Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <h4 className="font-medium mb-3 md:mb-4 text-center text-sm md:text-base">Tickets Sold by Type</h4>
                        <div className="h-48 md:h-64"><Pie data={ticketBreakdownData} options={chartOptions} /></div>
                      </div>
                      <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <h4 className="font-medium mb-3 md:mb-4 text-center text-sm md:text-base">Revenue by Ticket Type</h4>
                        <div className="h-48 md:h-64"><Bar data={revenueBreakdownData} options={chartOptions} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Ticket Breakdown */}
              <div className="mt-6 md:mt-10">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2"><Ticket size={18} className="text-pink-400" /> Ticket Sales Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
                    <h4 className="text-lg md:text-xl font-bold text-pink-400 mb-3 md:mb-4">Single Tickets</h4>
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex justify-between items-center pb-2 md:pb-3 border-b border-white/10">
                        <div><p className="font-medium text-sm md:text-base">Early Bird Tickets</p><p className="text-xs md:text-sm text-gray-400">₵{availability?.single?.earlyBirdPrice || 0} each</p></div>
                        <div className="text-right"><p className="text-xl md:text-2xl font-bold text-yellow-400">{singleEarlyBirdSold}</p><p className="text-xs md:text-sm text-gray-400">sold</p></div>
                      </div>
                      <div className="flex justify-between items-center pb-2 md:pb-3 border-b border-white/10">
                        <div><p className="font-medium text-sm md:text-base">Regular Tickets</p><p className="text-xs md:text-sm text-gray-400">₵{availability?.single?.regularPrice || 0} each</p></div>
                        <div className="text-right"><p className="text-xl md:text-2xl font-bold text-pink-400">{singleRegularSold}</p><p className="text-xs md:text-sm text-gray-400">sold</p></div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div><p className="font-semibold text-sm md:text-base">Total Single Tickets</p></div>
                        <div className="text-right"><p className="text-xl md:text-2xl font-bold text-white">{singleTotalSold}</p><p className="text-xs md:text-sm text-green-400">₵{singleTotalRevenue.toLocaleString()}</p></div>
                      </div>
                    </div>
                  </div>

                  {hasDoubleTickets && (
                    <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
                      <h4 className="text-lg md:text-xl font-bold text-purple-400 mb-3 md:mb-4">Double Tickets</h4>
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center pb-2 md:pb-3 border-b border-white/10">
                          <div><p className="font-medium text-sm md:text-base">Early Bird Tickets</p><p className="text-xs md:text-sm text-gray-400">₵{availability?.double?.earlyBirdPrice || 0} each</p></div>
                          <div className="text-right"><p className="text-xl md:text-2xl font-bold text-yellow-400">{doubleEarlyBirdSold}</p><p className="text-xs md:text-sm text-gray-400">sold</p></div>
                        </div>
                        <div className="flex justify-between items-center pb-2 md:pb-3 border-b border-white/10">
                          <div><p className="font-medium text-sm md:text-base">Regular Tickets</p><p className="text-xs md:text-sm text-gray-400">₵{availability?.double?.regularPrice || 0} each</p></div>
                          <div className="text-right"><p className="text-xl md:text-2xl font-bold text-purple-400">{doubleRegularSold}</p><p className="text-xs md:text-sm text-gray-400">sold</p></div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div><p className="font-semibold text-sm md:text-base">Total Double Tickets</p></div>
                          <div className="text-right"><p className="text-xl md:text-2xl font-bold text-white">{doubleTotalSold}</p><p className="text-xs md:text-sm text-green-400">₵{doubleTotalRevenue.toLocaleString()}</p></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Participants Tab with Search Bar */
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                  <UserCheck size={18} className="text-pink-400" /> 
                  All Participants ({filteredCount} / {participants.length})
                </h3>
                <div className="bg-green-500/20 px-3 md:px-4 py-1 md:py-2 rounded-full">
                  <span className="text-green-400 text-sm md:text-base font-semibold">
                    Checked In: {checkedInCount} / {totalSold}
                  </span>
                </div>
              </div>

              {/* Search Bar and Filters */}
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition text-sm md:text-base"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      filterStatus === 'all' 
                        ? 'bg-pink-600 text-white' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus('checked_in')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      filterStatus === 'checked_in' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Checked In
                  </button>
                  <button
                    onClick={() => setFilterStatus('not_checked_in')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      filterStatus === 'not_checked_in' 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Not Checked In
                  </button>
                </div>
              </div>

              {filteredParticipants.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'No participants match your search criteria.'
                    : 'No participants have registered for this event yet.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredParticipants.map((purchase, purchaseIdx) => (
                    <div key={purchase.purchaseId} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Ticket size={16} className="text-pink-400" />
                          <span className="text-sm font-medium text-pink-400">
                            {purchase.ticketType === 'single' ? 'Single Ticket' : 'Double Ticket'}
                          </span>
                          {purchase.isEarlyBird && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Early Bird</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Ref: {purchase.reference?.slice(-8)}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {purchase.participants.map((participant, idx) => {
                          // Check if this participant matches the search (for highlighting)
                          const matchesSearch = searchQuery ? (
                            participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            participant.phone.includes(searchQuery)
                          ) : true;
                          
                          if (!matchesSearch && filterStatus !== 'all') return null;
                          
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-sm md:text-base">
                                  {participant.name}
                                  {searchQuery && participant.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
                                    <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded">Match</span>
                                  )}
                                </p>
                                <p className="text-gray-400 text-xs md:text-sm">
                                  {participant.phone}
                                  {searchQuery && participant.phone.includes(searchQuery) && (
                                    <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded">Match</span>
                                  )}
                                </p>
                              </div>
                              {participant.checkedIn ? (
                                <div className="flex items-center gap-2 text-green-400">
                                  <CheckCircle size={18} />
                                  <span className="text-sm">Checked In</span>
                                  {participant.checkedInAt && (
                                    <span className="text-xs text-gray-500 ml-2 hidden md:inline">
                                      {new Date(participant.checkedInAt).toLocaleTimeString()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleCheckIn(purchase.purchaseId, idx)}
                                  disabled={checkingIn === `${purchase.purchaseId}-${idx}`}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
                                >
                                  {checkingIn === `${purchase.purchaseId}-${idx}` ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      Checking...
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck size={16} />
                                      Check In
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-white/10 p-4 md:p-6 flex flex-col sm:flex-row gap-3 md:gap-4">
          <button onClick={() => onEdit(event)} className="flex-1 flex items-center justify-center gap-2 md:gap-3 bg-blue-600 hover:bg-blue-700 py-2 md:py-4 rounded-xl md:rounded-2xl font-medium transition text-sm md:text-base"><Edit size={16} /> Edit Event</button>
          <button onClick={() => onDelete(event)} className="flex-1 flex items-center justify-center gap-2 md:gap-3 bg-red-600 hover:bg-red-700 py-2 md:py-4 rounded-xl md:rounded-2xl font-medium transition text-sm md:text-base"><Trash2 size={16} /> Delete Event</button>
          <button onClick={onClose} className="flex-1 py-2 md:py-4 border border-white/30 hover:bg-white/10 rounded-xl md:rounded-2xl font-medium transition text-sm md:text-base">Close</button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;