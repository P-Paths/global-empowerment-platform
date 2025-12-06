/**
 * Spell Checker Utility
 * Corrects common misspellings in user input
 */

// Common misspellings dictionary - expandable
const SPELLING_CORRECTIONS: Record<string, string> = {
  // Keys variations
  'kyes': 'keys', 'keis': 'keys', 'kees': 'keys', 'keyes': 'keys', 'jeys': 'keys',
  // Numbers
  'teo': 'two', 'tow': 'two', 'thre': 'three', 'for': 'four', 'fiv': 'five',
  // Common phrases
  'sets of kyes': 'sets of keys', 'sets of keis': 'sets of keys', 'sets of kees': 'sets of keys',
  'sets of jeys': 'sets of keys', 'two sets of jeys': 'two sets of keys',
  'teo sets': 'two sets', 'tow sets': 'two sets',
  // Automotive terms
  'replased': 'replaced', 'replaed': 'replaced', 'replced': 'replaced', 'replcaed': 'replaced',
  'transmition': 'transmission',
  'condtion': 'condition', 'conditon': 'condition', 'conditio': 'condition',
  'maintainance': 'maintenance', 'maintanance': 'maintenance',
  'excellant': 'excellent', 'excelent': 'excellent',
  'interiour': 'interior', 'exteriour': 'exterior',
  'brakes': 'brakes', 'braks': 'brakes', 'breaks': 'brakes',
  'tires': 'tires', 'tyres': 'tires',
  'mileage': 'mileage', 'milage': 'mileage',
  'engine': 'engine', 'engin': 'engine',
  'transmission': 'transmission', 'transmision': 'transmission',
  'sunroof': 'sunroof', 'sun roof': 'sunroof', 'sun-roof': 'sunroof',
  'leather': 'leather', 'lether': 'leather',
  'heated': 'heated', 'heatted': 'heated',
  'navigation': 'navigation', 'navagation': 'navigation',
  'bluetooth': 'bluetooth', 'blutooth': 'bluetooth',
  'camera': 'camera', 'camra': 'camera',
  'touchscreen': 'touchscreen', 'touch screen': 'touchscreen',
};

/**
 * Correct spelling in text
 * @param text - Text to correct
 * @returns Corrected text
 */
export function correctSpelling(text: string): string {
  if (!text) return text;
  
  let corrected = text;
  
  // Apply corrections (case-insensitive, word boundaries)
  Object.entries(SPELLING_CORRECTIONS).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    corrected = corrected.replace(regex, (match) => {
      // Preserve original case
      if (match === match.toUpperCase()) return correct.toUpperCase();
      if (match[0] === match[0].toUpperCase()) {
        return correct.charAt(0).toUpperCase() + correct.slice(1);
      }
      return correct;
    });
  });
  
  return corrected;
}

/**
 * Add custom spelling correction
 * @param wrong - Misspelled word
 * @param correct - Correct spelling
 */
export function addSpellingCorrection(wrong: string, correct: string): void {
  SPELLING_CORRECTIONS[wrong.toLowerCase()] = correct.toLowerCase();
}


