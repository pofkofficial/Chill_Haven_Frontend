import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllEvents } from '../services/api';
import { Calendar, Clock, MapPin, Gift } from 'lucide-react';

const Home = () => {
  const [event, setEvent] = useState(null);
  const [countdown, setCountdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch events and select the relevant one (next or current)
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await getAllEvents();
        const allEvents = response.data;

        if (allEvents.length === 0) {
          setEvent(null);
          return;
        }

        // Sort by date (earliest first)
        const sorted = [...allEvents].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Find the first upcoming or current event
        const now = new Date();
        let selectedEvent = sorted.find(ev => new Date(ev.date) >= now);

        // If no future event, show the most recent one
        if (!selectedEvent) {
          selectedEvent = sorted[sorted.length - 1];
        }

        setEvent(selectedEvent);
      } catch (err) {
        console.error(err);
        setError('Failed to load event. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, []);

  // Live Countdown Timer
  useEffect(() => {
    if (!event) return;

    const targetDate = new Date(event.date).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        // Event has started or passed
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true });
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, isLive: false });
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  const isUpcoming = event && new Date(event.date) > new Date();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: "url('src/assets/HomeBackground/IMG_9453.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header / Logo */}
        <header className="pt-8 md:pt-12 pb-6 md:pb-8 text-center px-4 md:px-6">
          <div className="flex justify-center mb-3 md:mb-4">
            <img 
              src="/logo.png" 
              alt="Chill Haven Logo" 
              className="h-16 md:h-24 w-auto drop-shadow-2xl"
            />
          </div>
          <p className="text-lg md:text-3xl font-light text-pink-300 tracking-wider md:tracking-widest">
            HOUSE PARTY EXPERIENCE
          </p>
        </header>

        {/* Welcome */}
        <section className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-pink-400">
            Welcome to Chill Haven
          </h2>
          <p className="text-base md:text-xl leading-relaxed text-gray-200 max-w-3xl mx-auto">
            Ghana's premier house party organizers delivering unforgettable nights 
            of music, lights, and pure energy in Accra.
          </p>
        </section>

        {/* Main Event Section with Countdown */}
        <section className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
          {loading ? (
            <div className="text-center py-12 md:py-20 text-gray-400 text-lg md:text-xl">Loading the next vibe...</div>
          ) : error ? (
            <div className="text-center py-12 md:py-20 text-red-400">{error}</div>
          ) : event ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-10 text-center">
              <p className="uppercase tracking-[2px] md:tracking-[4px] text-pink-400 text-xs md:text-sm mb-2 md:mb-3">
                {isUpcoming ? "NEXT EVENT" : "HAPPENING NOW"}
              </p>

              <h3 className="text-2xl md:text-5xl font-bold mb-6 md:mb-8 break-words">{event.title}</h3>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
                <div className="flex flex-col items-center p-3 md:p-4 bg-white/5 rounded-xl">
                  <Calendar size={20} className="text-pink-400 mb-2" />
                  <p className="text-pink-300 text-xs md:text-sm">DATE</p>
                  <p className="text-sm md:text-xl font-semibold mt-1">
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-center p-3 md:p-4 bg-white/5 rounded-xl">
                  <Clock size={20} className="text-pink-400 mb-2" />
                  <p className="text-pink-300 text-xs md:text-sm">TIME</p>
                  <p className="text-sm md:text-xl font-semibold mt-1">8:00 PM - Morning</p>
                </div>
                <div className="flex flex-col items-center p-3 md:p-4 bg-white/5 rounded-xl">
                  <MapPin size={20} className="text-pink-400 mb-2" />
                  <p className="text-pink-300 text-xs md:text-sm">VENUE</p>
                  <p className="text-sm md:text-xl font-semibold mt-1">The G-HOUSE APARTMENT</p>
                </div>
                <div className="flex flex-col items-center p-3 md:p-4 bg-white/5 rounded-xl">
                  <Gift size={20} className="text-pink-400 mb-2" />
                  <p className="text-pink-300 text-xs md:text-sm">EARLY BIRD ENDS</p>
                  <p className="text-sm md:text-xl font-semibold mt-1">
                    {new Date(event.earlyBirdEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="mb-8 md:mb-10">
                <p className="text-pink-300 text-xs md:text-sm mb-3 md:mb-4 tracking-wider md:tracking-widest">
                  {isUpcoming ? "COUNTDOWN TO THE VIBES" : "EVENT IS LIVE"}
                </p>
                <div className="flex justify-center gap-3 md:gap-8 text-center">
                  <div>
                    <div className="text-3xl md:text-5xl font-bold text-white">{countdown.days || 0}</div>
                    <div className="text-[10px] md:text-xs text-gray-400">DAYS</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-5xl font-bold text-white">{countdown.hours || 0}</div>
                    <div className="text-[10px] md:text-xs text-gray-400">HOURS</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-5xl font-bold text-white">{countdown.minutes || 0}</div>
                    <div className="text-[10px] md:text-xs text-gray-400">MIN</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-5xl font-bold text-white">{countdown.seconds || 0}</div>
                    <div className="text-[10px] md:text-xs text-gray-400">SEC</div>
                  </div>
                </div>
                <div className="mt-8 md:mt-10">
                  <p className="uppercase tracking-[2px] md:tracking-[4px] text-pink-400 text-xs md:text-sm mb-2 md:mb-3">
                    DON'T MISS OUT!
                  </p>
                </div>
              </div>

              <Link 
                to={`/events/${event._id}`}
                className="inline-block bg-pink-600 hover:bg-pink-700 transition-all px-8 md:px-14 py-3 md:py-5 rounded-full text-base md:text-xl font-bold shadow-xl shadow-pink-500/50"
              >
                {isUpcoming ? "GET TICKETS NOW →" : "JOIN THE PARTY NOW"}
              </Link>
            </div>
          ) : (
            <div className="text-center py-12 md:py-20 text-gray-400 text-lg md:text-xl">
              No events scheduled yet. Stay tuned!
            </div>
          )}
        </section>

        {/* Gallery Teaser */}
        <section className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-8">Relive The Vibes</h2>
          <p className="text-sm md:text-base text-gray-300 mb-6 md:mb-8">Check out moments from previous Chill Haven editions</p>
          
          <Link 
            to="/gallery"
            className="inline-block border-2 border-pink-500 hover:bg-pink-500/10 transition-all px-6 md:px-10 py-3 md:py-4 rounded-full text-sm md:text-lg font-medium"
          >
            Explore Gallery →
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-auto py-8 md:py-12 bg-black/80 border-t border-white/10">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-pink-400">Get In Touch</h3>
            <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 text-sm md:text-lg">
              <p>📍 Accra, Ghana</p>
              <p>📞 +233 55 840 1589</p>
              <p>✉️ chillhvn@gmail.com</p>
            </div>
            <p className="mt-6 md:mt-10 text-xs md:text-sm text-gray-500">
              © 2026 Chill Haven House Party • All Rights Reserved
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;