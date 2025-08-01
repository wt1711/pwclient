import React from 'react';
import { Overlay, OverlayCenter, OverlayBackdrop, Portal, Box } from 'folds';
import FocusTrap from 'focus-trap-react';

import { useSetSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { stopPropagation } from '../../../utils/keyboard';
import { AIAssistant } from '../desktop-ui/AIAssistant';

export function AIAssistantModal() {
  const setAiDrawer = useSetSetting(settingsAtom, 'isAiDrawerOpen');
  const handleClose = () => setAiDrawer(false);

  return (
    <Portal>
      <Overlay open backdrop={<OverlayBackdrop onClick={handleClose} />}>
        <OverlayCenter>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              clickOutsideDeactivates: true,
              onDeactivate: handleClose,
              escapeDeactivates: stopPropagation,
            }}
          >
            <Box
            // onMouseDown={stopPropagation}
            >
              <AIAssistant />
            </Box>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
    </Portal>
  );
}
