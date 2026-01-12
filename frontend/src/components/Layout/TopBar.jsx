import { useTheme } from "../../context/ThemeContext";
import AnimatedThemeToggle from "../ui/AnimatedThemeToggle";
import { AnimatedDropdownMenu, AnimatedDropdownItem } from "../ui/AnimatedDropdown";

export default function TopBar({ onLogout, userAddress }) {
  const { theme } = useTheme();

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-secure-dark dark:text-white">
      {/* Empty space where logo used to be - clean and content-focused */}
      <div className="w-8"></div>

      <div className="flex items-center gap-4">
        <AnimatedThemeToggle />

        <span className="text-sm font-medium">{userAddress}</span>

        <AnimatedDropdownMenu
          trigger={
            <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              ⚙️
            </button>
          }
        >
          <AnimatedDropdownItem onClick={() => {}}>
            📊 Settings
          </AnimatedDropdownItem>
          <AnimatedDropdownItem onClick={() => {}}>
            📚 Help
          </AnimatedDropdownItem>
          <AnimatedDropdownItem onClick={() => {}}>
            ℹ️ About
          </AnimatedDropdownItem>
          <AnimatedDropdownItem 
            onClick={onLogout}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            🚪 Logout
          </AnimatedDropdownItem>
        </AnimatedDropdownMenu>
      </div>
    </div>
  );
}
