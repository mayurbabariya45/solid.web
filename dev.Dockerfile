# base image
FROM node:8 as builder

# set working directory
WORKDIR /opt/app

# install and cache app dependencies
COPY package.json ./
RUN npm install --silent

COPY . .

# start app
CMD [ "npm", "start" ]