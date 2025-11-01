include make/tpl.mk

test: ui/layout.html ui/dist/index.css ui/dist/index.js
	@mkdir -p ui/dist
	$(call compose,ui/layout.html,make/html.map,ui/dist/index.html)
# 	gzip -k -9 -f ui/dist/index.html
# 	xxd -i ui/dist/index.html.gz > ui_dist_index_html_gz.h
# 	cd build && cmake -DPICO_BOARD=pico2_w .. && $(MAKE)
	@echo "Built test version → ui/dist/index.html"

ui/dist/index.css: ui/layout.css ui/content/network.css ui/content/command.css
	@mkdir -p ui/dist
	$(call compose,ui/layout.css,make/css.map,ui/dist/index.css)
	@echo "Built test version → ui/dist/index.css"

ui/dist/index.js: ui/layout.js ui/content/network.js ui/content/command.js
	@mkdir -p ui/dist
	$(call compose,ui/layout.js,make/js.map,ui/dist/index.js)
	@echo "Built test version → ui/dist/index.js"

flash:
	cp build/twitcher.uf2 /media/anro/RP2350/twitcher.uf2 

clean:
	rm -rf ui/dist
