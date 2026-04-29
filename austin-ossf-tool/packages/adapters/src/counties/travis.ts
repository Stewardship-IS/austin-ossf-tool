import type { CountyAdapter, RawSourceRecord, NormalizedRecord } from '../core/types';

export class TravisCountyAdapter implements CountyAdapter {
  slug = 'travis-county';

  async fetchRecords(): Promise<RawSourceRecord[]> {
    return [];
  }

  async normalize(record: RawSourceRecord): Promise<NormalizedRecord | null> {
    return {
      recordType: 'unknown',
      title: 'Travis County raw record',
      property: {
        countyName: 'Travis'
      },
      metadata: record.payload
    };
  }
}
