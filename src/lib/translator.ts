// Simple translation service using Google Translate API
export async function translateText(text: string, targetLanguage: string = 'ml'): Promise<string> {
  try {
    // Using the Google Translate API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Extract the translated text from the response
    let translatedText = '';
    if (data && data[0]) {
      data[0].forEach((item: any) => {
        if (item[0]) {
          translatedText += item[0];
        }
      });
    }
    
    return translatedText || 'Translation failed';
  } catch (error) {
    console.error('Translation error:', error);
    return 'Translation failed';
  }
}