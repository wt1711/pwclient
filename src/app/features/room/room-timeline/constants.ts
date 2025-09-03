import { EventTimeline } from 'matrix-js-sdk';
import { ItemRange } from '~/app/hooks/useVirtualPaginator';

export const PAGINATION_LIMIT = 80;

export type Timeline = {
  linkedTimelines: EventTimeline[];
  range: ItemRange;
};
