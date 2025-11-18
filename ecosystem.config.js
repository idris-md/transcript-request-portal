module.exports = {
  apps: [
  
    {
      name: "transcript-client",
      script: "node_modules/next/dist/bin/next",
      // cwd: "./client",
      args: "start -p 4047",
      watch: false,
      env: {
        NOD_ENV: "production", // define env variables here
      },
    },
  ],
};
