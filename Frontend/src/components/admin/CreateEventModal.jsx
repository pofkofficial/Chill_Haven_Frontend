import { useState } from 'react';
import { createEvent } from '../../services/api';
import { X } from 'lucide-react';

const CreateEventModal = ({ isOpen, onClose, onEventCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    earlyBirdEnd: '',
    doubleTicketAvailable: false,
    singleTicket: { 
      earlyBirdPrice: '', 
      regularPrice: '', 
      maxAvailable: 100 
    },
    doubleTicket: { 
      earlyBirdPrice: '', 
      regularPrice: '', 
      maxAvailable: 50 
    }
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleTicketChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: Number(value) || 0 }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const eventData = {
      ...formData,
      doubleTicket: formData.doubleTicketAvailable ? formData.doubleTicket : null
    };

    try {
      await createEvent(eventData);
      alert('Event created successfully!');
      onEventCreated();
      onClose();

      setFormData({
        title: '',
        description: '',
        date: '',
        earlyBirdEnd: '',
        doubleTicketAvailable: false,
        singleTicket: { earlyBirdPrice: '', regularPrice: '', maxAvailable: 100 },
        doubleTicket: { earlyBirdPrice: '', regularPrice: '', maxAvailable: 50 }
      });
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to create event');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/20 rounded-2xl md:rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-8 border-b border-white/10">
          <h2 className="text-xl md:text-3xl font-bold text-pink-400">Create New Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            
            {/* Event Title */}
            <div>
              <label className="block text-xs md:text-sm text-gray-300 mb-1 md:mb-2">Event Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 md:p-4 bg-zinc-800 border border-white/20 rounded-xl md:rounded-2xl text-white focus:outline-none focus:border-pink-500 text-sm md:text-base"
                placeholder="Chill Haven House Party Edition 5.0"
                required
              />
            </div>

            {/* Event Description */}
            <div>
              <label className="block text-xs md:text-sm text-gray-300 mb-1 md:mb-2">Event Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full p-3 md:p-4 bg-zinc-800 border border-white/20 rounded-xl md:rounded-2xl text-white focus:outline-none focus:border-pink-500 resize-y text-sm md:text-base"
                placeholder="Describe the event, theme, special guests, what attendees should expect..."
                required
              />
            </div>

            {/* Date & Early Bird */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-xs md:text-sm text-gray-300 mb-1 md:mb-2">Event Date & Time</label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full p-3 md:p-4 bg-zinc-800 border border-white/20 rounded-xl md:rounded-2xl text-white text-sm md:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-gray-300 mb-1 md:mb-2">Early Bird Ends</label>
                <input
                  type="datetime-local"
                  name="earlyBirdEnd"
                  value={formData.earlyBirdEnd}
                  onChange={handleChange}
                  className="w-full p-3 md:p-4 bg-zinc-800 border border-white/20 rounded-xl md:rounded-2xl text-white text-sm md:text-base"
                  required
                />
              </div>
            </div>

            {/* Single Ticket Section */}
            <div className="bg-zinc-800/50 p-4 md:p-6 rounded-xl md:rounded-2xl">
              <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-pink-300">Single Ticket</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="text-xs text-gray-400">Early Bird Price (₵)</label>
                  <input 
                    type="number" 
                    placeholder="200"
                    value={formData.singleTicket.earlyBirdPrice}
                    onChange={(e) => handleTicketChange('singleTicket', 'earlyBirdPrice', e.target.value)} 
                    className="w-full p-2 md:p-3 bg-black rounded-lg mt-1 text-sm md:text-base" 
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Regular Price (₵)</label>
                  <input 
                    type="number" 
                    placeholder="250"
                    value={formData.singleTicket.regularPrice}
                    onChange={(e) => handleTicketChange('singleTicket', 'regularPrice', e.target.value)} 
                    className="w-full p-2 md:p-3 bg-black rounded-lg mt-1 text-sm md:text-base" 
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Max Available</label>
                  <input 
                    type="number" 
                    value={formData.singleTicket.maxAvailable}
                    onChange={(e) => handleTicketChange('singleTicket', 'maxAvailable', e.target.value)} 
                    className="w-full p-2 md:p-3 bg-black rounded-lg mt-1 text-sm md:text-base" 
                    required
                  />
                </div>
              </div>
            </div>

            {/* Double Ticket Toggle */}
            <div className="bg-zinc-800/50 p-4 md:p-6 rounded-xl md:rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 md:mb-4">
                <h3 className="font-bold text-base md:text-lg text-pink-300">Double Ticket</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-xs md:text-sm text-gray-300">
                    {formData.doubleTicketAvailable ? 'Available' : 'Not Available'}
                  </span>
                  <input
                    type="checkbox"
                    name="doubleTicketAvailable"
                    checked={formData.doubleTicketAvailable}
                    onChange={handleChange}
                    className="w-4 h-4 md:w-5 md:h-5 rounded border-white/20 bg-zinc-800 text-pink-600 focus:ring-pink-500 focus:ring-offset-0"
                  />
                </label>
              </div>

              {formData.doubleTicketAvailable && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-4">
                  <div>
                    <label className="text-xs text-gray-400">Early Bird Price (₵)</label>
                    <input 
                      type="number" 
                      placeholder="350"
                      value={formData.doubleTicket.earlyBirdPrice}
                      onChange={(e) => handleTicketChange('doubleTicket', 'earlyBirdPrice', e.target.value)} 
                      className="w-full p-2 md:p-3 bg-black rounded-lg mt-1 text-sm md:text-base" 
                      required={formData.doubleTicketAvailable}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Regular Price (₵)</label>
                    <input 
                      type="number" 
                      placeholder="450"
                      value={formData.doubleTicket.regularPrice}
                      onChange={(e) => handleTicketChange('doubleTicket', 'regularPrice', e.target.value)} 
                      className="w-full p-2 md:p-3 bg-black rounded-lg mt-1 text-sm md:text-base" 
                      required={formData.doubleTicketAvailable}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Max Available</label>
                    <input 
                      type="number" 
                      value={formData.doubleTicket.maxAvailable}
                      onChange={(e) => handleTicketChange('doubleTicket', 'maxAvailable', e.target.value)} 
                      className="w-full p-2 md:p-3 bg-black rounded-lg mt-1 text-sm md:text-base" 
                      required={formData.doubleTicketAvailable}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 md:py-4 border border-white/30 rounded-xl md:rounded-2xl font-medium hover:bg-white/10 transition text-sm md:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 md:py-4 bg-pink-600 hover:bg-pink-700 rounded-xl md:rounded-2xl font-bold disabled:opacity-50 transition text-sm md:text-base order-1 sm:order-2"
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;