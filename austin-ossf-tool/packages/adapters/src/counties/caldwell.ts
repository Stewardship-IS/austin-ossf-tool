import type { CountyAdapter, RawSourceRecord, NormalizedRecord } from '../core/types';

export class CaldwellCountyAdapter implements CountyAdapter {
  slug = 'caldwell-county';

  async fetchRecords(): Promise<RawSourceRecord[]> {
    return [];
  }

  async normalize(record: RawSourceRecord): Promise<NormalizedRecord | null> {
    return {
      recordType: 'unknown',
      title: 'Caldwell County raw record',
      property: {
        countyName: 'Caldwell'
      },
      metadata: record.payload
    };
  }
}
