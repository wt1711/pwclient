import appDispatcher from '../dispatcher';
import cons from '../state/cons';

export function openSpaceAddExisting(roomId?: any, spaces = false) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_SPACE_ADDEXISTING,
    roomId,
    spaces,
  });
}

export function openCreateRoom(isSpace = false, parentId = null) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_CREATE_ROOM,
    isSpace,
    parentId,
  });
}

export function openJoinAlias(term?: any) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_JOIN_ALIAS,
    term,
  });
}

export function openInviteUser(roomId?: any, searchTerm?: any) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_INVITE_USER,
    roomId,
    searchTerm,
  });
}

export function openProfileViewer(userId?: any, roomId?: any) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_PROFILE_VIEWER,
    userId,
    roomId,
  });
}

export function openSearch(term?: any) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_SEARCH,
    term,
  });
}

export function openReusableContextMenu(
  placement?: any,
  cords?: any,
  render?: any,
  afterClose?: any
) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_REUSABLE_CONTEXT_MENU,
    placement,
    cords,
    render,
    afterClose,
  });
}

export function openReusableDialog(title?: any, render?: any, afterClose?: any) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_REUSABLE_DIALOG,
    title,
    render,
    afterClose,
  });
}
