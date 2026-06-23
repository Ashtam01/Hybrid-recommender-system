import streamlit as st
from content_based_filtering import recommend
from collaborative_filtering import collaborative_recommendation
from hybrid_recommendations import HybridRecommenderSystem as hrs
from scipy.sparse import load_npz
import numpy as np
import pandas as pd
import os

# transformed data path
transformed_data_path = "data/transformed_data.npz"

# cleaned data path
cleaned_data_path = "data/cleaned_data.csv"

# collaborative filtering data paths
collab_filtered_data_path = "data/collab_filtered_data.csv"
track_ids_path = "data/track_ids.npy"
interaction_matrix_path = "data/interaction_matrix.npz"

# load the data
data = pd.read_csv(cleaned_data_path)

# load the transformed data
transformed_data = load_npz(transformed_data_path)

# load collaborative filtering data if exists
if os.path.exists(collab_filtered_data_path) and os.path.exists(track_ids_path):
    filtered_data = pd.read_csv(collab_filtered_data_path)
    track_ids = np.load(track_ids_path, allow_pickle=True)
else:
    filtered_data = pd.DataFrame()
    track_ids = np.array([])

# load the interaction matrix if exists
if os.path.exists(interaction_matrix_path):
    interaction_matrix = load_npz(interaction_matrix_path)
else:
    interaction_matrix = None

# load the transformed hybrid data
transformed_hybrid_data_path = "data/transformed_hybrid_data.npz"
if os.path.exists(transformed_hybrid_data_path):
    transformed_hybrid_data = load_npz(transformed_hybrid_data_path)
else:
    transformed_hybrid_data = None


# Title
st.title('Welcome to the Spotify Song Recommender!')

# Select Filtering Type
filtering_type = st.selectbox(
    label='Select the type of filtering:',
    options=[
        'Content-Based Filtering',
        'Collaborative Filtering',
        'Hybrid Recommender System'
    ],
    index=2
)

# Subheader
st.write('### Enter the name of a song and the recommender will suggest similar songs 🎵')

# Text Input
song_name = st.text_input('Enter a song name:')
artist_name = st.text_input('Enter the artist name:')

st.write('You entered:', song_name, 'by', artist_name)

# lowercase the input
song_name = song_name.lower()
artist_name = artist_name.lower()

# k recommendations
k = st.selectbox(
    'How many recommendations do you want?',
    [5, 10, 15, 20],
    index=1
)

def render_recommendations(recommendations: pd.DataFrame) -> None:
    for ind, recommendation in recommendations.iterrows():
        rec_song_name = str(recommendation.get('name', '')).title()
        rec_artist_name = str(recommendation.get('artist', '')).title()
        preview_url = recommendation.get('spotify_preview_url')

        if ind == 0:
            st.markdown("## Currently Playing")
            st.markdown(f"#### **{rec_song_name}** by **{rec_artist_name}**")
        elif ind == 1:
            st.markdown("### Next Up 🎵")
            st.markdown(f"#### {ind}. **{rec_song_name}** by **{rec_artist_name}**")
        else:
            st.markdown(f"#### {ind}. **{rec_song_name}** by **{rec_artist_name}**")

        if preview_url is not None and pd.notna(preview_url):
            st.audio(preview_url)
        st.write('---')


# Button
if st.button('Get Recommendations', key='get_recommendations_button'):
    if filtering_type == 'Content Based Filtering':
        if ((data["name"] == song_name) & (data["artist"] == artist_name)).any():
            st.write('Recommendations for', f"**{song_name}** by **{artist_name}**")

            recommendations = recommend(
                song_name,
                data,
                transformed_data,
                k
            )
            render_recommendations(recommendations)
        else:
            st.write(
                f"Sorry, we couldn't find **{song_name}** by **{artist_name}** in our database. "
                f"Please try another song."
            )

    elif filtering_type == 'Collaborative Filtering':
        collab_ready = (
            interaction_matrix is not None
            and not filtered_data.empty
            and {'name', 'artist', 'track_id'}.issubset(filtered_data.columns)
        )

        if not collab_ready:
            st.write(
                "Collaborative filtering data is not ready yet. "
                "Run the DVC pipeline to generate the collaborative outputs."
            )
        elif ((filtered_data["name"] == song_name) & (filtered_data["artist"] == artist_name)).any():
            st.write('Recommendations for', f"**{song_name}** by **{artist_name}**")

            recommendations = collaborative_recommendation(
                song_name=song_name,
                artist_name=artist_name,
                track_ids=track_ids,
                songs_data=filtered_data,
                interaction_matrix=interaction_matrix,
                k=k
            )

            if recommendations is not None and not recommendations.empty:
                render_recommendations(recommendations)
            else:
                st.write("No recommendations found.")
        else:
            st.write(
                f"Sorry, we couldn't find **{song_name}** by **{artist_name}** in our collaborative data. "
                f"Please try another song."
            )

    elif filtering_type == "Hybrid Recommender System":
        hybrid_ready = (
            transformed_hybrid_data is not None
            and interaction_matrix is not None
            and not filtered_data.empty
            and {'name', 'artist', 'track_id'}.issubset(filtered_data.columns)
        )

        if not hybrid_ready:
            st.write(
                "Hybrid recommendations are not ready yet. "
                "Run the DVC pipeline to generate the hybrid outputs."
            )
        elif ((filtered_data["name"] == song_name) & (filtered_data["artist"] == artist_name)).any():
            st.write('Recommendations for', f"**{song_name}** by **{artist_name}**")

            recommender = hrs(
                song_name=song_name,
                artist_name=artist_name,
                number_of_recommendations=k,
                weight_content_based=0.3,
                weight_collaborative=0.7,
                songs_data=filtered_data,
                transformed_matrix=transformed_hybrid_data,
                track_ids=track_ids,
                interaction_matrix=interaction_matrix
            )

            recommendations = recommender.give_recommendations()

            if recommendations is not None and not recommendations.empty:
                render_recommendations(recommendations)
            else:
                st.write("No recommendations found.")
        else:
            st.write(
                f"Sorry, we couldn't find **{song_name}** by **{artist_name}** in our database. "
                f"Please try another song."
            )