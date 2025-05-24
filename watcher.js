import { spawn } from "child_process";

let shouldRestart = true;

function start() {
  if (!shouldRestart) {
    console.log("Restart disabled, watcher stopped.");
    return;
  }

  const subprocess = spawn("node", ["index.js"], {
    stdio: ["inherit", "inherit", "inherit", "ipc"], // Enable IPC channel
  });

  subprocess.on("message", (msg) => {
    if (msg === "STOP_RESTART") {
      console.log("Received STOP_RESTART message. Stopping watcher...");
      shouldRestart = false;
      subprocess.kill();
    }
  });

  subprocess.on("close", (code) => {
    if (shouldRestart) {
      console.log(`index.js exited with code ${code}. Restarting in 1 second...`);
      setTimeout(start, 1000);
    } else {
      console.log("Watcher stopped, no restart.");
    }
  });

  subprocess.on("error", (err) => {
    console.error("Failed to start subprocess:", err);
  });
}

start();
