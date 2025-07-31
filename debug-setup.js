// Debug script to check the setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging AI Suggested POs Setup...\n');

// Check if all required files exist
const requiredFiles = [
    'app/po-ui/webapp/controller/SuggestedPOs.controller.js',
    'app/po-ui/webapp/view/SuggestedPOs.view.xml',
    'app/po-ui/webapp/manifest.json',
    'srv/material-service.js',
    'srv/ai-service.js'
];

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check manifest.json for routing
console.log('\n🗺️  Checking routing configuration:');
try {
    const manifest = JSON.parse(fs.readFileSync('app/po-ui/webapp/manifest.json', 'utf8'));
    const routes = manifest['sap.ui5'].routing.routes;
    const targets = manifest['sap.ui5'].routing.targets;
    
    const suggestedPORoute = routes.find(r => r.name === 'RouteSuggestedPOs');
    const suggestedPOTarget = targets['TargetSuggestedPOs'];
    
    console.log(`   Route exists: ${suggestedPORoute ? '✅' : '❌'}`);
    console.log(`   Target exists: ${suggestedPOTarget ? '✅' : '❌'}`);
    
    if (suggestedPORoute) {
        console.log(`   Route pattern: ${suggestedPORoute.pattern}`);
    }
    if (suggestedPOTarget) {
        console.log(`   Target view: ${suggestedPOTarget.viewName}`);
    }
} catch (error) {
    console.log(`   ❌ Error reading manifest.json: ${error.message}`);
}

// Check Main controller for navigation method
console.log('\n🎮 Checking Main controller:');
try {
    const mainController = fs.readFileSync('app/po-ui/webapp/controller/Main.controller.js', 'utf8');
    const hasNavigationMethod = mainController.includes('onNavigateToSuggestedPOs');
    console.log(`   Navigation method exists: ${hasNavigationMethod ? '✅' : '❌'}`);
} catch (error) {
    console.log(`   ❌ Error reading Main controller: ${error.message}`);
}

// Check Main view for button
console.log('\n🔘 Checking Main view:');
try {
    const mainView = fs.readFileSync('app/po-ui/webapp/view/Main.view.xml', 'utf8');
    const hasButton = mainView.includes('Suggested POs') && mainView.includes('onNavigateToSuggestedPOs');
    console.log(`   Button exists: ${hasButton ? '✅' : '❌'}`);
} catch (error) {
    console.log(`   ❌ Error reading Main view: ${error.message}`);
}

// Check service definition
console.log('\n🔧 Checking service definition:');
try {
    const serviceDef = fs.readFileSync('srv/material-service.cds', 'utf8');
    const hasFunction = serviceDef.includes('getPOSuggestions');
    console.log(`   getPOSuggestions function defined: ${hasFunction ? '✅' : '❌'}`);
} catch (error) {
    console.log(`   ❌ Error reading service definition: ${error.message}`);
}

// Check service implementation
console.log('\n⚙️  Checking service implementation:');
try {
    const serviceImpl = fs.readFileSync('srv/material-service.js', 'utf8');
    const hasImplementation = serviceImpl.includes("this.on('getPOSuggestions'");
    console.log(`   getPOSuggestions implementation exists: ${hasImplementation ? '✅' : '❌'}`);
} catch (error) {
    console.log(`   ❌ Error reading service implementation: ${error.message}`);
}

console.log('\n🚀 Next steps:');
console.log('1. Run "npm start" to start the server');
console.log('2. Open browser to http://localhost:4004/app/po-ui/webapp/');
console.log('3. Check browser console (F12) for any errors');
console.log('4. Try clicking the "Suggested POs" button');
console.log('5. If it fails, check the console for specific error messages');

console.log('\n📝 Manual test URLs:');
console.log('- Main app: http://localhost:4004/app/po-ui/webapp/');
console.log('- Direct route: http://localhost:4004/app/po-ui/webapp/#/suggested-pos');
console.log('- API endpoint: http://localhost:4004/odata/v4/material/getPOSuggestions()');
console.log('- Test page: http://localhost:4004/app/po-ui/webapp/test-navigation.html');
