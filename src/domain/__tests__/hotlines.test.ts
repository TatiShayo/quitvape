import { Hotline, regionFromLocale, selectHotlineForRegion } from '../hotlines';

const HOTLINES: Hotline[] = [
  { region: 'US', name: 'National Quitline', phone: '1-800-QUIT-NOW', tel: 'tel:18007848669' },
  { region: 'GB', name: 'NHS Quit Smoking', phone: '0300 123 1044', tel: 'tel:03001231044' },
  { region: 'AU', name: 'Quitline', phone: '13 7848', tel: 'tel:137848' },
];

describe('selectHotlineForRegion', () => {
  it('defaults to the first entry (US) when region is undefined', () => {
    expect(selectHotlineForRegion(HOTLINES, undefined)).toBe(HOTLINES[0]);
  });

  it('defaults to the first entry (US) when region is unknown/not covered', () => {
    expect(selectHotlineForRegion(HOTLINES, 'ZZ')).toBe(HOTLINES[0]);
  });

  it('matches a covered region case-insensitively', () => {
    expect(selectHotlineForRegion(HOTLINES, 'gb')).toBe(HOTLINES[1]);
    expect(selectHotlineForRegion(HOTLINES, 'AU')).toBe(HOTLINES[2]);
  });
});

describe('regionFromLocale', () => {
  it('extracts the region from a standard BCP-47 tag', () => {
    expect(regionFromLocale('en-US')).toBe('US');
    expect(regionFromLocale('en-GB')).toBe('GB');
    expect(regionFromLocale('fr-CA')).toBe('CA');
  });

  it('extracts the region when a script subtag is present', () => {
    expect(regionFromLocale('zh-Hans-CN')).toBe('CN');
  });

  it('returns undefined for language-only tags or missing input', () => {
    expect(regionFromLocale('en')).toBeUndefined();
    expect(regionFromLocale(undefined)).toBeUndefined();
  });
});
