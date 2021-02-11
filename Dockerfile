FROM node

# RUN cd /home/ \
    # git clone https://github.com/mbret/oboku-api.git

RUN git clone https://github.com/mbret/oboku-api.git
# RUN ls

WORKDIR /oboku-api

RUN npm install
# RUN npm run build-prod

# CMD [ "npm", "run start-prod" ]