/**
 * Captures a ShareCard ref to an image and opens the native share sheet
 * (BUILD_PROMPT feature 8/13: achievement + weekly-report share cards). Fires the
 * `share_card_exported` analytics event with only a card-type label (no health data).
 */
import { RefObject, useCallback, useState } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { AnalyticsEvent, getAnalytics, getErrors } from '@/providers';

export function useShareCard(cardRef: RefObject<View | null>, cardType: string) {
  const [sharing, setSharing] = useState(false);

  const share = useCallback(async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your progress' });
      }
      getAnalytics().capture(AnalyticsEvent.shareCardExported, { card_type: cardType });
    } catch (e) {
      getErrors().captureException(e, { where: 'useShareCard.share', cardType });
    } finally {
      setSharing(false);
    }
  }, [cardRef, cardType]);

  return { share, sharing };
}
