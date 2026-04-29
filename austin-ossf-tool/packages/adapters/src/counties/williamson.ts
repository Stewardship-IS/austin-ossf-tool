import type { CountyAdapter, RawSourceRecord, NormalizedRecord } from '../core/types';

export class WilliamsonCountyAdapter implements CountyAdapter {
  slug = 'williamson-county';

  async fetchRecords(): Promise<RawSourceRecord[]> {
    return [];
  }

  async normalize(record: RawSourceRecord): Promise<NormalizedRecord | null> {
    return {
      recordType: 'unknown',
      title: 'Williamson County raw record',
      property: {
        countyName: 'Williamson'
      },
      metadata: record.payload
    };
  }
}
