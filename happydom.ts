import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

// Additional setup for testing environment
global.Math.random = () => 0.5; // Make tests predictable by default