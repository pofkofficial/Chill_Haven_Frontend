import { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Menu, X } from 'lucide-react';
import { getAllEvents, deleteEvent } from '../../services/api';
import EventDetailModal from './EventDetailModal';
import EditEventModal from './EditEventModal';

const ManageEvents = ({ onEventDeleted }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await getAllEvents();
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const handleDelete = async (eventId) => {
    try {
      await deleteEvent(eventId);
      await fetchEvents();
      if (onEventDeleted) onEventDeleted();
      setDeleteConfirm(null);
      setShowDetailModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleEditComplete = async () => {
    await fetchEvents();
    setShowEditModal(false);
    setEditingEvent(null);
    if (onEventDeleted) onEventDeleted();
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-white text-lg md:text-xl">
        Loading events...
      </div>
    );
  }

  return (
    <div>
      {/* Main Content */}
      <div className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-bold">Manage Events</h1>
          </div>

          {/* Events Table */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8">
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead>
                      <tr className="text-left text-pink-300 border-b border-white/10">
                        <th className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base">Title</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base hidden sm:table-cell">Date</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base hidden md:table-cell">Early Bird Ends</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base hidden lg:table-cell">Single Ticket</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base hidden xl:table-cell">Double Ticket</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base">Status</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 md:py-12 text-gray-400 text-sm md:text-base">
                            No events found. Create one using the button above.
                          </td>
                        </tr>
                      ) : (
                        events.map((event) => (
                          <tr 
                            key={event._id} 
                            className="hover:bg-white/5 transition cursor-pointer"
                            onClick={() => handleRowClick(event)}
                          >
                            <td className="px-4 md:px-6 py-3 md:py-5 font-medium text-sm md:text-base">
                              {event.title}
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-5 text-sm md:text-base hidden sm:table-cell">
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', year: 'numeric' 
                              })}
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-5 text-sm md:text-base hidden md:table-cell">
                              {new Date(event.earlyBirdEnd).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric' 
                              })}
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-5 text-sm md:text-base hidden lg:table-cell">
                              ₵{event.singleTicket?.regularPrice || 0}
                              <span className="text-xs text-gray-400 block">
                                ({event.singleTicket?.maxAvailable || 0} max)
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-5 text-sm md:text-base hidden xl:table-cell">
                              {event.doubleTicketAvailable ? 
                                `₵${event.doubleTicket?.regularPrice || 0}` : 
                                '—'}
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-5">
                              <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${
                                new Date(event.date) > new Date() 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-5" onClick={e => e.stopPropagation()}>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    handleEdit(event); 
                                  }}
                                  className="p-1.5 md:p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg text-blue-400 transition"
                                  title="Edit Event"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setDeleteConfirm(event); 
                                  }}
                                  className="p-1.5 md:p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 transition"
                                  title="Delete Event"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
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
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onEdit={handleEdit}
        onDelete={(event) => setDeleteConfirm(event)}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-zinc-900 border border-white/20 rounded-2xl md:rounded-3xl max-w-md w-full p-6 md:p-8 mx-4">
            <h3 className="text-xl md:text-2xl font-bold mb-4">Delete Event?</h3>
            <p className="text-gray-300 text-sm md:text-base mb-6">
              Are you sure you want to delete <strong className="text-pink-400">"{deleteConfirm.title}"</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 md:gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 md:py-3 border border-white/30 rounded-xl hover:bg-white/10 transition text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                className="flex-1 py-2 md:py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition text-sm md:text-base"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <EditEventModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingEvent(null);
          }}
          event={editingEvent}
          onEventUpdated={handleEditComplete}
        />
      )}
    </div>
  );
};

export default ManageEvents;