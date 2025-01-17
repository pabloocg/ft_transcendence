FROM ruby:2.6.3-alpine3.10

RUN apk add --update --no-cache \
    binutils-gold \
    build-base \
    curl \
    file \
    g++ \
    gcc \
    git \
    make \
    pkgconfig \
    postgresql-dev \
    yarn \
    nodejs \
    tzdata \
    imagemagick

WORKDIR /transcendence

RUN gem update --system
RUN gem install rails bundler
RUN gem install rails
RUN gem install rake
RUN gem install devise
#RUN gem install bundler 1.17.2
COPY ./srcs/myapp/Gemfile /transcendence/Gemfile
#COPY ./srcs/myapp/Gemfile.lock /transcendence/Gemfile.lock

#RUN bundle and dependencies install
RUN bundle install && bundle update --bundler
RUN yarn install
RUN rails webpacker:install

COPY ./srcs/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3000

# Start the main process.
ENTRYPOINT ["sh", "/entrypoint.sh"]
