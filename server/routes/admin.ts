import express, { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../middleware/errorHandler';

const router = express.Router();

// Mock admin settings for testing
router.get('/settings',
  asyncHandler(async (req: Request, res: Response) => {
    const mockSettings = {
      termsAndConditions: `
        <h2>Terms and Conditions</h2>
        <p>By checking in to this event, you agree to the following terms:</p>
        <ul>
          <li>You will follow all event guidelines and safety protocols</li>
          <li>You consent to having your attendance recorded</li>
          <li>You understand that participation is voluntary</li>
          <li>You agree to treat all participants with respect</li>
        </ul>
        <p>Thank you for participating in our event!</p>
      `,
      question1Options: [
        'Social Media',
        'Friend/Colleague',
        'Website',
        'Email Newsletter',
        'Other'
      ],
      question3Options1: [
        'Networking',
        'Learning',
        'Career Development',
        'Fun/Entertainment',
        'Other'
      ],
      question3Options2: [
        'Beginner',
        'Intermediate',
        'Advanced',
        'Expert'
      ]
    };

    sendSuccess(res, mockSettings);
  })
);

// Update admin settings
router.put('/settings',
  asyncHandler(async (req: Request, res: Response) => {
    const { termsAndConditions, question1Options, question3Options1, question3Options2 } = req.body;

    // For now, we'll just return the updated settings
    // In a real implementation, this would save to the database
    const updatedSettings = {
      termsAndConditions: termsAndConditions || `
        <h2>Terms and Conditions</h2>
        <p>By checking in to this event, you agree to the following terms:</p>
        <ul>
          <li>You will follow all event guidelines and safety protocols</li>
          <li>You consent to having your attendance recorded</li>
          <li>You understand that participation is voluntary</li>
          <li>You agree to treat all participants with respect</li>
        </ul>
        <p>Thank you for participating in our event!</p>
      `,
      question1Options: question1Options || [
        'Social Media',
        'Friend/Colleague',
        'Website',
        'Email Newsletter',
        'Other'
      ],
      question3Options1: question3Options1 || [
        'Networking',
        'Learning',
        'Career Development',
        'Fun/Entertainment',
        'Other'
      ],
      question3Options2: question3Options2 || [
        'Beginner',
        'Intermediate',
        'Advanced',
        'Expert'
      ]
    };

    sendSuccess(res, updatedSettings);
  })
);

// Reset admin settings to defaults
router.post('/settings/reset',
  asyncHandler(async (req: Request, res: Response) => {
    const defaultSettings = {
      termsAndConditions: `
        <h2>Terms and Conditions</h2>
        <p>By checking in to this event, you agree to the following terms:</p>
        <ul>
          <li>You will follow all event guidelines and safety protocols</li>
          <li>You consent to having your attendance recorded</li>
          <li>You understand that participation is voluntary</li>
          <li>You agree to treat all participants with respect</li>
        </ul>
        <p>Thank you for participating in our event!</p>
      `,
      question1Options: [
        'Social Media',
        'Friend/Colleague',
        'Website',
        'Email Newsletter',
        'Other'
      ],
      question3Options1: [
        'Networking',
        'Learning',
        'Career Development',
        'Fun/Entertainment',
        'Other'
      ],
      question3Options2: [
        'Beginner',
        'Intermediate',
        'Advanced',
        'Expert'
      ]
    };

    sendSuccess(res, { message: 'Settings reset to defaults successfully' });
  })
);

export default router;