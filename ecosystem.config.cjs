module.exports = {
  apps: [
    {
      name: "line-price-ai",
      cwd: "/apps/Line_price",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};