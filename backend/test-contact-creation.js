// Simple test to check contact creation validation
const testContact = {
  type: 'Lead',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '',
  company: '',
  jobTitle: '',
  priority: 'medium',
  leadSource: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  },
  tags: [],
  aiContext: {
    preferences: [],
    interests: [],
    painPoints: [],
    budget: {
      currency: 'USD'
    },
    spaceRequirements: []
  }
};

console.log('Test contact data:', JSON.stringify(testContact, null, 2));

// Test validation with Joi (you'd need to run this in the backend context)
console.log('This contact should pass validation');