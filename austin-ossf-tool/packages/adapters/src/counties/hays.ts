import type { CountyAdapter, RawSourceRecord, NormalizedRecord } from '../core/types';

export class HaysCountyAdapter implements CountyAdapter {
  slug = 'hays-county';

  async fetchRecords(): Promise<RawSourceRecord[]> {
    return [];
  }

  async normalize(record: RawSourceRecord): Promise<NormalizedRecord | null> {
    return {
      recordType: 'unknown',
      title: 'Hays County raw record',
      property: {
        countyName: 'Hays'
      },
      metadata: record.payload
    };
  }
}
