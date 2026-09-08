import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { MatchEntryView } from './components/match-entry/MatchEntryView';
import { MatchEntryModal } from './components/match-entry/MatchEntryModal';
import { RosterView } from './components/roster/RosterView';
import { TournamentsView } from './components/tournaments/TournamentsView';
import { TaskBoardView } from './components/tasks/TaskBoardView';
import { FinanceView } from './components/finance/FinanceView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { PointsSystemView } from './components/settings/PointsSystemView';
import { LoginPage } from './components/auth/LoginPage';

const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('analytics');
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  // Always start from Login Page if not authenticated or if 1-hour session expired
  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'analytics':
        return <AnalyticsView onOpenMatchEntry={() => setIsMatchModalOpen(true)} />;
      case 'matches':
        return <MatchEntryView />;
      case 'roster':
        return <RosterView />;
      case 'tournaments':
        return <TournamentsView onOpenMatchEntry={() => setIsMatchModalOpen(true)} />;
      case 'tasks':
        return <TaskBoardView />;
      case 'finance':
        return <FinanceView />;
      case 'points':
        return <PointsSystemView />;
      default:
        return <AnalyticsView onOpenMatchEntry={() => setIsMatchModalOpen(true)} />;
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0c0d11' }}>
      {/* INHUMANS Esports Full-Width Header with Nav */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMatchEntry={() => setIsMatchModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="content-body" style={{ flex: 1, padding: '24px 28px', maxWidth: '1420px', margin: '0 auto', width: '100%' }}>
        {renderActiveView()}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMatchEntry={() => setIsMatchModalOpen(true)}
      />

      {/* Global Quick Match Entry Modal */}
      <MatchEntryModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
