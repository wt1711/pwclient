import React from 'react';
// import { useEffect, useState } from 'react';
import { Box, Text } from 'folds';
import PropTypes from 'prop-types';
// import { getDateTypes } from '../data';
// import { useRoom } from '../../../hooks/useRoom';
import { useAIAssistant } from '../AIAssistantContext';

interface StatBoxProps {
  label: string;
  value: string;
  valueColor: string;
  backgroundColor: string;
}

function StatBox({ label, value, valueColor, backgroundColor }: StatBoxProps) {
  return (
    <Box
      grow="Yes"
      direction="Column"
      alignItems="Center"
      justifyContent="Center"
      style={{
        padding: '8px 12px',
        borderRadius: '12px',
        backgroundColor,
        textAlign: 'center',
        flex: 1,
      }}
    >
      <Text
        size="T400"
        style={{ color: valueColor, fontWeight: 'var(--fw-medium)', whiteSpace: 'nowrap' }}
      >
        {value}
      </Text>
      <Text size="T200" style={{ color: 'var(--tc-surface-low)', whiteSpace: 'nowrap' }}>
        {label}
      </Text>
    </Box>
  );
}

StatBox.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  valueColor: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string.isRequired,
};

interface TagProps {
  label: string;
}

function Tag({ label }: TagProps) {
  return (
    <Box
      style={{
        padding: '8px 12px',
        borderRadius: '20%',
        backgroundColor: 'var(--bg-surface-active)',
      }}
    >
      <Text
        size="T200"
        style={{ color: 'var(--tc-positive-normal)', fontWeight: '600', whiteSpace: 'nowrap' }}
      >
        {label}
      </Text>
    </Box>
  );
}

Tag.propTypes = {
  label: PropTypes.string.isRequired,
};

export function AIAssistantStats() {
  // const [girlTypes, setGirlTypes] = useState<string[]>([]);
  const { locale } = useAIAssistant();
  const stats =
    {
      VI: [
        {
          label: 'Phù hợp',
          value: '95%',
          valueColor: 'var(--tc-caution-high)',
          backgroundColor: 'var(--bg-caution-active)',
        },
        {
          label: 'Sức nóng',
          value: '🌡️ 70',
          valueColor: 'var(--tc-danger-high)',
          backgroundColor: 'var(--bg-caution-active)',
        },
      ],
      EN: [
        {
          label: 'Match',
          value: '95%',
          valueColor: 'var(--tc-caution-high)',
          backgroundColor: 'var(--bg-caution-active)',
        },
        {
          label: 'Heat',
          value: '🌡️ 70',
          valueColor: 'var(--tc-danger-high)',
          backgroundColor: 'var(--bg-caution-active)',
        },
      ],
    }[locale] || [];
  // const room = useRoom();
  // const roomID = room.roomId || 'default';

  // useEffect(() => {
  //   setGirlTypes(getDateTypes(roomID, locale));
  // }, [roomID, locale]);

  return (
    <Box direction="Column" gap="200" style={{ padding: '8px 16px' }}>
      <Box direction="Row" gap="200" style={{ justifyContent: 'space-around' }}>
        {stats.map((stat) => (
          <StatBox
            key={stat.label}
            label={stat.label}
            value={stat.value}
            valueColor={stat.valueColor}
            backgroundColor={stat.backgroundColor}
          />
        ))}
      </Box>
      {/* <Box direction="Row" gap="100" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {girlTypes.map((type) => (
          <Tag key={type} label={type} />
        ))}
      </Box> */}
    </Box>
  );
}
