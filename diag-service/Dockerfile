FROM node:14.15.5-stretch-slim

WORKDIR /usr/app

COPY index.js package*.json ./

RUN npm install && \
    npm cache clean --force --loglevel=error && \
    mkdir /usr/app/diags && \
    chown node:node -R /usr/app/

USER node
EXPOSE 8000

CMD ["/usr/local/bin/node", "index.js"]