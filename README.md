# Twitcher

## Build

Build UI

```bash
    cd ui
    make dev
    cd ..
    gzip -k -9 -f ui/dist/index.html && xxd -i ui/dist/index.html.gz > ui_dist_index_html_gz.h
```

cp twitcher.uf2 /media/anro/RP2350/twitcher.uf2
sudo screen /dev/ttyACM0 115200

.. && rm -rf build && mkdir build && cd build && cmake -DPICO_BOARD=pico2_w ..