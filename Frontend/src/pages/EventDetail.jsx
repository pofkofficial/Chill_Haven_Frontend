import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PaystackPop from '@paystack/inline-js';
import { getEvent, getEventAvailability, initializePayment } from '../services/api';
import { CheckCircle, Calendar, MapPin, Clock, ArrowLeft } from 'lucide-react';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const [ticketType, setTicketType] = useState('single');
  const [participants, setParticipants] = useState([
    { name: '', phone: '', email: '' }
  ]);

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC;
  const backend_link = import.meta.env.VITE_BACKEND_LINK || 'http://localhost:5000';

  // Handle Paystack redirect verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');

    if (reference) {
      verifyPaymentStatus(reference);
    }
  }, []);

  const verifyPaymentStatus = async (reference) => {
    setVerifying(true);
    try {
      const res = await fetch(`${backend_link}/purchase/verify/${reference}`);
      const data = await res.json();

      if (data.success) {
        setSuccessData({
          reference,
          eventTitle: event?.title || 'Chill Haven House Party'
        });
        setShowSuccess(true);

        // Auto close popup and redirect after 5 seconds
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/');
        }, 5000);
      } else {
        alert('Payment verification failed.');   // Only keep this one for failure
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      alert('Could not verify payment. Please contact support.');
      navigate('/');
    } finally {
      setVerifying(false);
    }
  };

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [eventRes, availRes] = await Promise.all([
          getEvent(id),
          getEventAvailability(id)
        ]);

        setEvent(eventRes.data);
        setAvailability(availRes.data);

        if (!eventRes.data.doubleTicketAvailable || availRes.data.double?.remaining <= 0) {
          setTicketType('single');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load event. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  const handleTicketTypeChange = (type) => {
    setTicketType(type);
    if (type === 'single') {
      setParticipants([{ name: '', phone: '', email: '' }]);
    } else {
      setParticipants([
        { name: '', phone: '', email: '' },
        { name: '', phone: '', email: '' }
      ]);
    }
  };

  const handleParticipantChange = (index, field, value) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const addParticipant = () => {
    if (participants.length < 2) {
      setParticipants([...participants, { name: '', phone: '', email: '' }]);
    }
  };

  const removeParticipant = (index) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const currentPrice = availability 
    ? (ticketType === 'single' ? availability.single.price : availability.double.price)
    : 0;

  const remaining = availability 
    ? (ticketType === 'single' ? availability.single.remaining : availability.double.remaining)
    : 0;

  const isEarlyBirdActive = availability?.isEarlyBird || false;

  const handlePurchase = async () => {
    if (!event || !publicKey) {
      alert("Paystack is not configured. Please check your .env file.");
      return;
    }

    // Validation
    for (let p of participants) {
      if (!p.name?.trim() || !p.phone?.trim() || !p.email?.trim()) {
        alert('Please fill all participant details');
        return;
      }
    }

    if (ticketType === 'double' && participants[0].phone === participants[1].phone) {
      alert('Phone numbers must be different for Double ticket');
      return;
    }

    if (currentPrice <= 0 || remaining <= 0) {
      alert('This ticket type is no longer available');
      return;
    }

    try {
      const payload = { eventId: id, ticketType, participants };

      const res = await initializePayment(payload);
      const { reference } = res.data;

      const popup = new PaystackPop();
      popup.newTransaction({
        key: publicKey,
        email: participants[0].email,
        amount: currentPrice * 100,
        reference,
        onSuccess: (transaction) => verifyPaymentStatus(transaction.reference),
        onCancel: () => alert('Payment was cancelled.')
      });

    } catch (err) {
      console.error("Purchase Error:", err);
      alert(err.response?.data?.msg || 'Failed to initialize payment.');
    }
  };

  // Success Popup
  const SuccessPopup = () => (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 border border-green-500/30 rounded-3xl p-8 md:p-10 max-w-md w-full text-center">
        <CheckCircle size={70} className="text-green-400 mx-auto mb-6" />
        
        <h2 className="text-3xl font-bold text-green-400 mb-3">Payment Successful!</h2>
        <p className="text-lg text-white mb-8">
          You have successfully purchased tickets for<br />
          <span className="font-semibold text-pink-400">{successData?.eventTitle}</span>
        </p>

        <div className="bg-black/50 rounded-2xl p-4 mb-8">
          <p className="text-gray-400 text-sm">Transaction Reference</p>
          <p className="font-mono text-green-400 break-all">{successData?.reference}</p>
        </div>

        <p className="text-gray-400">Redirecting to home in 5 seconds...</p>
      </div>
    </div>
  );

  if (verifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p>Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading event details...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center text-white">Event not found</div>;

  const hasDoubleTickets = availability?.double?.available && availability?.double?.remaining > 0;

  const earlyBirdText = isEarlyBirdActive 
    ? `Ends ${new Date(event.earlyBirdEnd).toLocaleDateString()}` 
    : "Early Bird Ended";

  return (
    <div className="min-h-screen bg-black text-white">
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: "url('/EventDetailBackground/eventbg.webp')" }}
      >
        <div className="absolute inset-0 bg-black/80"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 md:mb-8 flex items-center gap-2 text-pink-400 hover:text-pink-300 transition"
        >
          <ArrowLeft size={18} /> Back to Home
        </button>

        <h1 className="text-3xl md:text-5xl font-bold text-center mb-3 break-words">{event.title}</h1>
        
        <p className="text-center text-base md:text-xl text-pink-300 mb-8 md:mb-12">
          {new Date(event.date).toLocaleDateString('en-US', { 
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
          })}
        </p>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          {/* Event Info */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-pink-400">Event Details</h2>
            
            <p className="text-gray-300 leading-relaxed mb-8">
              {event.description || "Get ready for an unforgettable night of music, lights, and pure vibes at Chill Haven House Party!"}
            </p>

            <div className="space-y-5 text-base">
              <div className="flex items-start gap-4">
                <MapPin size={22} className="text-pink-400 mt-1" />
                <div>
                  <p className="text-pink-300 text-sm">VENUE</p>
                  <p className="font-medium">{event.venue || "The G-HOUSE APARTMENT"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock size={22} className="text-pink-400 mt-1" />
                <div>
                  <p className="text-pink-300 text-sm">TIME</p>
                  <p className="font-medium">
                    {new Date(event.date).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })} - Till Morning
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Calendar size={22} className="text-pink-400 mt-1" />
                <div>
                  <p className="text-pink-300 text-sm">EARLY BIRD</p>
                  <p className="font-medium">{earlyBirdText}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticketing Section */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold mb-6">Get Your Tickets</h2>

            <div className="flex gap-3 mb-8">
              <button
                onClick={() => handleTicketTypeChange('single')}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all ${ticketType === 'single' ? 'bg-pink-600 scale-105' : 'bg-white/10'}`}
              >
                Single Ticket
              </button>

              {hasDoubleTickets && (
                <button
                  onClick={() => handleTicketTypeChange('double')}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${ticketType === 'double' ? 'bg-pink-600 scale-105' : 'bg-white/10'}`}
                >
                  Double Ticket
                </button>
              )}
            </div>

            <div className="text-center mb-8">
              <p className="text-4xl font-bold text-pink-400 mb-1">₵{currentPrice}</p>
              {ticketType === 'double' && (
                <p className="text-gray-400 text-sm">(for 2 people)</p>
              )}
            </div>

            {isEarlyBirdActive && remaining !== null && (
              <div className="mb-6 text-center">
                {remaining > 0 ? (
                  <p className="text-green-400">
                    🎟️ {remaining} early bird {ticketType === 'double' ? 'pairs' : 'tickets'} remaining
                  </p>
                ) : (
                  <p className="text-yellow-400">⚠️ Early bird sold out — Regular price applies</p>
                )}
              </div>
            )}

            {participants.map((p, index) => (
              <div key={index} className="mb-6 p-6 bg-black/50 rounded-2xl">
                <h3 className="font-medium mb-4">
                  Participant {index + 1} {ticketType === 'double' && `(Person ${index + 1})`}
                </h3>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={p.name}
                  onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                  className="w-full p-3 mb-3 bg-white/90 text-black rounded-lg"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={p.phone}
                  onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                  className="w-full p-3 mb-3 bg-white/90 text-black rounded-lg"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={p.email}
                  onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                  className="w-full p-3 bg-white/90 text-black rounded-lg"
                />
                {ticketType === 'double' && participants.length > 1 && index === 1 && (
                  <button 
                    onClick={() => removeParticipant(index)} 
                    className="text-red-400 text-sm mt-2 hover:text-red-300"
                  >
                    Remove Person
                  </button>
                )}
              </div>
            ))}

            {ticketType === 'double' && participants.length === 1 && (
              <button 
                onClick={addParticipant} 
                className="text-pink-400 underline mb-6 block hover:text-pink-300"
              >
                + Add Second Person
              </button>
            )}

            <button
              onClick={handlePurchase}
              disabled={!publicKey}
              className="w-full py-5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 rounded-2xl text-xl font-bold disabled:opacity-50 transition-all"
            >
              Pay ₵{currentPrice} with Paystack
            </button>

            {!publicKey && (
              <p className="text-red-400 text-sm text-center mt-3">
                Payment is not configured. Please contact admin.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Success Popup - Only this will show on success */}
      {showSuccess && <SuccessPopup />}
    </div>
  );
};

export default EventDetail;