#!/usr/bin/env node

// Test script for AI generation functionality
const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const testPrompts = [
  {
    name: 'Simple Button',
    prompt: 'Create a blue button that says Click Me',
    elementType: 'button'
  },
  {
    name: 'Hero Header',
    prompt: 'Make a large hero heading that says Welcome to Our Platform',
    elementType: 'header'
  },
  {
    name: 'Product Card',
    prompt: 'Design a product card with image, title, description, and price',
    elementType: 'card'
  },
  {
    name: 'Contact Form',
    prompt: 'Create a contact form with name, email, and message fields',
    elementType: 'form'
  },
  {
    name: 'No Element Type',
    prompt: 'Create a nice navigation menu with hover effects',
    elementType: undefined
  },
  {
    name: 'Complex Prompt',
    prompt: 'Create a modern pricing card with gradient background, rounded corners, shadow, title "Pro Plan", price "$29/month", feature list, and a subscribe button',
    elementType: 'card'
  }
];

async function testAIGeneration() {
  console.log('🧪 Testing AI Element Generation...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  let passCount = 0;
  let failCount = 0;

  for (const test of testPrompts) {
    try {
      console.log(`\n--- Testing: ${test.name} ---`);
      console.log(`Prompt: "${test.prompt}"`);
      console.log(`Element Type: ${test.elementType || 'auto-detect'}`);
      
      const startTime = Date.now();
      
      const response = await axios.post(`${BASE_URL}/api/generate-element`, {
        prompt: test.prompt,
        elementType: test.elementType
      }, {
        timeout: 30000 // 30 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        const result = response.data;
        console.log('✅ Success');
        console.log(`Response Time: ${responseTime}ms`);
        console.log(`Generated HTML: ${result.html.substring(0, 150)}...`);
        console.log(`Generated CSS: ${result.css.substring(0, 150)}...`);
        console.log(`Element Type: ${result.elementType}`);
        
        // Validate response structure
        if (result.html && result.css && result.elementType) {
          console.log('✅ Response structure valid');
          passCount++;
        } else {
          console.log('❌ Response structure invalid');
          failCount++;
        }
      } else {
        console.log(`❌ Failed with status: ${response.status}`);
        failCount++;
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.error || error.message);
      
      if (error.response?.status === 429) {
        console.log('⏰ Rate limited - waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      failCount++;
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=== Test Summary ===');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Success Rate: ${Math.round((passCount / (passCount + failCount)) * 100)}%`);
  
  if (passCount === testPrompts.length) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Check the logs above.');
    process.exit(1);
  }
}

async function testHealth() {
  console.log('🏥 Testing Health Endpoints...\n');
  
  try {
    // Test if the server is running
    const response = await axios.get(`${BASE_URL}`, { timeout: 5000 });
    console.log('✅ Main page accessible');
  } catch (error) {
    console.log('❌ Main page not accessible:', error.message);
    console.log('Make sure the development server is running with: npm run dev');
    process.exit(1);
  }
}

async function runAllTests() {
  await testHealth();
  await testAIGeneration();
}

// Check if OpenAI API key is configured
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
  console.log('⚠️  Warning: OpenAI API key not configured. Tests will use fallback templates.');
  console.log('Set OPENAI_API_KEY in your .env file for full AI testing.\n');
}

// Run tests
runAllTests().catch(console.error);