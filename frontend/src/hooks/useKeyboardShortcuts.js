import { useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

/**
 * Custom hook for handling keyboard shortcuts in the email app
 */
export function useKeyboardShortcuts({
  onCompose,
  onRefresh,
  onSearch,
  onToggleTheme,
  onSelectEmail,
  onDeleteEmail,
  onReply,
  onForward,
  onStarEmail,
  onMarkImportant,
  onToggleRead,
  onMoveToFolder,
  viewMode,
  emails,
  selectedEmailId,
  activeView
}) {
  // Compose new email (Ctrl/Cmd + N)
  useHotkeys('ctrl+n, cmd+n', (e) => {
    e.preventDefault();
    if (onCompose) onCompose();
  }, {
    enableOnFormTags: true,
    description: 'Compose new email'
  });

  // Search (Ctrl/Cmd + K or /)
  useHotkeys(['ctrl+k', 'cmd+k', '/'], (e) => {
    e.preventDefault();
    if (onSearch) onSearch();
  }, {
    enableOnFormTags: false,
    description: 'Focus search'
  });

  // Refresh (Ctrl/Cmd + R or F5)
  useHotkeys(['ctrl+r', 'cmd+r', 'f5'], (e) => {
    e.preventDefault();
    if (onRefresh) onRefresh();
  }, {
    enableOnFormTags: true,
    description: 'Refresh emails'
  });

  // Toggle theme (Ctrl/Cmd + Shift + T)
  useHotkeys(['ctrl+shift+t', 'cmd+shift+t'], (e) => {
    e.preventDefault();
    if (onToggleTheme) onToggleTheme();
  }, {
    description: 'Toggle dark/light theme'
  });

  // Email navigation (Arrow keys)
  useHotkeys(['up', 'down', 'k', 'j'], (e) => {
    e.preventDefault();
    if (!emails || emails.length === 0) return;

    const currentIndex = emails.findIndex(email => email.id === selectedEmailId);
    let nextIndex;

    if (e.key === 'up' || e.key === 'k') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : emails.length - 1;
    } else {
      nextIndex = currentIndex < emails.length - 1 ? currentIndex + 1 : 0;
    }

    if (onSelectEmail && emails[nextIndex]) {
      onSelectEmail(emails[nextIndex]);
    }
  }, {
    enableOnFormTags: false,
    description: 'Navigate emails'
  });

  // Select current email (Enter or Space)
  useHotkeys(['enter', 'space'], (e) => {
    e.preventDefault();
    const currentEmail = emails?.find(email => email.id === selectedEmailId);
    if (currentEmail && onSelectEmail) {
      onSelectEmail(currentEmail);
    }
  }, {
    enableOnFormTags: false,
    description: 'Open selected email'
  });

  // Reply (R)
  useHotkeys('r', (e) => {
    e.preventDefault();
    if (selectedEmailId && onReply) {
      onReply(selectedEmailId);
    }
  }, {
    enableOnFormTags: false,
    description: 'Reply to email'
  });

  // Forward (F)
  useHotkeys('f', (e) => {
    e.preventDefault();
    if (selectedEmailId && onForward) {
      onForward(selectedEmailId);
    }
  }, {
    enableOnFormTags: false,
    description: 'Forward email'
  });

  // Toggle star (S)
  useHotkeys('s', (e) => {
    e.preventDefault();
    if (selectedEmailId && onStarEmail) {
      onStarEmail(selectedEmailId);
    }
  }, {
    enableOnFormTags: false,
    description: 'Toggle star'
  });

  // Mark important (I)
  useHotkeys('i', (e) => {
    e.preventDefault();
    if (selectedEmailId && onMarkImportant) {
      onMarkImportant(selectedEmailId);
    }
  }, {
    enableOnFormTags: false,
    description: 'Mark important'
  });

  // Toggle read status (M)
  useHotkeys('m', (e) => {
    e.preventDefault();
    if (selectedEmailId && onToggleRead) {
      onToggleRead(selectedEmailId);
    }
  }, {
    enableOnFormTags: false,
    description: 'Toggle read status'
  });

  // Delete (Delete or Backspace)
  useHotkeys(['delete', 'backspace'], (e) => {
    e.preventDefault();
    if (selectedEmailId && onDeleteEmail) {
      onDeleteEmail(selectedEmailId);
    }
  }, {
    enableOnFormTags: false,
    description: 'Delete email'
  });

  // Move to folders (Shift + Number)
  useHotkeys(['shift+1', 'shift+2', 'shift+3', 'shift+4', 'shift+5'], (e) => {
    e.preventDefault();
    const folderMap = {
      'shift+1': 'inbox',
      'shift+2': 'sent',
      'shift+3': 'drafts',
      'shift+4': 'trash',
      'shift+5': 'spam'
    };
    
    const folder = folderMap[e.hotkey];
    if (folder && onMoveToFolder && selectedEmailId) {
      onMoveToFolder(selectedEmailId, folder);
    }
  }, {
    enableOnFormTags: false,
    description: 'Move to folder'
  });

  // Toggle view mode (Ctrl/Cmd + Shift + V)
  useHotkeys(['ctrl+shift+v', 'cmd+shift+v'], (e) => {
    e.preventDefault();
    // This would toggle between list and thread view
    // Implementation depends on how view mode is managed
  }, {
    description: 'Toggle view mode'
  });

  // Quick navigation to folders (Number keys)
  useHotkeys(['1', '2', '3', '4', '5', '6'], (e) => {
    e.preventDefault();
    const folderMap = {
      '1': 'inbox',
      '2': 'sent', 
      '3': 'drafts',
      '4': 'trash',
      '5': 'spam',
      '6': 'settings'
    };
    
    const folder = folderMap[e.key];
    if (folder && onMoveToFolder) {
      onMoveToFolder(null, folder); // null email ID means just navigate to folder
    }
  }, {
    enableOnFormTags: false,
    description: 'Navigate to folder'
  });

  // Show keyboard shortcuts help (Ctrl/Cmd + ?)
  useHotkeys(['ctrl+/', 'cmd+/'], (e) => {
    e.preventDefault();
    showShortcutsHelp();
  }, {
    description: 'Show keyboard shortcuts'
  });
}

