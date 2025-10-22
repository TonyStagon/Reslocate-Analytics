import React, { useState } from "react";
import {
  BarChart3,
  GraduationCap,
  Building2,
  DollarSign,
  MapPin,
  Activity,
  MousePointer,
  GitBranch,
  Target,
  Users,
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
    { id: "matching-profiles", label: "Matching Profiles", icon: Target },
    { id: "funding", label: "Funding", icon: DollarSign },
    { id: "institutions", label: "Institutions", icon: MapPin },
    { id: "session-health", label: "Session Health", icon: Activity },
    { id: "user-journey", label: "User Journey", icon: GitBranch },
    { id: "feature-adoption", label: "Feature Adoption", icon: Activity },
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
    <>
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-50 flex flex-col">
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 group">
            <div className="h-12 w-12 flex items-center justify-center rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
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
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                Analytics
              </h1>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                  currentPage === item.id
                    ? "bg-gradient-to-r from-green-50 to-green-50 text-green-700 border border-green-200 shadow-sm"
                    : "text-gray-600 hover:text-green-700 hover:bg-green-50 hover:border hover:border-green-100"
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 transition-colors ${currentPage === item.id ? 'text-green-700' : 'text-gray-500 group-hover:text-green-600'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {currentPage === item.id && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Section */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="p-3">
            <div className="text-xs text-gray-500 text-center">
              System Analytics
            </div>
            <div className="text-xs text-gray-400 text-center mt-1">
              v1.0.0
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
