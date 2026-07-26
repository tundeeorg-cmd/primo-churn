.PHONY: data features segment train evaluate explain recommend push deck web all

data:
	uv run python src/generate_data.py

features:
	uv run python src/features.py

segment:
	uv run python src/segment.py

train:
	uv run python src/model.py

evaluate:
	uv run python src/evaluate.py

explain:
	uv run python src/explain.py

recommend:
	uv run python src/recommend.py

push:
	uv run python src/push_to_supabase.py

deck:
	uv run python src/build_deck.py

web:
	cd web && npm run dev

all: data features segment train evaluate explain recommend push
