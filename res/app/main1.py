from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import pandas as pd
import pymongo
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

pd.set_option('display.max_columns', None)
load_dotenv()

app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== DB CONNECTION ================== #
url = os.getenv("DATABASE_URL")
client = pymongo.MongoClient(url)
db = client["bunnyStore_database"]

products_collection = db["products"]
comments_collection = db["comments"]
search_logs = db["search_logs"]
orders_collection = db["orders"]

# ================== LOAD PRODUCTS + TF-IDF ================== #
def load_products_and_vectors():
    products = []
    for p in products_collection.find():
        products.append({
            "_id": str(p["_id"]),
            "brand": p.get("brand", ""),
            "categories": p.get("categories", ""),
            "subcategories": p.get("subcategories", ""),
            "img": p.get("img", ""),
            "oldPrice": p.get("oldPrice", 0),
            "price": p.get("price", 0),
            "name": p.get("name", ""),
            "rate": p.get("rate", 0),
            "saleNumber": p.get("saleNumber", 0),
            "description": p.get("description", ""),
            "details": p.get("details", "")
        })

    df = pd.DataFrame(products)
    df["id"] = df["_id"]

    # Merge text fields
    df["text"] = df.apply(lambda row: " ".join([
        str(row.get("name", "")),
        str(row.get("description", "")),
        str(row.get("details", ""))
    ]), axis=1)

    # TF-IDF
    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english", lowercase=True)
    vectors = vectorizer.fit_transform(df["text"])

    return df, vectors

df_products, tfidf_vectors = load_products_and_vectors()
products_list = df_products.to_dict(orient="records")

# ================== UTILITY FUNCTIONS ================== #
def top_rated_products(products, limit=10):
    return sorted(products, key=lambda x: x.get("rate", 0), reverse=True)[:limit]

def get_user_purchased_ids(uid):
    user_orders = orders_collection.find({"customerInfo.userId": uid})
    purchased = []
    for o in user_orders:
        for item in o.get("products", []):
            purchased.append(str(item["id"]))
    return purchased

def search_keyword_products(df, keyword):
    keyword = keyword.lower()
    def score_row(row):
        score = 0
        fields = ["name", "description", "details", "categories", "skincare", "makeup", "brand"]
        weights = [5,4,3,3,2,2,3]
        for f,w in zip(fields,weights):
            if keyword in str(row.get(f,"")).lower():
                score += w
        return score
    df_copy = df.copy()
    df_copy["kw_score"] = df_copy.apply(score_row, axis=1)
    df_copy = df_copy[df_copy["kw_score"]>0]
    if df_copy.empty:
        return None
    return df_copy.sort_values("kw_score", ascending=False).iloc[0]["id"]

def recommend_by_product(product_id, top_k=10):
    if product_id not in df_products["id"].values:
        return top_rated_products(products_list)

    idx = df_products.index[df_products["id"]==product_id][0]
    sim_scores = cosine_similarity(tfidf_vectors[idx], tfidf_vectors).flatten()
    top_indices = [i for i in np.argsort(-sim_scores) if df_products.at[i,"id"] != product_id][:top_k]
    top_ids = df_products.iloc[top_indices]["id"].tolist()
    return [p for p in products_list if p["id"] in top_ids]

def recommend_by_purchased_items(purchased_ids, top_k=10):
    if not purchased_ids:
        return top_rated_products(products_list)
    last_id = purchased_ids[-1]
    return recommend_by_product(last_id, top_k)

def recommend_by_user(uid):
    user_orders = list(orders_collection.find({"customerInfo.userId": uid}))
    if not user_orders:
        return top_rated_products(products_list)

    order_ids = [str(o["_id"]) for o in user_orders]
    user_comments = list(comments_collection.find({"orderId":{"$in":order_ids}}))
    if not user_comments:
        purchased_ids = get_user_purchased_ids(uid)
        return recommend_by_purchased_items(purchased_ids)

    best_item = max(user_comments, key=lambda x: x.get("rate",0))
    product_id = best_item.get("productId")
    if not product_id:
        return top_rated_products(products_list)
    return recommend_by_product(product_id)

# ================== API ================== #
@app.get("/")
def keep_alive():
    return {"message":"alive"}

@app.post("/recommend")
async def recommend(request: Request):
    try:
        body = await request.json()
        uid = request.cookies.get("uid")
        mode = body.get("mode")
        product_id = body.get("productId")

        if mode=="rating":
            result = recommend_by_user(uid)
        elif mode=="product":
            result = recommend_by_product(product_id)
        elif mode=="keyword":
            logs = list(search_logs.find({"userId":uid}))
            if not logs:
                result=[]
            else:
                df_kw = pd.DataFrame(logs).sort_values("timestamp", ascending=False)
                top_kw = df_kw.iloc[0]["keyword"]
                main_pid = search_keyword_products(df_products, top_kw)
                if main_pid:
                    result = recommend_by_product(main_pid)
                else:
                    result=[]
        else:
            return JSONResponse(content={"message":"Invalid mode"}, status_code=400)

        return JSONResponse(content={"data": result})
    except Exception as e:
        print(e)
        return JSONResponse(content={"message":str(e)}, status_code=500)
