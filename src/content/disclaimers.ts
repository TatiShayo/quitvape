/** Compliance copy + quit-support hotlines (BUILD_PROMPT feature 14). Region-aware. */

export const NOT_MEDICAL_ADVICE =
  'QuitVape offers motivational support and is not medical advice. It is not a substitute for professional healthcare. If you have health concerns, talk to a doctor.';

export const AGE_GATE_TITLE = 'Are you 18 or older?';
export const AGE_GATE_BODY =
  'QuitVape is intended for adults working to quit nicotine vaping. You must be 18+ to continue.';

export interface Hotline {
  region: string;
  name: string;
  phone: string;
  /** tel: URL for one-tap dialing. */
  tel: string;
  url?: string;
}

/** Default first entry is the US line; expand the list as regions are added. */
export const QUIT_HOTLINES: Hotline[] = [
  {
    region: 'US',
    name: 'National Quitline',
    phone: '1-800-QUIT-NOW',
    tel: 'tel:18007848669',
    url: 'https://www.cdc.gov/tobacco/quit_smoking/',
  },
  {
    region: 'UK',
    name: 'NHS Quit Smoking',
    phone: '0300 123 1044',
    tel: 'tel:03001231044',
    url: 'https://www.nhs.uk/better-health/quit-smoking/',
  },
  {
    region: 'AU',
    name: 'Quitline',
    phone: '13 7848',
    tel: 'tel:137848',
    url: 'https://www.quit.org.au/',
  },
];
