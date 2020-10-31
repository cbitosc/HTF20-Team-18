import sys, json

#Read data from stdin
def read_in():
    lines = sys.stdin.readlines()
    # Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0]) 
    
lines = read_in()
df = pd.read_csv("netflix_titles.csv.csv")

df = df.loc[df["type"] == "TV Show"]

tvshow

features = ["director","cast","listed_in"]

for feature in features:
  df[feature]=df[feature].fillna("")
 
def combine(row):
  return row["director"] +" "+ row["cast"]+" " + row["listed_in"]

df["combined_features"]=df.apply(combine,axis=1)

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

cv = CountVectorizer()
count_matrix = cv.fit_transform(df["combined_features"])
cosine_model = cosine_similarity(count_matrix)

cosine_model_df = pd.DataFrame(cosine_model, index= df.title, columns=df.title)

def make_recom(movie_user_likes):
  return cosine_model_df[movie_user_likes].sort_values(ascending=False)[1:4]

results = make_recom(lines)