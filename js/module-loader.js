// ============================================
// MODULE LOADER - Module Registration Queue
// ============================================
// This file must be loaded BEFORE any modules

// Module registration queue for modules loaded before app
window.moduleQueue = window.moduleQueue || [];

// Helper function for modules to register themselves
window.registerModuleWhenReady = function (name, module) {
    console.log(`📦 Module "${name}" requesting registration...`);
    if (window.app && window.app.registerModule) {
        // App already exists, register immediately
        window.app.registerModule(name, module);
        console.log(`✅ Module "${name}" registered immediately`);
    } else {
        // App doesn't exist yet, add to queue
        window.moduleQueue.push({ name, module });
        console.log(`⏳ Module "${name}" added to queue`);
    }
};

console.log('✅ Module loader ready');
