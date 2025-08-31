// src/backend/botLauncher.ts
import Docker from "dockerode";
import { URL } from "url";

// init Docker client
const docker = new Docker();

// launch Docker container to run mtg bot
export async function launchBotContainer(meetingUrl: string, jobId: string) {

   // ดึง path หลัง domain https://meet.google.com/
  let meetingCode = "";
  try {
    const urlObj = new URL(meetingUrl);
    if (urlObj.hostname !== "meet.google.com") {
      throw new Error("Invalid Google Meet URL");
    }
    // path จะเป็นรูปแบบ /gta-jxor-kjb
    meetingCode = urlObj.pathname.replace(/\//g, ""); // เอา slash ออกเหลือแค่โค้ด
  } catch (error) {
    throw new Error("Invalid URL format");
  }

  // ตั้งชื่อ container
  const containerName = `meetingbot-${meetingCode}`;

  const env = [
    `CONTAINER_NAME=${containerName}`,
    `MEETING_CODE=${meetingCode}`,
    `MEETING_URL=${meetingUrl}`,
    `JOB_ID=${jobId}`,
    `GOOGLE_ACCOUNT_USER=${process.env.GOOGLE_ACCOUNT_USER ?? ""}`,
    `GOOGLE_ACCOUNT_PASSWORD=${process.env.GOOGLE_ACCOUNT_PASSWORD ?? ""}`,
    `DATABASE_URL=${process.env.DATABASE_URL}`,
    `OPENAI_API_KEY=${process.env.OPENAI_API_KEY ?? ""}`,
  ];

  // create Docker container with bot image to run, env vars, run cmd
  const container = await docker.createContainer({
    Image: "meetingbot-bot",
    Env: env,
    Cmd: ["node", "dist/bot/index.js"],
    HostConfig: {
      // comment out autoremove for debugging, otherwise cleans after exit
      AutoRemove: true,
      // specifies Docker network to connect to
      NetworkMode: "meetingbot-net",
    },
    name: containerName,
  });

  await container.start();
  // attach to container logs and stream to curr process output
  const stream = await container.logs({
    follow: true,
    stdout: true,
    stderr: true,
  });
  stream.on("data", (chunk) => process.stdout.write(chunk));

  console.log(`Started bot container: ${containerName}`);
  return containerName;
}
