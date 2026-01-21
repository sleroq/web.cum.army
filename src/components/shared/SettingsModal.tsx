import React from 'react';
import { useSettings } from '../../providers/SettingsContext';
import { THEMES, ThemeColors } from '../../config/themes';

const SettingsModal = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    currentThemeId,
    setTheme,
    customColors,
    updateCustomColor,
    pauseOnClick,
    setPauseOnClick,
  } = useSettings();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, setSettingsOpen]);

  if (!isSettingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setSettingsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="settings-title" className="text-xl font-bold text-foreground">
            Settings
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="text-muted hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme Selector */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">Theme</label>
            <select
              value={currentThemeId}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-input border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-brand"
            >
              {THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Player Settings */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">Player</label>
            <div className="flex items-center justify-between p-3 bg-input border border-border rounded">
              <span className="text-sm text-foreground">Pause on click</span>
              <button
                onClick={() => setPauseOnClick(!pauseOnClick)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  pauseOnClick ? 'bg-brand' : 'bg-surface-hover'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    pauseOnClick ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Color Customization */}
          {currentThemeId === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-muted mb-3">Colors</label>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(customColors).map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customColors[key as keyof ThemeColors]}
                      onChange={(e) => updateCustomColor(key as keyof ThemeColors, e.target.value)}
                      className="h-8 w-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-sm text-muted capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setSettingsOpen(false)}
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
