import * as Tooltip from '@radix-ui/react-tooltip';
import { motion } from 'framer-motion';
import { tooltipVariants } from '../../utils/animation';

export const AnimatedTooltip = ({ children, content, side = 'top', delayDuration = 500 }) => {
  return (
    <Tooltip.Root delayDuration={delayDuration}>
      <Tooltip.Trigger asChild>
        {children}
      </Tooltip.Trigger>
      
      <Tooltip.Portal>
        <Tooltip.Content asChild side={side} sideOffset={5}>
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg text-sm shadow-lg z-50 max-w-xs"
          >
            {content}
            <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-100" />
          </motion.div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
};