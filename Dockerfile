FROM node:23.11.0

ENV CI=true
ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.6.0 --activate

# canvas는 arm64 prebuild가 없어 소스 빌드된다 (스코어보드 PNG 렌더링용)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

# 의존성 먼저 (캐시 레이어)
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn install

# 코드 복사
COPY . .

CMD ["yarn", "start"]
