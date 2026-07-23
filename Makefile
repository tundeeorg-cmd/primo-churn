.PHONY: setup data features train evaluate app all

setup:
	uv sync

data:
	uv run python src/generate_data.py

features:
	uv run python src/build_features.py

train:
	uv run python src/train_model.py

evaluate:
	uv run python src/evaluate_model.py

app:
	uv run streamlit run app.py

all: setup data features train evaluate
