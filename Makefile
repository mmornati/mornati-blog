SHELL := /bin/bash

HUGO_IMAGE := hugomods/hugo:0.164.0
COMPOSE := docker compose

.PHONY: help migrate clean build build-native serve down cloudinary flipboard

help:
	@echo "Targets:"
	@echo "  make migrate    - (re)run the P1 migration from _raw/blog-posts"
	@echo "  make clean      - remove generated content/images/public/build"
	@echo "  make build      - build the site into public/ (Hugo in docker)"
	@echo "  make serve      - build + serve at http://localhost:8080 (compose)"
	@echo "  make cloudinary - upload local images to Cloudinary + rewrite HTML"
	@echo "  make flipboard  - backfill blog posts into per-language Flipboard magazines"

migrate:
	python3 scripts/migrate.py --workers 24

clean:
	rm -rf public build
	rm -rf content/en/posts content/it/posts content/fr/posts
	rm -rf static/images

build:
	@mkdir -p public
	docker run --rm -v "$(shell pwd):/src" -w /src $(HUGO_IMAGE) hugo --minify --gc
	python3 scripts/generate_redirects.py
	@echo "Built OK -> public/"

serve:
	$(COMPOSE) up --build

down:
	$(COMPOSE) down

cloudinary:
	python3 scripts/cloudinary_sync.py

flipboard:
	python3 scripts/flipboard_sync.py --create-magazines