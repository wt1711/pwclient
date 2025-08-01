import React from 'react';
import { Overlay, OverlayCenter, OverlayBackdrop, Portal } from 'folds';
import FocusTrap from 'focus-trap-react';

import { useSetSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { stopPropagation } from '../../utils/keyboard';
import { AIAssistant } from './AIAssistant';

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
            <div onMouseDown={stopPropagation}>
              <AIAssistant />
            </div>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
    </Portal>
  );
}
