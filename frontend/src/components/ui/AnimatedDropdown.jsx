import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { dropdownVariants } from '../../utils/animation';

export const AnimatedDropdownMenu = ({ children, trigger, align = 'start' }) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content asChild align={align} sideOffset={5}>
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px] z-50"
          >
            {children}
          </motion.div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export const AnimatedDropdownItem = ({ children, onClick, className = '', ...props }) => {
  return (
    <DropdownMenu.Item asChild>
      <motion.button
        className={`px-3 py-2 text-sm text-left w-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors ${className}`}
        onClick={onClick}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        {...props}
      >
        {children}
      </motion.button>
    </DropdownMenu.Item>
  );
};

export const AnimatedDropdownSeparator = () => (
  <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
);