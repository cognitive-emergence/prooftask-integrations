FROM node:24-alpine
WORKDIR /app
COPY remote/package.json remote/package-lock.json ./remote/
RUN cd remote && npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY remote/server.mjs ./remote/server.mjs
COPY mcp/agent-mcp.mjs mcp/agent-mcp-tools.json ./mcp/
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
USER node
EXPOSE 8080
CMD ["node","remote/server.mjs"]