/**
 * Show keyboard shortcuts help modal
 */
function showShortcutsHelp() {
  const shortcuts = [
    { key: 'Ctrl/Cmd + N', description: 'Compose new email' },
    { key: 'Ctrl/Cmd + K or /', description: 'Focus search' },
    { key: 'Ctrl/Cmd + R or F5', description: 'Refresh emails' },
    { key: 'Ctrl/Cmd + Shift + T', description: 'Toggle theme' },
    { key: '↑/↓ or K/J', description: 'Navigate emails' },
    { key: 'Enter/Space', description: 'Open selected email' },
    { key: 'R', description: 'Reply to email' },
    { key: 'F', description: 'Forward email' },
    { key: 'S', description: 'Toggle star' },
    { key: 'I', description: 'Mark important' },
    { key: 'M', description: 'Toggle read status' },
    { key: 'Delete/Backspace', description: 'Delete email' },
    { key: 'Shift + 1-5', description: 'Move to folders' },
    { key: '1-6', description: 'Navigate to folders' },
    { key: 'Ctrl/Cmd + ?', description: 'Show this help' },
  ];

  // Create and show help modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-900 p-6 rounded-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
      <h2 class="text-xl font-bold mb-4 dark:text-white">Keyboard Shortcuts</h2>
      <div class="space-y-2">
        ${shortcuts.map(shortcut => `
          <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
            <span class="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">${shortcut.key}</span>
            <span class="text-sm text-gray-600 dark:text-gray-400">${shortcut.description}</span>
          </div>
        `).join('')}
      </div>
      <button onclick="this.closest('.fixed').remove()" class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg">
        Close (Press any key)
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close on any key press
  const handleKeyPress = (e) => {
    modal.remove();
    document.removeEventListener('keydown', handleKeyPress);
  };
  document.addEventListener('keydown', handleKeyPress);
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      document.removeEventListener('keydown', handleKeyPress);
    }
  });
}

export default useKeyboardShortcuts;