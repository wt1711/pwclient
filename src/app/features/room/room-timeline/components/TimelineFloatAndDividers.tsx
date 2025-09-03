import React from 'react';
import classNames from 'classnames';
import { Line, Box, as, ContainerColor, Badge, color, Text } from 'folds';
import * as css from '../RoomTimeline.css';
import { MessageBase } from '../../../../components/message';
import { today, yesterday, timeDayMonthYear } from '../../../../utils/time';
import { useRoomTimelineContext } from '../RoomTimelineContext';

export const TimelineFloat = as<'div', css.TimelineFloatVariants>(
  ({ position, className, ...props }, ref) => (
    <Box
      className={classNames(css.TimelineFloat({ position }), className)}
      justifyContent="Center"
      alignItems="Center"
      gap="200"
      {...props}
      ref={ref}
    />
  )
);

export const TimelineDivider = as<'div', { variant?: ContainerColor | 'Inherit' }>(
  ({ variant, children, ...props }, ref) => (
    <Box gap="100" justifyContent="Center" alignItems="Center" {...props} ref={ref}>
      <Line style={{ flexGrow: 1 }} variant={variant} size="300" />
      {children}
      <Line style={{ flexGrow: 1 }} variant={variant} size="300" />
    </Box>
  )
);

export function NewMessagesDivider() {
  const { messageSpacing } = useRoomTimelineContext();
  return (
    <MessageBase space={messageSpacing}>
      <TimelineDivider style={{ color: color.Success.Main }} variant="Inherit">
        <Badge as="span" size="500" variant="Success" fill="Solid" radii="300">
          <Text size="L400">New Messages</Text>
        </Badge>
      </TimelineDivider>
    </MessageBase>
  );
}

interface DayDividerProps {
  ts: number;
}
export function DayDivider({ ts }: DayDividerProps) {
  const { messageSpacing } = useRoomTimelineContext();
  return (
    <MessageBase space={messageSpacing}>
      <TimelineDivider variant="Surface">
        <Badge as="span" size="500" variant="Secondary" fill="None" radii="300">
          <Text size="L400">
            {(() => {
              if (today(ts)) return 'Today';
              if (yesterday(ts)) return 'Yesterday';
              return timeDayMonthYear(ts);
            })()}
          </Text>
        </Badge>
      </TimelineDivider>
    </MessageBase>
  );
}
