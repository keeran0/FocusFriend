/**
 * Focus Wrapped - Vapor Dusk Edition
 * FULL-SCREEN MODAL with blur backdrop - properly positioned overlay
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  calculateRecapStats,
  generateDemoData,
  invalidateRecapCache,
  type RecapStats,
} from './focusWrappedData';

type RecapPeriod = 'week' | 'month' | 'semester' | 'year' | 'all';

interface FocusWrappedProps {
  isOpen: boolean;
  onClose: () => void;
  period?: RecapPeriod;
}

interface CardConfig {
  id: string;
  gradient: string;
  icon: string;
  getTitle: (stats: RecapStats) => string;
  getValue: (stats: RecapStats) => string;
  getSubtext: (stats: RecapStats) => string;
}

const CARDS: CardConfig[] = [
  {
    id: 'intro',
    gradient: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a25 50%, #12121a 100%)',
    icon: '✨',
    getTitle: stats => `Your Focus ${stats?.periodLabel || 'Journey'}`,
    getValue: () => '',
    getSubtext: () => "Let's explore your progress...",
  },
  {
    id: 'total-time',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffa07a 50%, #ffd93d 100%)',
    icon: '⏱',
    getTitle: () => 'Total focus time',
    getValue: stats => {
      if (!stats) return '0m';
      if (stats.totalFocusHours >= 1) {
        return `${stats.totalFocusHours}h`;
      }
      return `${stats.totalFocusMinutes || 0}m`;
    },
    getSubtext: stats => `That's ${stats?.equivalentMovies || 0} movies of pure focus`,
  },
  {
    id: 'sessions',
    gradient: 'linear-gradient(135deg, #b4a0ff 0%, #7dd3fc 100%)',
    icon: '📊',
    getTitle: () => 'Sessions completed',
    getValue: stats => `${stats?.totalSessions || 0}`,
    getSubtext: stats => `${stats?.averageSessionMinutes || 0} min average`,
  },
  {
    id: 'longest-session',
    gradient: 'linear-gradient(135deg, #ffd93d 0%, #ffb347 50%, #ff6b6b 100%)',
    icon: '🏆',
    getTitle: () => 'Longest session',
    getValue: stats => `${stats?.longestSessionMinutes || 0}m`,
    getSubtext: () => 'Deep work champion',
  },
  {
    id: 'streak',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffa07a 100%)',
    icon: '🔥',
    getTitle: () => 'Best streak',
    getValue: stats => `${stats?.longestStreak || 0} days`,
    getSubtext: stats =>
      (stats?.currentStreak || 0) > 0
        ? `Currently at ${stats.currentStreak} days!`
        : 'Start a new streak today',
  },
  {
    id: 'productive-day',
    gradient: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)',
    icon: '📅',
    getTitle: () => 'Most productive day',
    getValue: stats => stats?.mostProductiveDay || 'Monday',
    getSubtext: stats => `${stats?.mostProductiveDayPercent || 0}% of your focus`,
  },
  {
    id: 'productive-hour',
    gradient: 'linear-gradient(135deg, #7dd3fc 0%, #b4a0ff 100%)',
    icon: '🌙',
    getTitle: () => 'Peak focus hour',
    getValue: stats => stats?.mostProductiveHour || '9 AM',
    getSubtext: () => 'Your golden hour',
  },
  {
    id: 'favorite-duration',
    gradient: 'linear-gradient(135deg, #ffa07a 0%, #ffd93d 100%)',
    icon: '⭐',
    getTitle: () => 'Favorite duration',
    getValue: stats => `${stats?.favoriteSessionDuration || 30}m`,
    getSubtext: () => 'Your sweet spot',
  },
  {
    id: 'goals',
    gradient: 'linear-gradient(135deg, #34d399 0%, #6ee7b7 50%, #7dd3fc 100%)',
    icon: '🎯',
    getTitle: () => 'Goal completion',
    getValue: stats => `${stats?.goalCompletionRate || 0}%`,
    getSubtext: stats => `Hit your goal ${stats?.daysGoalMet || 0} times`,
  },
  {
    id: 'points',
    gradient: 'linear-gradient(135deg, #ffd93d 0%, #ffb347 100%)',
    icon: '💎',
    getTitle: () => 'Points earned',
    getValue: stats => (stats?.totalPointsEarned || 0).toLocaleString(),
    getSubtext: () => 'Every minute counts',
  },
  {
    id: 'summary',
    gradient:
      'linear-gradient(135deg, #ff6b6b 0%, #ffa07a 25%, #ffd93d 50%, #6ee7b7 75%, #7dd3fc 100%)',
    icon: '🎉',
    getTitle: stats => `${stats?.periodLabel || 'Your'} Summary`,
    getValue: () => '',
    getSubtext: () => 'Keep up the momentum!',
  },
];

function WrappedContent({ isOpen, onClose, period = 'month' }: FocusWrappedProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [stats, setStats] = useState<RecapStats | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [selectedPeriod, setSelectedPeriod] = useState<RecapPeriod>(period);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentCard(0);
      setIsAnimating(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      invalidateRecapCache();
      const recapStats = calculateRecapStats(selectedPeriod);
      setStats(recapStats);
      setCurrentCard(0);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, selectedPeriod]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentCard, isAnimating]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const goToNext = useCallback(() => {
    if (isAnimating) return;

    if (currentCard >= CARDS.length - 1) {
      handleClose();
      return;
    }

    setDirection('next');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentCard(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  }, [currentCard, isAnimating, handleClose]);

  const goToPrev = useCallback(() => {
    if (isAnimating) return;
    if (currentCard > 0) {
      setDirection('prev');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentCard(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentCard, isAnimating]);

  const goToCard = useCallback(
    (index: number) => {
      if (isAnimating || index === currentCard) return;
      setDirection(index > currentCard ? 'next' : 'prev');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentCard(index);
        setIsAnimating(false);
      }, 300);
    },
    [currentCard, isAnimating]
  );

  const handleGenerateDemo = () => {
    generateDemoData();
    const recapStats = calculateRecapStats(selectedPeriod);
    setStats(recapStats);
    setCurrentCard(0);
  };

  if (!isOpen || !stats) return null;

  const safeCardIndex = Math.min(currentCard, CARDS.length - 1);
  const card = CARDS[safeCardIndex];
  const isLastCard = safeCardIndex === CARDS.length - 1;
  const isSummaryCard = card.id === 'summary';

  return (
    <div className={`wrapped-modal ${isClosing ? 'closing' : ''}`}>
      {/* Blurred backdrop */}
      <div className="wrapped-backdrop" onClick={handleClose} />

      {/* Modal content */}
      <div className="wrapped-container">
        {/* Close Button */}
        <button className="close-btn" onClick={handleClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Period Selector */}
        <div className="period-selector">
          {(['week', 'month', 'semester', 'year'] as RecapPeriod[]).map(p => (
            <button
              key={p}
              className={`period-btn ${selectedPeriod === p ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Main Card */}
        <div
          className={`wrapped-card ${isAnimating ? `animating-${direction}` : ''}`}
          style={{ background: card.gradient }}
          onClick={goToNext}
        >
          <div className="card-noise" />

          <div className="card-content">
            <div className="card-icon">{card.icon}</div>
            <h2 className="card-title">{card.getTitle(stats)}</h2>
            {card.getValue(stats) && <div className="card-value">{card.getValue(stats)}</div>}
            <p className="card-subtext">{card.getSubtext(stats)}</p>

            {isSummaryCard && stats && (
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-value">{stats.totalFocusHours}h</span>
                  <span className="summary-label">Focused</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">{stats.totalSessions}</span>
                  <span className="summary-label">Sessions</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">{stats.longestStreak}</span>
                  <span className="summary-label">Day Streak</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">{stats.goalCompletionRate}%</span>
                  <span className="summary-label">Goals Met</span>
                </div>
              </div>
            )}
          </div>

          <div className="card-nav-hint">{isLastCard ? 'Tap to close' : 'Tap to continue →'}</div>
        </div>

        {/* Progress Dots */}
        <div className="progress-dots">
          {CARDS.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === safeCardIndex ? 'active' : ''} ${index < safeCardIndex ? 'completed' : ''}`}
              onClick={() => goToCard(index)}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="nav-buttons">
          <button className="nav-btn prev" onClick={goToPrev} disabled={currentCard === 0}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12 4l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button className="nav-btn next" onClick={goToNext}>
            {isLastCard ? 'Done' : 'Next'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M8 4l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {stats.totalSessions === 0 && (
          <button className="demo-btn" onClick={handleGenerateDemo}>
            🎲 Generate Demo Data
          </button>
        )}
      </div>

      <style>{`
        .wrapped-modal {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: modalFadeIn 0.3s ease;
        }

        .wrapped-modal.closing {
          animation: modalFadeOut 0.3s ease forwards;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .wrapped-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(10, 10, 15, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .wrapped-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          animation: containerSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .wrapped-modal.closing .wrapped-container {
          animation: containerSlideDown 0.3s ease forwards;
        }

        @keyframes containerSlideUp {
          from { 
            opacity: 0;
            transform: translateY(40px) scale(0.95); 
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1); 
          }
        }

        @keyframes containerSlideDown {
          from { 
            opacity: 1;
            transform: translateY(0) scale(1); 
          }
          to { 
            opacity: 0;
            transform: translateY(40px) scale(0.95); 
          }
        }

        .close-btn {
          position: absolute;
          top: 0;
          right: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: scale(1.05);
        }

        .period-selector {
          display: flex;
          gap: 8px;
          padding: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .period-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-size: 13px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .period-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .period-btn.active {
          background: linear-gradient(135deg, #ff6b6b 0%, #ffa07a 100%);
          color: #0a0a0f;
        }

        .wrapped-card {
          width: 100%;
          aspect-ratio: 9/16;
          max-height: 60vh;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 30px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .card-noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.04;
          pointer-events: none;
        }

        .wrapped-card:hover { transform: scale(1.02); }
        .wrapped-card.animating-next { animation: slideOutLeft 0.3s ease forwards; }
        .wrapped-card.animating-prev { animation: slideOutRight 0.3s ease forwards; }

        @keyframes slideOutLeft {
          0% { transform: translateX(0) scale(1); opacity: 1; }
          100% { transform: translateX(-80px) scale(0.95); opacity: 0; }
        }
        @keyframes slideOutRight {
          0% { transform: translateX(0) scale(1); opacity: 1; }
          100% { transform: translateX(80px) scale(0.95); opacity: 0; }
        }

        .card-content {
          position: relative;
          z-index: 1;
          text-align: center;
          color: white;
          animation: contentFadeIn 0.5s ease 0.1s both;
        }

        @keyframes contentFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card-icon {
          font-size: 56px;
          margin-bottom: 20px;
          animation: iconPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
          filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3));
        }

        @keyframes iconPop {
          0% { transform: scale(0) rotate(-20deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        .card-title {
          font-family: var(--font-display, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 16px;
          opacity: 0.95;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .card-value {
          font-family: var(--font-display, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-size: 64px;
          font-weight: 700;
          margin-bottom: 16px;
          line-height: 1;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          animation: valuePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
        }

        @keyframes valuePop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .card-subtext {
          font-size: 15px;
          opacity: 0.85;
          max-width: 280px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 30px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
        }

        .summary-item { text-align: center; }
        .summary-value {
          display: block;
          font-family: var(--font-display, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-size: 28px;
          font-weight: 700;
        }
        .summary-label {
          font-size: 12px;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-nav-hint {
          position: absolute;
          bottom: 24px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        .progress-dots { display: flex; gap: 8px; }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }
        .dot:hover { background: rgba(255, 255, 255, 0.4); transform: scale(1.3); }
        .dot.active {
          background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%);
          transform: scale(1.3);
          box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
        }
        .dot.completed { background: rgba(255, 255, 255, 0.5); }

        .nav-buttons { display: flex; gap: 16px; }
        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: white;
          font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-size: 14px;
          font-weight: 500;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .nav-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .nav-btn.prev { padding: 12px 16px; }
        .nav-btn.next {
          background: linear-gradient(135deg, #ff6b6b 0%, #ffa07a 100%);
          border-color: transparent;
          color: #0a0a0f;
          font-weight: 600;
        }
        .nav-btn.next:hover:not(:disabled) { box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4); }

        .demo-btn {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-size: 13px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .demo-btn:hover { background: rgba(255, 255, 255, 0.1); color: white; }

        @media (max-height: 700px) {
          .wrapped-card { max-height: 55vh; padding: 30px 25px; }
          .card-icon { font-size: 40px; }
          .card-title { font-size: 18px; }
          .card-value { font-size: 48px; }
        }

        @media (max-width: 480px) {
          .wrapped-container { padding: 16px; }
          .wrapped-card { padding: 30px 20px; }
        }
      `}</style>
    </div>
  );
}

// Use portal to render at document root level
export function FocusWrapped(props: FocusWrappedProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !props.isOpen) return null;

  // Render to document.body to escape any container constraints
  return createPortal(<WrappedContent {...props} />, document.body);
}
