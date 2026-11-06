// Settings for `npx remotion studio` / `press studio`. `press render` passes the same values through the Node API.
import { Config } from "@remotion/cli/config";
Config.setEntryPoint("remotion/index.ts");
Config.setPublicDir(".cache/public"); // `press audio` puts each episode's narration.wav here
Config.setVideoImageFormat("jpeg");
if (process.env.REMOTION_BROWSER_EXECUTABLE) Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
