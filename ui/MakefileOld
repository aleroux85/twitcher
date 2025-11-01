# Targets
OUTPUT := dist/index.html
TEMPLATE := template.html
HEAD := head.html
BODY := body.html
CSS := $(wildcard styles/*.css)
JS := $(wildcard scripts/*.js)

DEV_CSS := dist/combined.dev.css
DEV_JS := dist/combined.dev.js
PROD_CSS := dist/combined.min.css
PROD_JS := dist/combined.min.js

.PHONY: all dev test prod clean

all: prod

dev: $(DEV_CSS) $(DEV_JS)
	mkdir -p dist
	sed \
		-e "/{{head}}/ {r $(HEAD)" -e "d}" \
		-e "/{{body}}/ {r $(BODY)" -e "d}" \
		-e "/{{style}}/ {r $(DEV_CSS)" -e "d}" \
		-e "/{{script}}/ {a\\        const dev = true;" -e "r $(DEV_JS)" -e "d}" \
		$(TEMPLATE) > $(OUTPUT)
	@echo "Built development version → $(OUTPUT)"

test: $(DEV_CSS) $(DEV_JS)
	mkdir -p dist
	sed \
		-e "/{{head}}/ {r $(HEAD)" -e "d}" \
		-e "/{{body}}/ {r $(BODY)" -e "d}" \
		-e "/{{style}}/ {r $(DEV_CSS)" -e "d}" \
		-e "/{{script}}/ {a\\        const dev = false;" -e "r $(DEV_JS)" -e "d}" \
		$(TEMPLATE) > $(OUTPUT)
	@echo "Built test version → $(OUTPUT)"

prod: $(PROD_CSS) $(PROD_JS)
	mkdir -p dist
	sed \
		-e "/{{head}}/ {r $(HEAD)" -e "d}" \
		-e "/{{body}}/ {r $(BODY)" -e "d}" \
		-e "/{{style}}/ {r $(PROD_CSS)" -e "d}" \
		-e "/{{script}}/ {a\\const dev = false;" -e "r $(PROD_JS)" -e "d}" \
		$(TEMPLATE) | tr -d '\n' | sed 's/>[[:space:]]*</></g' > $(OUTPUT)
	@echo "Built production version → $(OUTPUT)"

$(DEV_CSS): $(CSS)
	mkdir -p dist
	cat $^ > $@

$(DEV_JS): $(JS)
	mkdir -p dist
	cat $^ > $@

$(PROD_CSS): $(CSS)
	mkdir -p dist
	cat $^ | sed 's:/\*.*\*/::g' | tr -s ' \n\t' ' ' > $@

$(PROD_JS): $(JS)
	mkdir -p dist
	cat $^ | sed 's://.*::g' | tr -s ' \n\t' ' ' > $@

clean:
	rm -rf dist
