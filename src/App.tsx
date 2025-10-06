import React, { useState } from "react";
import { Layout } from "./components/Layout";
import { Navigation } from "./components/Navigation";
import { Overview } from "./pages/Overview";
import { Universities } from "./pages/Universities";
import { TVET } from "./pages/TVET";
import { Funding } from "./pages/Funding";
import { Institutions } from "./pages/Institutions";
import { SessionHealth } from "./pages/SessionHealth";
import { Engagement } from "./pages/Engagement";
import { UserJourney } from "./pages/UserJourney";
import { FeatureAdoption } from "./pages/FeatureAdoption";

function App() {
  const [currentPage, setCurrentPage] = useState("overview");

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "overview":
        return <Overview />;
      case "universities":
        return <Universities />;
      case "tvet":
        return <TVET />;
      case "funding":
        return <Funding />;
      case "institutions":
        return <Institutions />;
      case "session-health":
        return <SessionHealth />;
      case "engagement":
        return <Engagement />;
      case "user-journey":
        return <UserJourney />;
      case "feature-adoption":
        return <FeatureAdoption />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;
