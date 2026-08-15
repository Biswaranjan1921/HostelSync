const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const featuresDir = path.join(srcDir, 'features');
const pagesDir = path.join(srcDir, 'pages');
const componentsDir = path.join(srcDir, 'components');

// 1. Create feature directories
const features = ['auth', 'dashboard', 'students', 'rooms', 'dining', 'support', 'gate'];
features.forEach(f => {
    const dir = path.join(featuresDir, f);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 2. Map files to features
const fileMap = {
    // Auth
    'Login.jsx': { type: 'page', feature: 'auth' },
    'OAuth2RedirectHandler.jsx': { type: 'page', feature: 'auth' },
    
    // Dashboard
    'Dashboard.jsx': { type: 'page', feature: 'dashboard' },
    'Profile.jsx': { type: 'page', feature: 'dashboard' },
    'AiAnalytics.jsx': { type: 'page', feature: 'dashboard' },
    
    // Students
    'Students.jsx': { type: 'page', feature: 'students' },
    'StudentForm.jsx': { type: 'component', feature: 'students' },
    'StudentQrModal.jsx': { type: 'component', feature: 'students' },
    
    // Rooms
    'Rooms.jsx': { type: 'page', feature: 'rooms' },
    'Hostels.jsx': { type: 'page', feature: 'rooms' },
    
    // Dining
    'Mess.jsx': { type: 'page', feature: 'dining' },
    'VerifyMeal.jsx': { type: 'page', feature: 'dining' },
    
    // Support
    'Complaints.jsx': { type: 'page', feature: 'support' },
    'Support.jsx': { type: 'page', feature: 'support' },
    'SecurityBackup.jsx': { type: 'page', feature: 'support' },
    
    // Gate
    'Leaves.jsx': { type: 'page', feature: 'gate' },
    'VisitorsAttendance.jsx': { type: 'page', feature: 'gate' },
    'CaretakerScanner.jsx': { type: 'page', feature: 'gate' }
};

// 3. Move files
Object.entries(fileMap).forEach(([filename, info]) => {
    const sourceDir = info.type === 'page' ? pagesDir : componentsDir;
    const sourcePath = path.join(sourceDir, filename);
    const destPath = path.join(featuresDir, info.feature, filename);
    
    if (fs.existsSync(sourcePath)) {
        fs.renameSync(sourcePath, destPath);
        console.log(`Moved ${filename} to ${info.feature}`);
    }
});

// 4. Update imports in App.jsx
const appPath = path.join(srcDir, 'App.jsx');
if (fs.existsSync(appPath)) {
    let appContent = fs.readFileSync(appPath, 'utf8');
    // Replace component imports
    appContent = appContent.replace(/import\s+(.*?)\s+from\s+['"]\.\/components\/(.*?)['"]/g, (match, p1, p2) => {
        const file = p2 + (p2.endsWith('.jsx') ? '' : '.jsx');
        if (fileMap[file]) return `import ${p1} from './features/${fileMap[file].feature}/${p2}'`;
        return match;
    });
    // Replace page imports
    appContent = appContent.replace(/import\s+(.*?)\s+from\s+['"]\.\/pages\/(.*?)['"]/g, (match, p1, p2) => {
        const file = p2 + (p2.endsWith('.jsx') ? '' : '.jsx');
        if (fileMap[file]) return `import ${p1} from './features/${fileMap[file].feature}/${p2}'`;
        return match;
    });
    fs.writeFileSync(appPath, appContent);
}

// 5. Update internal imports inside the moved files (e.g. '../api/client' -> '../../api/client')
function processDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // If the file was in /pages or /components, it was 1 level deep from src.
            // Now it's in /features/<feature>, which is 2 levels deep.
            // So any import starting with '../' should become '../../'
            let modified = false;
            
            // Fix API imports
            if (content.includes("from '../api/client'")) {
                content = content.replace(/from\s+['"]\.\.\/api\/client['"]/g, "from '../../api/client'");
                modified = true;
            }
            // Fix component imports from pages
            content = content.replace(/from\s+['"]\.\.\/components\/(.*?)['"]/g, (match, p1) => {
                modified = true;
                const compFile = p1 + (p1.endsWith('.jsx') ? '' : '.jsx');
                if (fileMap[compFile]) {
                    return `from '../../features/${fileMap[compFile].feature}/${p1}'`;
                }
                return `from '../../components/${p1}'`;
            });
            // Fix icons and other stuff if they relied on relative paths
            
            if (modified) fs.writeFileSync(fullPath, content);
        }
    });
}
processDirectory(featuresDir);

console.log("Frontend restructuring completed!");
