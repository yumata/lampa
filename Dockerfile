FROM httpd:alpine3.15
ARG domain="localhost"
ARG prefix="http://"
RUN test -n "$domain" || (echo "ERROR: domain is not set" && false)
COPY . /usr/local/apache2/htdocs/
RUN sed -i -e "s|{domain}|$domain|" -e "s|{PREFIX}|$prefix|" /usr/local/apache2/htdocs/msx/start.json