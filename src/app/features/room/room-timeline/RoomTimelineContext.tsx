import { EventTimeline, Room } from 'matrix-js-sdk';

export const getLiveTimeline = (room: Room): EventTimeline =>
  room.getUnfilteredTimelineSet().getLiveTimeline();
