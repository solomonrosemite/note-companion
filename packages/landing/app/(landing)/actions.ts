'use server';

interface SubmitBetaRequestResult {
  success: boolean;
  message?: string;
}

export async function submitBetaRequest(email: string): Promise<SubmitBetaRequestResult> {
  if (!email || !email.includes('@')) {
    return {
      success: false,
      message: 'Please enter a valid email address'
    };
  }

  try {
    const response = await fetch('https://app.loops.so/api/newsletter-form/cll1aiw7700kimn0o0o4qtnwi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: 'Thank you for joining the beta waitlist!'
      };
    } else {
      return {
        success: false,
        message: 'Something went wrong. Please try again.'
      };
    }
  } catch (error) {
    console.error('Error submitting beta request:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.'
    };
  }
} 