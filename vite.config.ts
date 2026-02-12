import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Note: If you deploy to GitHub Pages as https://<user>.github.io/<repo>/,
// set base to "/<repo>/".
// export default defineConfig({ base: "/<repo>/", plugins: [react()] });

export default defineConfig({
  base:"/Mao-manager/",
  plugins: [react()],
});
