OUTPUT := ui/dist/index.html
INPUT := ui/layout.html

test:
	mkdir -p ui/dist
	cat	$(INPUT) > $(OUTPUT)
	gzip -k -9 -f $(OUTPUT)
	xxd -i ui/dist/index.html.gz > ui_dist_index_html_gz.h
	cd build && cmake -DPICO_BOARD=pico2_w .. && $(MAKE)
	@echo "Built test version → $(OUTPUT)"

flash:
	cp build/twitcher.uf2 /media/anro/RP2350/twitcher.uf2 

clean:
	rm -rf ui/dist
