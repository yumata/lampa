FROM httpd:alpine3.15
ARG domain
RUN test -n "$domain" || (echo "ERROR: domain is not set" && false)
COPY . /usr/local/apache2/htdocs/
RUN sed -i "s/{domain}/$domain/g" /usr/local/apache2/htdocs/msx/start.json
RUN sed -i "s/Listen 80/Listen 888/g" /usr/local/apache2/conf/httpd.conf

