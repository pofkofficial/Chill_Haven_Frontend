import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await adminLogin({ email, password });
      
      login(response.data.admin, response.data.token);
      navigate('/admin/dashboard');
      
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid email or password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6">
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: "url('/src/assets/images/IMG_9453.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/80"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-6 md:mb-10">
          <div className="flex justify-center mb-3 md:mb-4">
            <img 
              src="/logo.png" 
              alt="Chill Haven Logo" 
              className="h-16 md:h-24 w-auto drop-shadow-2xl"
            />
          </div>
          <p className="text-pink-400 text-lg md:text-xl font-light tracking-wide">Admin Portal</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-6 md:mb-8">Welcome Back</h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl mb-4 md:mb-6 text-center text-sm md:text-base">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs md:text-sm text-gray-300 mb-1 md:mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="admin@chillhaven.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 md:py-4 bg-white/90 text-black rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition text-sm md:text-base"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs md:text-sm text-gray-300 mb-1 md:mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 md:py-4 bg-white/90 text-black rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition text-sm md:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 
                         text-white font-bold text-base md:text-lg rounded-xl md:rounded-2xl transition-all duration-300 
                         disabled:opacity-70 disabled:cursor-not-allowed mt-4 md:mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div className="text-center mt-6 md:mt-8 text-gray-400 text-xs md:text-sm">
            <p>Demo: Use the admin account you created</p>
            <p className="text-pink-400/70 mt-1">Secure access for authorized personnel only</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs md:text-sm mt-6 md:mt-8">
          © 2026 Chill Haven House Party • All Rights Reserved
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;