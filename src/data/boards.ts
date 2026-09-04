import { BoardInfo } from '../types';

export const POPULAR_BOARDS: BoardInfo[] = [
  {
    id: 'dedede',
    name: 'Intel Jasper Lake (dedede)',
    cpu: 'Intel Celeron N4500 / N5100 / Pentium N6000',
    arch: 'x86_64 (amd64)',
    popularDevices: [
      'HP Chromebook x360 11 G4 EE',
      'Acer Chromebook Spin 511 (R753T) / 512',
      'Lenovo 500e / 300e / 100e Chromebook Gen 3',
      'Asus Chromebook CR1100 / CX1',
      'Dell Chromebook 3100 / 3110'
    ],
    wpType: 'cr50_ccd',
    recommendedBiosPayload: 'depthcharge'
  },
  {
    id: 'octopus',
    name: 'Intel Gemini Lake (octopus)',
    cpu: 'Intel Celeron N4000 / N4020 / N4100 / N4120',
    arch: 'x86_64 (amd64)',
    popularDevices: [
      'Lenovo 100e / 300e / 500e Gen 2',
      'HP Chromebook 14a / 11a',
      'Acer Chromebook Spin 311 (CP311)',
      'Samsung Chromebook 4 / 4+'
    ],
    wpType: 'cr50_ccd',
    recommendedBiosPayload: 'tianocore'
  },
  {
    id: 'hatch',
    name: 'Intel Comet Lake (hatch)',
    cpu: 'Intel Core i3/i5/i7 10th Gen',
    arch: 'x86_64 (amd64)',
    popularDevices: [
      'Acer Chromebook Spin 713',
      'HP Elite c1030 Chromebook',
      'Asus Chromebook Flip C436FA',
      'Samsung Galaxy Chromebook'
    ],
    wpType: 'cr50_ccd',
    recommendedBiosPayload: 'tianocore'
  },
  {
    id: 'brya',
    name: 'Intel Alder Lake (brya)',
    cpu: 'Intel Core 12th Gen',
    arch: 'x86_64 (amd64)',
    popularDevices: [
      'Acer Chromebook Spin 714',
      'HP Elite Dragonfly Chromebook',
      'Lenovo ThinkPad C14 Chromebook'
    ],
    wpType: 'cr50_ccd',
    recommendedBiosPayload: 'depthcharge'
  },
  {
    id: 'volteer',
    name: 'Intel Tiger Lake (volteer)',
    cpu: 'Intel Core 11th Gen',
    arch: 'x86_64 (amd64)',
    popularDevices: [
      'Acer Chromebook Spin 514',
      'HP Pro c640 G2 Chromebook',
      'Asus Chromebook Flip CX5'
    ],
    wpType: 'cr50_ccd',
    recommendedBiosPayload: 'tianocore'
  },
  {
    id: 'grunt',
    name: 'AMD Stoney Ridge (grunt)',
    cpu: 'AMD A4-9120C / A6-9220C',
    arch: 'x86_64 (amd64)',
    popularDevices: [
      'HP Chromebook 14-db',
      'Acer Chromebook 315 (AMD)',
      'Lenovo 14w'
    ],
    wpType: 'battery_disconnect',
    recommendedBiosPayload: 'tianocore'
  }
];
