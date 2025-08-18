/**
 * Test script to verify API configuration works in production build
 */

const fs = require('fs');
const path = require('path');

// Read the built JavaScript files to check for localhost references
const distPath = path.join(__dirname, 'frontend', 'dist', 'assets');

console.log('🔍 Checking built files for localhost references...');

try {
  const files = fs.readdirSync(distPath);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  
  let localhostFound = false;
  
  for (const file of jsFiles) {
    const filePath = path.join(distPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for localhost references
    if (content.includes('localhost:8000')) {
      console.log(`❌ Found localhost:8000 reference in ${file}`);
      localhostFound = true;
      
      // Find the specific occurrences
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('localhost:8000')) {
          console.log(`   Line ${index + 1}: ${line.substring(Math.max(0, line.indexOf('localhost:8000') - 50), line.indexOf('localhost:8000') + 100)}`);
        }
      });
    }
  }
  
  if (!localhostFound) {
    console.log('✅ No localhost:8000 references found in built files');
  }
  
  // Check for production environment detection
  const mainJsFile = jsFiles.find(file => file.includes('index-'));
  if (mainJsFile) {
    const mainContent = fs.readFileSync(path.join(distPath, mainJsFile), 'utf8');
    
    if (mainContent.includes('PRODUCTION MODE') || mainContent.includes('same-origin')) {
      console.log('✅ Production mode detection code found in build');
    } else {
      console.log('⚠️ Production mode detection code may have been minified');
    }
  }
  
} catch (error) {
  console.error('❌ Error checking build files:', error.message);
}

console.log('🔍 Build verification complete');