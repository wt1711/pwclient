import React, { useState } from 'react';
// import { useEffect, useState } from 'react';
import { Box, Text, Chip, PopOut, RectCords, Icon, Icons } from 'folds';
import PropTypes from 'prop-types';
// import { getDateTypes } from '../data';
// import { useRoom } from '../../../hooks/useRoom';
import dayjs from 'dayjs';
import FocusTrap from 'focus-trap-react';

import {
  stats as statsData,
  summary as summaryData,
  topics as topicsData,
  interactions as interactionsData,
  componentTexts,
} from '../data';
import { DatePicker } from '../../../components/time-date';
import Tabs from '../../../atoms/tabs/Tabs';
import Input from '../../../atoms/input/Input';
import Button from '../../../atoms/button/Button';
import { useAIAssistant } from '../AIAssistantContext';

const AnyButton = Button as any;

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
  const [activeTab, setActiveTab] = useState('summary');
  // const [girlTypes, setGirlTypes] = useState<string[]>([]);
  const { locale } = useAIAssistant();
  const stats = statsData[locale as keyof typeof statsData] || [];
  const summary = summaryData[locale as keyof typeof summaryData];
  const topics = topicsData[locale as keyof typeof topicsData] || [];
  const texts = componentTexts[locale as keyof typeof componentTexts];

  const [interactions, setInteractions] = useState(
    interactionsData[locale as keyof typeof interactionsData] || []
  );

  const [newNote, setNewNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(Date.now());
  const [datePickerCords, setDatePickerCords] = useState<RectCords>();

  const handleAddNote = () => {
    if (newNote.trim() === '') return;
    const newInteraction = {
      date: dayjs(selectedDate).format('YYYY-MM-DD'),
      note: newNote,
    };
    setInteractions([newInteraction, ...interactions]);
    setNewNote('');
  };

  const handleDatePicker: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const cords = e.currentTarget.getBoundingClientRect();
    setDatePickerCords(cords);
  };

  const handleTabSelect = (item: { id: string }) => {
    setActiveTab(item.id);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <>
            <Box
              style={{
                marginTop: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--bg-surface-border)',
                backgroundColor: 'var(--bg-surface-low)',
              }}
            >
              <Text size="B400" style={{ color: 'var(--tc-surface)' }}>
                {summary}
              </Text>
            </Box>
            <Box
              direction="Row"
              gap="100"
              style={{
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: '8px',
                padding: '12px',
              }}
            >
              {topics.map((topic: string) => (
                <Chip key={topic}>
                  <Text>{topic}</Text>
                </Chip>
              ))}
            </Box>
          </>
        );
      case 'interactions':
        return (
          <Box direction="Column" gap="200" style={{ marginTop: '8px', padding: '12px' }}>
            <Box direction="Column" style={{ maxHeight: '250px', overflowY: 'scroll' }}>
              {interactions.map((interaction: { note: string; date: string }) => (
                <Box
                  key={interaction.note}
                  direction="Column"
                  style={{ paddingRight: '8px', gap: '4px' }}
                >
                  <Text style={{ color: 'var(--tc-surface-low)', fontWeight: 'var(--fw-medium)' }}>
                    {interaction.date}
                  </Text>
                  <Text>{interaction.note}</Text>
                </Box>
              ))}
            </Box>
            <Box direction="Column" gap="100" style={{ marginTop: '12px' }}>
              <Input
                placeholder={texts.addNotePlaceholder}
                value={newNote}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNote(e.target.value)}
              />
              <Chip
                size="500"
                variant="Surface"
                fill="None"
                outlined
                radii="300"
                aria-pressed={!!datePickerCords}
                after={<Icon size="50" src={Icons.ChevronBottom} />}
                onClick={handleDatePicker}
              >
                <Text size="B300">{dayjs(selectedDate).format('DD MMM YYYY')}</Text>
              </Chip>
              <PopOut
                anchor={datePickerCords}
                offset={5}
                position="Bottom"
                align="Center"
                content={
                  <FocusTrap
                    focusTrapOptions={{
                      onDeactivate: () => setDatePickerCords(undefined),
                      clickOutsideDeactivates: true,
                    }}
                  >
                    <div>
                      <DatePicker
                        min={Date.now() - 31536000000}
                        max={Date.now()}
                        value={selectedDate}
                        onChange={setSelectedDate}
                      />
                    </div>
                  </FocusTrap>
                }
              />
              <AnyButton variant="primary" onClick={handleAddNote}>
                {texts.addNoteButton}
              </AnyButton>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box direction="Column" gap="200" style={{ padding: '8px 16px' }}>
      <Box direction="Row" gap="200" style={{ justifyContent: 'space-around' }}>
        {stats.map(
          (stat: { label: string; value: string; valueColor: string; backgroundColor: string }) => (
            <StatBox
              key={stat.label}
              label={stat.label}
              value={stat.value}
              valueColor={stat.valueColor}
              backgroundColor={stat.backgroundColor}
            />
          )
        )}
      </Box>
      <Tabs
        items={[
          { id: 'summary', text: texts.summaryTab },
          { id: 'interactions', text: texts.notesTab },
        ]}
        defaultSelected={0}
        onSelect={handleTabSelect}
      />
      {renderTabContent()}
      {/* <Box direction="Row" gap="100" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {girlTypes.map((type) => (
          <Tag key={type} label={type} />
        ))}
      </Box> */}
    </Box>
  );
}
