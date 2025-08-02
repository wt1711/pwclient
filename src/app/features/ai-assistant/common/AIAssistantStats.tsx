import React, { useEffect, useState } from 'react';
import { Box, Text } from 'folds';
import PropTypes from 'prop-types';
import { getGirlTypes } from '../data';

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
      <Text size="T200" style={{ color: 'var(--tc-surface-low)', whiteSpace: 'nowrap' }}>
        {label}
      </Text>
      <Text
        size="T400"
        style={{ color: valueColor, fontWeight: 'var(--fw-medium)', whiteSpace: 'nowrap' }}
      >
        {value}
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
        padding: '4px 8px',
        borderRadius: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      }}
    >
      <Text size="T200" style={{ color: 'var(--tc-surface-normal)', whiteSpace: 'nowrap' }}>
        {label}
      </Text>
    </Box>
  );
}

Tag.propTypes = {
  label: PropTypes.string.isRequired,
};

export function AIAssistantStats() {
  const [girlTypes, setGirlTypes] = useState<string[]>([]);
  const stats = [
    {
      label: 'Hợp nhau',
      value: '95%',
      valueColor: '#D97706',
      backgroundColor: 'rgba(217, 119, 6, 0.1)',
    },
    {
      label: 'Sức nóng câu chuyện',
      value: '🔥 KHÁ NÓNG',
      valueColor: '#DB2777',
      backgroundColor: 'rgba(219, 39, 119, 0.1)',
    },
  ];

  useEffect(() => {
    setGirlTypes(getGirlTypes());
  }, []);

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
      <Box direction="Row" gap="100" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {girlTypes.map((type) => (
          <Tag key={type} label={type} />
        ))}
      </Box>
    </Box>
  );
}
