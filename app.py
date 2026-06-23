import streamlit as st
from content_based_filtering import recommend
from collaborative_filtering import collaborative_recommendation
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

# Title
st.title('Welcome to the Spotify Song Recommender!')

# Select Filtering Type
filtering_type = st.radio(
    "Select Filtering Type",
    ('Content Based Filtering', 'Collaborative Filtering')
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

# Button
if filtering_type == 'Content Based Filtering':
    if st.button('Get Recommendations'):

        if ((data["name"] == song_name) & (data["artist"] == artist_name)).any():

            st.write('Recommendations for', f"**{song_name}** by **{artist_name}**")

            recommendations = recommend(
                song_name,
                data,
                transformed_data,
                k
            )

            for ind, recommendation in recommendations.iterrows():

                rec_song_name = recommendation['name'].title()
                rec_artist_name = recommendation['artist'].title()

                if ind == 0:
                    st.markdown("## Currently Playing")
                    st.markdown(
                        f"#### **{rec_song_name}** by **{rec_artist_name}**"
                    )
                    st.audio(recommendation['spotify_preview_url'])
                    st.write('---')

                elif ind == 1:
                    st.markdown("### Next Up 🎵")
                    st.markdown(
                        f"#### {ind}. **{rec_song_name}** by **{rec_artist_name}**"
                    )
                    st.audio(recommendation['spotify_preview_url'])
                    st.write('---')

                else:
                    st.markdown(
                        f"#### {ind}. **{rec_song_name}** by **{rec_artist_name}**"
                    )
                    st.audio(recommendation['spotify_preview_url'])
                    st.write('---')

        else:
            st.write(
                f"Sorry, we couldn't find **{song_name}** by **{artist_name}** in our database. "
                f"Please try another song."
            )

elif filtering_type == 'Collaborative Filtering':
    if st.button('Get Recommendations'):
        if ((filtered_data["name"] == song_name) & (filtered_data["artist"] == artist_name)).any():
            st.write('Recommendations for', f"**{song_name}** by **{artist_name}**")
            recommendations = collaborative_recommendation(song_name=song_name,
                                                           artist_name=artist_name,
                                                           track_ids=track_ids,
                                                           songs_data=filtered_data)
            
            # Note: assuming collaborative_recommendation returns a similar dataframe to recommend()
            if recommendations is not None and not recommendations.empty:
                for ind, recommendation in recommendations.iterrows():

                    rec_song_name = recommendation['name'].title()
                    rec_artist_name = recommendation['artist'].title()

                    if ind == 0:
                        st.markdown("## Currently Playing")
                        st.markdown(
                            f"#### **{rec_song_name}** by **{rec_artist_name}**"
                        )
                        if 'spotify_preview_url' in recommendation and pd.notna(recommendation['spotify_preview_url']):
                            st.audio(recommendation['spotify_preview_url'])
                        st.write('---')

                    elif ind == 1:
                        st.markdown("### Next Up 🎵")
                        st.markdown(
                            f"#### {ind}. **{rec_song_name}** by **{rec_artist_name}**"
                        )
                        if 'spotify_preview_url' in recommendation and pd.notna(recommendation['spotify_preview_url']):
                            st.audio(recommendation['spotify_preview_url'])
                        st.write('---')

                    else:
                        st.markdown(
                            f"#### {ind}. **{rec_song_name}** by **{rec_artist_name}**"
                        )
                        if 'spotify_preview_url' in recommendation and pd.notna(recommendation['spotify_preview_url']):
                            st.audio(recommendation['spotify_preview_url'])
                        st.write('---')
            else:
                st.write("No recommendations found.")
        else:
            st.write(
                f"Sorry, we couldn't find **{song_name}** by **{artist_name}** in our database. "
                f"Please try another song."
            )