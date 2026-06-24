import numpy as np
import pandas as pd
from scipy.sparse import load_npz
from sklearn.metrics.pairwise import cosine_similarity
from fuzzy_search import resolve_song_row


class HybridRecommenderSystem:

    def __init__(
        self,
        song_name: str,
        artist_name: str,
        number_of_recommendations: int,
        weight_content_based: float,
        weight_collaborative: float,
        songs_data,
        transformed_matrix,
        interaction_matrix,
        track_ids
    ):

        self.number_of_recommendations = number_of_recommendations
        self.song_name = song_name.lower()
        self.artist_name = artist_name.lower()
        self.weight_content_based = weight_content_based
        self.weight_collaborative = weight_collaborative
        self.songs_data = songs_data
        self.transformed_matrix = transformed_matrix
        self.interaction_matrix = interaction_matrix
        self.track_ids = track_ids

    def _get_input_song_row(self):
        song_row, _ = resolve_song_row(
            song_name=self.song_name,
            songs_data=self.songs_data,
            artist_name=self.artist_name
        )

        if song_row is None:
            raise ValueError(
                f"Song '{self.song_name}' by '{self.artist_name}' was not found."
            )

        return song_row

    def _resolve_song_index(self, song_name, artist_name, songs_data):
        """Resolve a song to its DataFrame index using fuzzy search."""
        song_row, song_index = resolve_song_row(
            song_name=song_name,
            songs_data=songs_data,
            artist_name=artist_name
        )
        if song_row is None:
            raise ValueError(
                f"Song '{song_name}' by '{artist_name}' was not found."
            )
        return song_row, song_index

    def calculate_content_based_similarities(
        self,
        song_name,
        artist_name,
        songs_data,
        transformed_matrix
    ):
        # resolve the song using fuzzy search
        _, song_index = self._resolve_song_index(
            song_name, artist_name, songs_data
        )

        # generate the input vector
        input_vector = transformed_matrix[song_index].reshape(1, -1)

        # calculate similarity scores
        content_similarity_scores = cosine_similarity(
            input_vector,
            transformed_matrix
        )

        return content_similarity_scores
    def calculate_collaborative_filtering_similarities(
        self,
        song_name,
        artist_name,
        track_ids,
        songs_data,
        interaction_matrix
    ):
        # resolve the song using fuzzy search
        song_row, _ = self._resolve_song_index(
            song_name, artist_name, songs_data
        )

        # track_id of input song (song_row is a Series from resolve_song_row)
        input_track_id = song_row['track_id']

        # index value of track_id
        ind = np.where(track_ids == input_track_id)[0].item()

        # fetch the input vector
        input_array = interaction_matrix[ind]

        # get similarity scores
        collaborative_similarity_scores = cosine_similarity(
            input_array, interaction_matrix
        )

        return collaborative_similarity_scores

    def normalize_similarities(self, similarity_scores):
        """
        Rank-based percentile normalization.

        Min-max normalization fails when one signal is extremely sparse
        (e.g., 98% of collaborative scores are 0) — it maps all zero-score
        songs to exactly 0.0, permanently killing them regardless of
        content score. Rank-based normalization converts raw scores to
        percentile ranks (0 to 1), so every song gets a fair position
        based on where it sits in the ranking, not its raw magnitude.
        """
        from scipy.stats import rankdata
        ranks = rankdata(similarity_scores, method='average')
        # scale to [0, 1]
        normalized = (ranks - 1) / (len(ranks) - 1)
        return normalized

    def weighted_combination(
        self,
        content_based_scores,
        collaborative_filtering_scores
    ):
        weighted_scores = (
            self.weight_content_based * content_based_scores
        ) + (
            self.weight_collaborative * collaborative_filtering_scores
        )

        return weighted_scores

    def give_recommendations(self):
        song_row = self._get_input_song_row()
        # song_row is a Series from resolve_song_row, access scalar directly
        input_track_id = song_row["track_id"]

        # calculate content based similarities
        content_based_similarities = (
            self.calculate_content_based_similarities(
                song_name=self.song_name,
                artist_name=self.artist_name,
                songs_data=self.songs_data,
                transformed_matrix=self.transformed_matrix
            )
        )

        # calculate collaborative filtering similarities
        collaborative_filtering_similarities = (
            self.calculate_collaborative_filtering_similarities(
                song_name=self.song_name,
                artist_name=self.artist_name,
                track_ids=self.track_ids,
                songs_data=self.songs_data,
                interaction_matrix=self.interaction_matrix
            )
        )

        # align both score vectors on the shared track_id catalog (raw scores)
        content_scores_df = pd.DataFrame({
            "track_id": self.songs_data["track_id"].to_numpy(),
            "content_score": np.asarray(
                content_based_similarities
            ).ravel()
        })
        collaborative_scores_df = pd.DataFrame({
            "track_id": np.asarray(self.track_ids),
            "collaborative_score": np.asarray(
                collaborative_filtering_similarities
            ).ravel()
        })

        aligned_scores = (
            content_scores_df
            .merge(collaborative_scores_df, on="track_id", how="inner")
            .reset_index(drop=True)
        )

        if aligned_scores.empty:
            raise ValueError(
                "No overlapping tracks found between content and collaborative scores."
            )

        # normalize AFTER alignment so both vectors are the same length
        aligned_scores["content_score"] = self.normalize_similarities(
            aligned_scores["content_score"].values
        )
        aligned_scores["collaborative_score"] = self.normalize_similarities(
            aligned_scores["collaborative_score"].values
        )

        # weighted combination of similarities
        aligned_scores["weighted_score"] = self.weighted_combination(
            content_based_scores=aligned_scores["content_score"],
            collaborative_filtering_scores=aligned_scores["collaborative_score"]
        )

        recommendation_track_ids = (
            aligned_scores
            .sort_values(by="weighted_score", ascending=False)
            .head(self.number_of_recommendations + 1)["track_id"]
            .to_numpy()
        )

        scores_df = (
            aligned_scores[["track_id", "weighted_score"]]
            .sort_values(by="weighted_score", ascending=False)
            .head(self.number_of_recommendations + 1)
            .rename(columns={"weighted_score": "score"})
        )

        top_k_songs = (
            self.songs_data
            .loc[self.songs_data["track_id"].isin(recommendation_track_ids)]
            .merge(scores_df, on="track_id")
            .sort_values(by="score", ascending=False)
            .drop(columns=["track_id", "score"])
            .reset_index(drop=True)
        )

        return top_k_songs
    
if __name__ == "__main__":

    # load the transformed data
    transformed_data = load_npz("data/transformed_hybrid_data.npz")

    # load the interaction matrix
    interaction_matrix = load_npz("data/interaction_matrix.npz")

    # load the track_ids
    track_ids = np.load("data/track_ids.npy", allow_pickle=True)

    # load the songs data
    songs_data = pd.read_csv(
        "data/collab_filtered_data.csv",
        usecols=["track_id", "name", "artist", "spotify_preview_url"]
    )

    # create an instance of HybridRecommenderSystem
    hybrid_recommender = HybridRecommenderSystem(
        song_name="Love Story",
        artist_name="Taylor Swift",
        number_of_recommendations=10,
        weight_content_based=0.3,
        weight_collaborative=0.7,
        songs_data=songs_data,
        transformed_matrix=transformed_data,
        interaction_matrix=interaction_matrix,
        track_ids=track_ids
    )

    # get recommendations
    recommendations = hybrid_recommender.give_recommendations()
    print(recommendations)