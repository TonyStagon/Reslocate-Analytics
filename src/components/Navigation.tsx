import React, { useState } from "react";
import {
  BarChart3,
  GraduationCap,
  Building2,
  Users,
  DollarSign,
  MapPin,
  Activity,
  MousePointer,
  GitBranch,
  Target,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavigationProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function Navigation({
  currentPage = "overview",
  onNavigate,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Number of items to show in the carousel at once
  const itemsPerView = 5;

  const menuItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "universities", label: "Universities", icon: GraduationCap },
    { id: "tvet", label: "TVET Colleges", icon: Building2 },
    { id: "funding", label: "Funding", icon: DollarSign },
    { id: "institutions", label: "Institutions", icon: MapPin },
    { id: "session-health", label: "Session Health", icon: Activity },
    { id: "engagement", label: "Engagement", icon: MousePointer },
    { id: "user-journey", label: "User Journey", icon: GitBranch },
    { id: "feature-adoption", label: "Feature Adoption", icon: Target },
  ];

  const handleNavigation = (page: string) => {
    onNavigate?.(page);
    setMobileMenuOpen(false);
  };

  const navigateCarousel = (direction: "prev" | "next") => {
    const menuLength = menuItems.length;

    if (direction === "next") {
      setCarouselIndex((carouselIndex + 1) % menuLength);
    } else {
      setCarouselIndex((carouselIndex - 1 + menuLength) % menuLength);
    }
  };

  const getVisibleItems = () => {
    const totalItems = menuItems.length;
    const start = carouselIndex;
    let end = start + itemsPerView;

    // Handle the wrap-around case when we reach the end
    if (end <= totalItems) {
      return menuItems.slice(start, end);
    } else {
      // Calculate how many items we need from the beginning
      const wrapCount = end - totalItems;
      return [
        ...menuItems.slice(start, totalItems),
        ...menuItems.slice(0, wrapCount),
      ];
    }
  };

  const visibleItems = getVisibleItems();

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center group">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <img
                  src="/logo.webp"
                  alt="Analytics Dashboard Logo"
                  className="h-full w-full object-contain p-1"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/logo.png";
                  }}
                />
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                Analytics
              </span>
            </div>
          </div>

          {/* Desktop Navigation Carousel */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Left navigation arrow - fixed position */}
            <button
              onClick={() => navigateCarousel("prev")}
              className="p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-green-700 hover:bg-green-50 flex-shrink-0 w-10 h-10 flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Fixed width container for navigation items */}
            <div className="flex items-center space-x-2 min-w-[42rem] justify-center flex-shrink-0">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex-shrink-0">
                    <button
                      onClick={() => handleNavigation(item.id)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap ${
                        currentPage === item.id
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                          : "text-gray-600 hover:text-green-700 hover:bg-green-50 hover:shadow-md"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Right navigation arrow - fixed position */}
            <button
              onClick={() => navigateCarousel("next")}
              className="p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-green-700 hover:bg-green-50 flex-shrink-0 w-10 h-10 flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden animate-in slide-in-from-top duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200 shadow-lg">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`flex items-center w-full px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    currentPage === item.id
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                      : "text-gray-600 hover:text-green-700 hover:bg-green-50 hover:shadow-sm"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
