import { WorkshopData } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMj7aWBa0ZliztgL2CU_jpYr6yA-um5-LzREMlTa79ebQq3ToPoIsBhwlINfXZM_t2/exec';

export const saveToGoogleSheets = async (data: WorkshopData): Promise<boolean> => {
  try {
    // Note: To avoid CORS issues with simple GAS deployments, we often use 'no-cors' 
    // or send as a form. However, 'no-cors' prevents reading the response.
    // For this demo, we assume the GAS is set up to handle CORS or we accept opaque response.
    
    // Structure the data for the sheet
    const payload = JSON.stringify(data);
    
    // Using fetch with no-cors to at least trigger the script execution
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    // Since we used no-cors, we can't verify success via response code, 
    // but we assume success if no network error occurred.
    return true;
  } catch (error) {
    console.error("Failed to save to Google Sheets", error);
    return false;
  }
};