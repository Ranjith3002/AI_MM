const axios = require('axios');
require('dotenv').config();

async function testGeminiAPI() {
    console.log('🧪 Testing Gemini AI API Connection...\n');
    
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyC8yBMwSj3ipoM03yWPNyLYDUMcsbLKN4k';
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');
    console.log('API URL:', apiUrl);
    console.log('');
    
    try {
        console.log('📡 Sending test request...');
        
        const response = await axios.post(
            `${apiUrl}?key=${apiKey}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: "Hello! Please respond with 'Gemini AI is working correctly' to confirm the connection."
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 100,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );
        
        if (response.data && response.data.candidates && response.data.candidates[0]) {
            const aiResponse = response.data.candidates[0].content.parts[0].text;
            console.log('✅ SUCCESS! Gemini AI Response:');
            console.log(aiResponse);
            console.log('\n🎉 API is working correctly!');
            return true;
        } else {
            console.log('❌ Invalid response format:');
            console.log(JSON.stringify(response.data, null, 2));
            return false;
        }
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
            
            if (error.response.status === 400) {
                console.log('\n💡 Possible solutions:');
                console.log('- Check if the API key is valid');
                console.log('- Verify the request format');
                console.log('- Make sure Gemini API is enabled in Google Cloud Console');
            } else if (error.response.status === 403) {
                console.log('\n💡 Possible solutions:');
                console.log('- API key might be invalid or expired');
                console.log('- Check API quotas and billing in Google Cloud Console');
                console.log('- Verify API permissions');
            } else if (error.response.status === 404) {
                console.log('\n💡 Possible solutions:');
                console.log('- Check if the model name is correct');
                console.log('- Try using "gemini-pro" instead of "gemini-1.5-flash-latest"');
            }
        } else if (error.code === 'ENOTFOUND') {
            console.log('\n💡 Network issue - check internet connection');
        }
        
        return false;
    }
}

// Alternative test with different model
async function testWithAlternativeModel() {
    console.log('\n🔄 Trying alternative model (gemini-pro)...');
    
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyAwIPGaUbMhqmTTNTKQEeI_buF2ehmXQ6k';
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    try {
        const response = await axios.post(
            `${apiUrl}?key=${apiKey}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: "Test message - please respond briefly."
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );
        
        if (response.data && response.data.candidates && response.data.candidates[0]) {
            const aiResponse = response.data.candidates[0].content.parts[0].text;
            console.log('✅ SUCCESS with gemini-pro!');
            console.log('Response:', aiResponse);
            return true;
        }
        
    } catch (error) {
        console.log('❌ Alternative model also failed:', error.message);
        return false;
    }
}

async function main() {
    const success = await testGeminiAPI();
    
    if (!success) {
        await testWithAlternativeModel();
    }
    
    console.log('\n📝 Next steps:');
    console.log('1. If API is working: Restart your server (npm start)');
    console.log('2. If API failed: Check your API key in Google AI Studio');
    console.log('3. Get a new API key: https://makersuite.google.com/app/apikey');
}

main().catch(console.error);
