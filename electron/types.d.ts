type EventPayloadMapping = {
  getStaticData: GetStaticDataResult;
  sendFrameAction: 'CLOSE' | 'MAXIMIZE' | 'MINIMIZE';
  onNewCpuData: CpuData;
};

type GetStaticDataResult = {
  platform: NodeJS.Platform;
  totalMemory: number;
}; 