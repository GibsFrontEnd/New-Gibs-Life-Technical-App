// @ts-nocheck

import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, ChevronDown, LogOut, Mail, Phone, Calendar, Shield, IdCard, X } from 'lucide-react';

interface Customer {
  id: string;
  insuredID: string;
  fullName: string;
  surname: string;
  otherNames: string;
  email: string;
  mobilePhone: string;
  clientType: string | null;
  dateOfBirth: string;
  isActive: number;
  permissions: string[];
}

const CustomerLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { 
      icon: "🏠", 
      label: "Dashboard", 
      path: "/dashboard" 
    },
    { 
      icon: "⏱️", 
      label: "Policy History", 
      path: "/policy-history" 
    },
    { 
      icon: "💳",
      label: "Make Payment", 
      path: "/make-payment" 
    },
    { 
      icon: "🚨",  
      label: "Report Claim", 
      path: "/report-claim" 
    },
     { 
      icon: "💵",  
      label: "Transaction History", 
      path: "/transaction-history" 
    },
  ];

  // Enhanced navigation handler with auto-close
  const handleNavigation = (path: string) => {
    navigate(path);
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Enhanced logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('unEncryptedUser');
    window.location.href = '/login';
  };

  // Enhanced profile view handler
  const handleViewProfile = () => {
    setIsUserDropdownOpen(false);
    setIsProfileModalOpen(true);
  };

  // Load customer data
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }

        const unEncryptedUser = localStorage.getItem('unEncryptedUser');
        if (unEncryptedUser) {
          try {
            const userData = JSON.parse(unEncryptedUser);
            if (userData.customer) {
              setCustomerData(userData.customer);
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.warn('Error parsing unEncryptedUser:', parseError);
          }
        }

        await fetchCustomerProfile(token);
        
      } catch (error) {
        console.error('Error loading customer data:', error);
        setLoading(false);
      }
    };

    const fetchCustomerProfile = async (token: string) => {
      try {
        const encryptedUser = localStorage.getItem('user');
        if (encryptedUser) {
          console.log('User data found (encrypted):', encryptedUser);
        }
        
        try {
          const tokenPayload = JSON.parse(atob(token?.split('.')[1] || ''));
          const customerFromToken: Customer = {
            id: tokenPayload.nameidentifier || 'N/A',
            insuredID: tokenPayload.InsuredID || tokenPayload.nameidentifier || 'N/A',
            fullName: tokenPayload.name || tokenPayload.CustomerName || 'Customer',
            surname: tokenPayload.surname || '',
            otherNames: tokenPayload.otherNames || '',
            email: tokenPayload.email || 'N/A',
            mobilePhone: tokenPayload.mobilePhone || 'N/A',
            clientType: null,
            dateOfBirth: tokenPayload.dateOfBirth || 'N/A',
            isActive: 1,
            permissions: tokenPayload.Permission || ['ViewOwnPolicies', 'ViewOwnProfile']
          };
          
          setCustomerData(customerFromToken);
        } catch (tokenError) {
          console.error('Error decoding token:', tokenError);
        }
        
      } catch (apiError) {
        console.error('Error fetching customer profile:', apiError);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close user dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      
      // Close sidebar when clicking outside on mobile
      if (window.innerWidth < 1024 && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node) &&
          isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  // Close sidebar when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Enhanced Sidebar */}
     <aside 
    ref={sidebarRef}
    className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-900 to-blue-950 text-white transform transition-transform duration-300 ease-in-out ${
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}
  >
        <div className="p-4 lg:p-6 h-full flex flex-col">
          {/* Header with close button for mobile */}
          <div className="flex items-center justify-between mb-8 lg:mb-12">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center transform rotate-45">
                <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white rounded transform -rotate-45"></div>
              </div>
              <span className="text-lg lg:text-xl font-bold">GIBSLIFE</span>
            </div>
            
            {/* Close button for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 lg:space-y-2 flex-1">
            {navItems.map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-all duration-200 text-sm lg:text-base ${
                  location.pathname === item.path 
                    ? 'bg-white/20 shadow-lg' 
                    : 'hover:bg-white/10'
                }`}
                onClick={() => handleNavigation(item.path)}
              >
                <span className="text-lg lg:text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <button 
            onClick={() => {
              handleLogout();
              if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
              }
            }}
            className="w-full flex items-center space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg hover:bg-red-500/20 transition-all duration-200 mt-4 border-t border-white/10 pt-4 text-sm lg:text-base"
          >
            <LogOut size={18} className="lg:w-5 lg:h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fadeIn"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
     <div className="flex-1 flex flex-col min-w-0 lg:ml-64"> 
        {/* Enhanced Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-3 lg:space-x-4">
            <button 
              className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base lg:text-lg xl:text-xl text-gray-800 truncate">
              Welcome back,{' '}
              <span className="font-semibold text-blue-900">
                {customerData 
                  ? customerData.fullName.split(' ')[0] // Show only first name on mobile
                  : (loading ? 'Loading...' : 'Customer')
                }
              </span>
            </h1>
          </div>
          
          {/* Enhanced User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div 
              className="flex items-center space-x-2 lg:space-x-3 bg-gray-100 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-all duration-200 min-w-0"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            >
              <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                <User size={14} className="lg:w-4 lg:h-4 text-white" />
              </div>
              
              {/* Show name on larger screens */}
              <span className="hidden sm:block text-sm text-gray-700 truncate max-w-24 lg:max-w-32">
                {customerData ? customerData.fullName.split(' ')[0] : 'Customer'}
              </span>
             
              <ChevronDown 
                size={14} 
                className={`text-gray-600 transition-transform duration-200 flex-shrink-0 ${
                  isUserDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </div>
            
            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-slideDown">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {customerData ? customerData.fullName : 'Customer'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Customer Account</p>
                </div>
                
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors disabled:opacity-50"
                  onClick={handleViewProfile}
                  disabled={!customerData}
                >
                  <User size={16} />
                  <span>View Profile</span>
                </button>
                
                <div className="border-t border-gray-100 my-1" />
                
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content - Enhanced for responsiveness */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Enhanced Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideDown mx-auto">
            <div className="p-4 lg:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-800">Customer Profile</h2>
                <button 
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-xl lg:text-2xl p-1"
                >
                  <X size={20} className="lg:w-6 lg:h-6" />
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-6 lg:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : customerData ? (
                <div className="space-y-4 lg:space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                      <User size={20} className="lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base lg:text-lg font-semibold text-gray-800 truncate">
                        {customerData.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">Customer</p>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-3 lg:space-y-4">
                    <h4 className="font-semibold text-gray-700 border-b pb-2 text-sm lg:text-base">
                      Personal Information
                    </h4>
                    
                    <div className="space-y-2 lg:space-y-3">
                      <div className="flex items-center space-x-3">
                        <IdCard size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Customer ID</p>
                          <p className="text-sm font-medium truncate">{customerData.id}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Shield size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Insured ID</p>
                          <p className="text-sm font-medium truncate">{customerData.insuredID}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="text-sm font-medium">{formatDate(customerData.dateOfBirth)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3 lg:space-y-4">
                    <h4 className="font-semibold text-gray-700 border-b pb-2 text-sm lg:text-base">
                      Contact Information
                    </h4>
                    
                    <div className="space-y-2 lg:space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium truncate">{customerData.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Phone size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Mobile Phone</p>
                          <p className="text-sm font-medium">{customerData.mobilePhone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="space-y-3 lg:space-y-4">
                    <h4 className="font-semibold text-gray-700 border-b pb-2 text-sm lg:text-base">
                      Account Status
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customerData.isActive === 1 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customerData.isActive === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Permissions */}
                  {customerData.permissions && customerData.permissions.length > 0 && (
                    <div className="space-y-3 lg:space-y-4">
                      <h4 className="font-semibold text-gray-700 border-b pb-2 text-sm lg:text-base">
                        Permissions
                      </h4>
                      <div className="flex flex-wrap gap-1 lg:gap-2">
                        {customerData.permissions.map((permission, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium break-words max-w-full"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 lg:py-8">
                  <p className="text-gray-500 text-sm lg:text-base">
                    Profile information not available
                  </p>
                  <button 
                    onClick={() => setIsProfileModalOpen(false)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLayout;