import pandas as pd
import joblib
from sklearn.preprocessing import MinMaxScaler, StandardScaler, OneHotEncoder
from category_encoders.count import CountEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from data_cleaning import data_for_content_filtering
from content_based_filtering import save_transformed_data

# path of filtered data
filtered_data_path = "data/collab_filtered_data.csv"

# save path
save_path = "data/transformed_hybrid_data.npz"

# separate transformer for the hybrid pipeline
hybrid_transformer_path = "hybrid_transformer.joblib"

# ── Hybrid-specific column config ──────────────────────────────────────
# artist is EXCLUDED from OHE because:
#  - With 6,207 unique artists, OHE creates 6,207 sparse columns
#  - Each song has exactly 1 non-zero in its artist column
#  - This drowns out the 12 meaningful audio features
#  - Cosine similarity collapses to ~1.0 for ALL song pairs
#  - The collaborative signal already captures artist-listener relationships
ohe_cols = ['time_signature', 'key']
# artist is frequency-encoded (captures popularity as a single dense column)
frequency_encode_cols = ['artist']
tfidf_col = 'tags'
# year is added here — previously it was passed through as raw 1965-2019 values
# which dominated cosine similarity (magnitude ~2000 vs ~0.5 for other features)
standard_scale_cols = ["duration_ms", "loudness", "tempo", "year"]
min_max_scale_cols = [
    'danceability',
    'energy',
    'speechiness',
    'acousticness',
    'instrumentalness',
    'liveness',
    'valence',
    'mode'  # binary 0/1, was in remainder='passthrough' before
]


def build_hybrid_transformer():
    """Build a ColumnTransformer optimized for the hybrid pipeline."""
    return ColumnTransformer(transformers=[
        (
            "frequency_encode",
            CountEncoder(normalize=True, return_df=True),
            frequency_encode_cols
        ),
        (
            "ohe",
            OneHotEncoder(handle_unknown="ignore"),
            ohe_cols
        ),
        (
            "tfidf",
            TfidfVectorizer(max_features=85),
            tfidf_col
        ),
        (
            "standard_scale",
            StandardScaler(),
            standard_scale_cols
        ),
        (
            "min_max_scale",
            MinMaxScaler(),
            min_max_scale_cols
        )
    ], remainder='drop', n_jobs=-1)  # drop prevents raw unscaled features from leaking


def main(data_path, save_path):

    # load the filtered data
    filtered_data = pd.read_csv(data_path)

    # clean the data (drops track_id, name, spotify_preview_url)
    filtered_data_cleaned = data_for_content_filtering(
        filtered_data
    )

    # build and train the hybrid-specific transformer
    transformer = build_hybrid_transformer()
    transformer.fit(filtered_data_cleaned)
    joblib.dump(transformer, hybrid_transformer_path)

    # transform using the newly trained transformer
    transformed_data = transformer.transform(filtered_data_cleaned)

    # save the transformed data
    save_transformed_data(
        transformed_data,
        save_path
    )

if __name__ == "__main__":
    main(filtered_data_path, save_path)
