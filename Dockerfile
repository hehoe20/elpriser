FROM node:20-alpine

WORKDIR /app

# Kopiér package.json først
COPY package.json ./

# Installér afhængigheder (bruger npm install i stedet for npm ci, så den ikke fejler ved manglende lock-fil)
RUN npm install

# Kopiér resten af kildekoden
COPY server.js ./
COPY public/ ./public/

EXPOSE 3000

CMD ["node", "server.js"]